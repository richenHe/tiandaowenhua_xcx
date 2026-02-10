/**
 * 积分计算模块
 * 功德分和可提现积分的计算、推荐奖励处理
 * 所有比例和金额参数均从 ambassador_level_configs 表读取，禁止硬编码
 */

const { db } = require('common');
const { getLevelConfig } = require('./config');

/**
 * 计算推荐人应获得的功德分
 * 比例从 ambassador_level_configs 表读取
 * @param {number} orderAmount - 订单金额
 * @param {number} ambassadorLevel - 推荐人的大使等级（0普通/1准青鸾/2青鸾/3鸿鹄）
 * @param {string} courseType - 课程类型（'basic'初探班/'advanced'密训班）
 * @returns {Promise<Object>} { meritPoints, rate, description }
 */
async function calculateMeritPoints(orderAmount, ambassadorLevel, courseType) {
  const config = await getLevelConfig(ambassadorLevel);

  if (!config || !config.can_earn_reward) {
    return { meritPoints: 0, rate: 0, description: '该等级暂无功德分' };
  }

  let rate = 0;
  let description = '';

  if (courseType === 'basic') {
    rate = parseFloat(config.merit_rate_basic) || 0;
    description = `${config.level_name}推荐初探班奖励${(rate * 100).toFixed(0)}%`;
  } else if (courseType === 'advanced') {
    rate = parseFloat(config.merit_rate_advanced) || 0;
    description = `${config.level_name}推荐密训班奖励${(rate * 100).toFixed(0)}%`;
  }

  return {
    meritPoints: Math.round(orderAmount * rate * 100) / 100,
    rate,
    description
  };
}

/**
 * 计算推荐人应获得的可提现积分（现金积分）
 * 比例和解冻金额从 ambassador_level_configs 表读取
 * @param {number} orderAmount - 订单金额
 * @param {number} ambassadorLevel - 推荐人的大使等级
 * @param {number} frozenBalance - 推荐人当前冻结积分余额
 * @param {string} courseType - 课程类型
 * @returns {Promise<Object>} { cashPoints, unfreezePoints, isFrozenDeduction, description }
 */
async function calculateCashPoints(orderAmount, ambassadorLevel, frozenBalance, courseType) {
  const config = await getLevelConfig(ambassadorLevel);

  if (!config || !config.can_earn_reward) {
    return { cashPoints: 0, unfreezePoints: 0, isFrozenDeduction: false, description: '该等级暂无积分' };
  }

  // 密训班: 直接按配置比例发放可提现积分
  if (courseType === 'advanced') {
    const rate = parseFloat(config.cash_rate_advanced) || 0;
    return {
      cashPoints: Math.round(orderAmount * rate * 100) / 100,
      unfreezePoints: 0,
      isFrozenDeduction: false,
      description: `密训班${(rate * 100).toFixed(0)}%可提现积分`
    };
  }

  // 初探班: 优先解冻（解冻金额从数据库读取）
  const unfreezeAmount = parseFloat(config.unfreeze_per_referral) || 0;
  if (unfreezeAmount > 0 && frozenBalance >= unfreezeAmount) {
    return {
      cashPoints: 0,
      unfreezePoints: unfreezeAmount,
      isFrozenDeduction: true,
      description: `解冻${unfreezeAmount}积分`
    };
  }

  // 无冻结积分: 按配置比例发放可提现
  const rate = parseFloat(config.cash_rate_basic) || 0;
  return {
    cashPoints: Math.round(orderAmount * rate * 100) / 100,
    unfreezePoints: 0,
    isFrozenDeduction: false,
    description: `${(rate * 100).toFixed(0)}%可提现积分`
  };
}

/**
 * 处理推荐奖励的完整流程（在支付回调中调用）
 * @param {number} orderId - 订单 ID
 * @param {number} refereeId - 推荐人用户 ID
 * @param {number} orderAmount - 订单金额
 * @param {string} courseType - 课程类型
 * @returns {Promise<Object|null>} 奖励发放结果
 */
async function processReferralReward(orderId, refereeId, orderAmount, courseType) {
  // 查询推荐人信息
  const referees = await db.query(
    'SELECT * FROM users WHERE id = ? AND is_deleted = 0',
    [refereeId]
  );
  const referee = referees[0];

  // 从数据库读取配置判断是否有资格
  const config = await getLevelConfig(referee?.ambassador_level);
  if (!referee || !config || !config.can_earn_reward) {
    return null; // 无资格不发放奖励
  }

  const meritResult = await calculateMeritPoints(orderAmount, referee.ambassador_level, courseType);
  const cashResult = await calculateCashPoints(orderAmount, referee.ambassador_level, referee.cash_points_frozen || 0, courseType);

  // 查询订单号用于记录
  const orders = await db.query('SELECT order_no FROM orders WHERE id = ?', [orderId]);
  const orderNo = orders[0]?.order_no || '';

  await db.transaction(async (conn) => {
    // 更新功德分
    if (meritResult.meritPoints > 0) {
      await conn.execute(
        'UPDATE users SET merit_points = merit_points + ? WHERE id = ?',
        [meritResult.meritPoints, refereeId]
      );
      await conn.execute(
        'INSERT INTO merit_points_records (user_id, user_uid, _openid, type, source, amount, balance_after, order_no, remark) VALUES (?, ?, ?, 1, ?, ?, (SELECT merit_points FROM users WHERE id = ?), ?, ?)',
        [refereeId, referee.uid, referee._openid, courseType === 'basic' ? 1 : 2, meritResult.meritPoints, refereeId, orderNo, meritResult.description]
      );
    }

    // 解冻积分或发放可提现积分
    if (cashResult.unfreezePoints > 0) {
      await conn.execute(
        'UPDATE users SET cash_points_frozen = cash_points_frozen - ?, cash_points_available = cash_points_available + ? WHERE id = ?',
        [cashResult.unfreezePoints, cashResult.unfreezePoints, refereeId]
      );
      // 记录积分明细
      await conn.execute(
        'INSERT INTO cash_points_records (user_id, user_uid, _openid, type, source, amount, order_no, remark) VALUES (?, ?, ?, 3, ?, ?, ?, ?)',
        [refereeId, referee.uid, referee._openid, courseType === 'basic' ? 1 : 2, cashResult.unfreezePoints, orderNo, cashResult.description]
      );
    } else if (cashResult.cashPoints > 0) {
      await conn.execute(
        'UPDATE users SET cash_points_available = cash_points_available + ? WHERE id = ?',
        [cashResult.cashPoints, refereeId]
      );
      // 记录积分明细
      await conn.execute(
        'INSERT INTO cash_points_records (user_id, user_uid, _openid, type, source, amount, order_no, remark) VALUES (?, ?, ?, 1, ?, ?, ?, ?)',
        [refereeId, referee.uid, referee._openid, courseType === 'basic' ? 1 : 2, cashResult.cashPoints, orderNo, cashResult.description]
      );
    }
  });

  return {
    meritPoints: meritResult.meritPoints,
    cashPoints: cashResult.cashPoints,
    unfreezePoints: cashResult.unfreezePoints
  };
}

/**
 * 发放活动功德分
 * @param {number} userId - 用户ID
 * @param {string} activityType - 活动类型（1=线下课程/2=线上分享/3=志愿服务）
 * @param {string} activityName - 活动名称
 * @param {number} meritPoints - 功德分数量
 * @returns {Promise<Object>} 发放结果
 */
async function grantActivityMeritPoints(userId, activityType, activityName, meritPoints) {
  if (!userId || !activityType || !meritPoints || meritPoints <= 0) {
    throw new Error('参数错误：用户ID、活动类型和功德分必须有效');
  }

  return await db.transaction(async (conn) => {
    // 1. 更新用户功德分
    const updateResult = await conn.update(
      'UPDATE users SET merit_points = merit_points + ? WHERE id = ?',
      [meritPoints, userId]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('用户不存在');
    }

    // 2. 查询更新后的余额
    const [user] = await conn.query(
      'SELECT merit_points, uid, _openid FROM users WHERE id = ?',
      [userId]
    );

    // 3. 记录功德分明细
    await conn.insert(
      `INSERT INTO merit_points_records 
       (user_id, user_uid, _openid, type, source, amount, balance_after, activity_type, remark) 
       VALUES (?, ?, ?, 1, 3, ?, ?, ?, ?)`,
      [
        userId,
        user.uid,
        user._openid,
        meritPoints,
        user.merit_points,
        activityType,
        `活动奖励：${activityName}`
      ]
    );

    return {
      success: true,
      meritPoints,
      currentBalance: user.merit_points
    };
  });
}

/**
 * 回退活动功德分（删除活动记录时调用）
 * @param {number} activityId - 活动记录ID
 * @returns {Promise<Object>} 回退结果
 */
async function revokeActivityMeritPoints(activityId) {
  if (!activityId) {
    throw new Error('参数错误：活动记录ID必须提供');
  }

  // 1. 查询活动记录（验证是否已发放功德分）
  const [activity] = await db.query(
    `SELECT ar.*, u.uid, u._openid, u.merit_points 
     FROM activity_records ar 
     LEFT JOIN users u ON ar.user_id = u.id
     WHERE ar.id = ? AND ar.status = 1`,
    [activityId]
  );

  if (!activity) {
    return { success: false, message: '活动记录不存在或已删除' };
  }

  if (!activity.merit_points_granted || activity.merit_points_granted <= 0) {
    return { success: false, message: '该活动未发放功德分，无需回退' };
  }

  // 2. 检查用户当前功德分是否足够扣减
  if (activity.merit_points < activity.merit_points_granted) {
    console.warn(`用户 ${activity.user_id} 功德分不足，当前: ${activity.merit_points}, 需扣减: ${activity.merit_points_granted}`);
    // 注意：这里可以选择继续扣减（允许负数）或抛出错误
  }

  // 3. 事务处理：扣减功德分 + 记录明细
  return await db.transaction(async (conn) => {
    // 扣减功德分
    await conn.update(
      'UPDATE users SET merit_points = merit_points - ? WHERE id = ?',
      [activity.merit_points_granted, activity.user_id]
    );

    // 记录扣减明细
    const [updatedUser] = await conn.query(
      'SELECT merit_points FROM users WHERE id = ?',
      [activity.user_id]
    );

    await conn.insert(
      `INSERT INTO merit_points_records 
       (user_id, user_uid, _openid, type, source, amount, balance_after, activity_id, remark) 
       VALUES (?, ?, ?, 2, 3, ?, ?, ?, ?)`,
      [
        activity.user_id,
        activity.uid,
        activity._openid,
        -activity.merit_points_granted,
        updatedUser.merit_points,
        activityId,
        '活动记录删除，回退功德分'
      ]
    );

    return {
      success: true,
      revokedPoints: activity.merit_points_granted,
      currentBalance: updatedUser.merit_points
    };
  });
}

module.exports = {
  calculateMeritPoints,
  calculateCashPoints,
  processReferralReward,
  grantActivityMeritPoints,
  revokeActivityMeritPoints
};

