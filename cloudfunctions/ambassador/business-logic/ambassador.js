/**
 * 大使升级模块
 * 升级条件检查、升级执行（所有参数从 ambassador_level_configs 表读取）
 */

const { db } = require('common');
const { getLevelConfig } = require('./config');

/**
 * 检查用户是否满足升级条件
 * 升级金额从 ambassador_level_configs 表的 upgrade_payment_amount 字段读取
 * @param {Object} params - 参数对象
 * @param {number} params.user_id - 用户 ID
 * @param {number} params.current_level - 当前等级
 * @param {number} params.target_level - 目标等级
 * @param {string} params.upgrade_type - 升级类型
 * @returns {Promise<Object>} 升级条件检查结果 { eligible, reason, upgrade_fee }
 */
async function checkUpgradeEligibility({ user_id, current_level, target_level, upgrade_type }) {
  // 从数据库读取目标等级配置
  const targetConfig = await getLevelConfig(target_level);
  if (!targetConfig) {
    return { eligible: false, reason: '目标等级配置不存在', upgrade_fee: 0 };
  }

  // 检查等级递增
  if (current_level >= target_level) {
    return { eligible: false, reason: '已达到或超过目标等级', upgrade_fee: 0 };
  }

  const upgrade_fee = parseFloat(targetConfig.upgrade_payment_amount) || 0;

  return {
    eligible: true,
    reason: null,
    upgrade_fee,
    targetConfig
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

