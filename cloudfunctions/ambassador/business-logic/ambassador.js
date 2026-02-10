/**
 * 大使升级模块
 * 升级条件检查、升级执行（所有参数从 ambassador_level_configs 表读取）
 */

const { db } = require('common');
const { getLevelConfig } = require('./config');

/**
 * 检查用户是否满足升级条件
 * 升级金额从 ambassador_level_configs 表的 upgrade_payment_amount 字段读取
 * @param {number} userId - 用户 ID
 * @param {number} targetLevel - 目标等级（1准青鸾/2青鸾/3鸿鹄）
 * @returns {Promise<Object>} 升级条件检查结果
 */
async function checkUpgradeEligibility(userId, targetLevel) {
  // 从数据库读取目标等级配置
  const targetConfig = await getLevelConfig(targetLevel);
  if (!targetConfig) {
    return { canUpgrade: false, conditions: [{ condition: '目标等级配置不存在', isMet: false }] };
  }

  // 查询用户当前信息
  const users = await db.query(
    'SELECT id, ambassador_level, ambassador_start_date FROM users WHERE id = ? AND is_deleted = 0',
    [userId]
  );
  const user = users[0];
  if (!user) {
    return { canUpgrade: false, conditions: [{ condition: '用户不存在', isMet: false }] };
  }

  // 检查等级递增
  if (user.ambassador_level >= targetLevel) {
    return { canUpgrade: false, conditions: [{ condition: '已达到或超过目标等级', isMet: false }] };
  }

  // requiredAmount 从数据库读取
  const requiredAmount = parseFloat(targetConfig.upgrade_payment_amount) || 0;
  const conditions = [];

  // 根据目标等级确定升级条件
  if (targetLevel === 1) {
    // 升级为准青鸾：推荐初探班成功1次
    const referralCount = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE referee_id = ? AND pay_status = 1 AND course_type = \'basic\' AND is_deleted = 0',
      [userId]
    );
    conditions.push({
      condition: '推荐初探班成功1次',
      isMet: referralCount[0].count >= 1
    });
  } else if (targetLevel === 2) {
    // 升级为青鸾：签署青鸾大使协议
    const agreements = await db.query(
      'SELECT COUNT(*) as count FROM ambassador_agreements WHERE user_id = ? AND agreement_type = 2 AND status = 1',
      [userId]
    );
    conditions.push({
      condition: '签署《青鸾大使协议》',
      isMet: agreements[0].count > 0,
      actionUrl: '/pages/ambassador/contract-sign/index?level=2'
    });
  } else if (targetLevel === 3) {
    // 升级为鸿鹄：签署鸿鹄大使协议 + 支付升级费用
    const agreements = await db.query(
      'SELECT COUNT(*) as count FROM ambassador_agreements WHERE user_id = ? AND agreement_type = 3 AND status = 1',
      [userId]
    );
    conditions.push({
      condition: '签署《鸿鹄大使协议》',
      isMet: agreements[0].count > 0,
      actionUrl: '/pages/ambassador/contract-sign/index?level=3'
    });

    if (requiredAmount > 0) {
      conditions.push({
        condition: `支付升级费用 ¥${requiredAmount}`,
        isMet: false, // 支付在升级流程中处理
        actionUrl: '/pages/order/payment/index?type=upgrade&level=3'
      });
    }
  }

  const canUpgrade = conditions.every(c => c.isMet);
  const upgradeType = requiredAmount > 0 ? 1 : 2; // 1=支付类型 2=协议类型

  return {
    canUpgrade,
    upgradeType,
    conditions,
    requiredAmount
  };
}

/**
 * 执行大使升级操作
 * @param {number} userId - 用户 ID
 * @param {number} targetLevel - 目标等级
 * @param {number} upgradeType - 升级类型（1=支付/2=协议）
 * @param {number|null} orderId - 订单 ID（支付类型时必填）
 * @returns {Promise<Object>} 升级结果
 */
async function processAmbassadorUpgrade(userId, targetLevel, upgradeType, orderId = null) {
  // 从数据库读取目标等级配置
  const targetConfig = await getLevelConfig(targetLevel);
  if (!targetConfig) {
    throw new Error('目标等级配置不存在');
  }

  // 查询用户当前信息
  const users = await db.query(
    'SELECT id, ambassador_level, uid, _openid FROM users WHERE id = ? AND is_deleted = 0',
    [userId]
  );
  const user = users[0];
  if (!user) {
    throw new Error('用户不存在');
  }

  const fromLevel = user.ambassador_level;
  const frozenPoints = parseFloat(targetConfig.frozen_points) || 0;
  const giftBasic = targetConfig.gift_quota_basic || 0;
  const giftAdvanced = targetConfig.gift_quota_advanced || 0;

  await db.transaction(async (conn) => {
    // 1. 更新用户等级
    await conn.execute(
      'UPDATE users SET ambassador_level = ?, ambassador_start_date = CURDATE() WHERE id = ?',
      [targetLevel, userId]
    );

    // 2. 发放冻结积分（从数据库读取 frozen_points）
    if (frozenPoints > 0) {
      await conn.execute(
        'UPDATE users SET cash_points_frozen = cash_points_frozen + ? WHERE id = ?',
        [frozenPoints, userId]
      );
      // 记录积分明细
      await conn.execute(
        'INSERT INTO cash_points_records (user_id, user_uid, _openid, type, source, amount, remark) VALUES (?, ?, ?, 2, 3, ?, ?)',
        [userId, user.uid, user._openid, frozenPoints, `升级${targetConfig.level_name}获得冻结积分`]
      );
    }

    // 3. 发放名额（从数据库读取 gift_quota_basic / gift_quota_advanced）
    if (giftBasic > 0) {
      await conn.execute(
        'INSERT INTO ambassador_quotas (user_id, _openid, ambassador_level, quota_type, source_type, total_quantity, remaining_quantity, expire_date, status) VALUES (?, ?, ?, 1, 1, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1)',
        [userId, user._openid, targetLevel, giftBasic, giftBasic]
      );
    }
    if (giftAdvanced > 0) {
      await conn.execute(
        'INSERT INTO ambassador_quotas (user_id, _openid, ambassador_level, quota_type, source_type, total_quantity, remaining_quantity, expire_date, status) VALUES (?, ?, ?, 2, 1, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1)',
        [userId, user._openid, targetLevel, giftAdvanced, giftAdvanced]
      );
    }

    // 4. 记录升级日志
    await conn.execute(
      'INSERT INTO ambassador_upgrade_logs (user_id, _openid, from_level, to_level, upgrade_type, order_id, rewards) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, user._openid, fromLevel, targetLevel, upgradeType, orderId, JSON.stringify({ frozenPoints, giftBasic, giftAdvanced })]
    );
  });

  return {
    success: true,
    newLevel: targetLevel,
    levelName: targetConfig.level_name,
    rewards: {
      frozenPoints,
      quotas: giftBasic + giftAdvanced
    }
  };
}

module.exports = {
  checkUpgradeEligibility,
  processAmbassadorUpgrade
};

