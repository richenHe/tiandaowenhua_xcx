/**
 * 客户端接口：获取积分余额（可用/冻结/待结算）
 * Action: client:getCashPoints
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getCashPoints] 获取积分余额:', user.id);

    // CloudBase Query Builder 不支持 SUM() 聚合，改为取全量记录后 JS 求和
    // 累计获得 = type 2（可提现积分，含解冻和直接发放两种渠道）
    const { data: earnedRecords } = await db
      .from('cash_points_records')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 2);

    // 累计提现 = withdrawals status=2（已转账完成）
    const { data: completedWithdrawals } = await db
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 2);

    // 提现中 = withdrawals status=0（待审核）+ status=1（审核通过待转账）
    const { data: pendingWithdrawals0 } = await db
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 0);

    const { data: pendingWithdrawals1 } = await db
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 1);

    const sumAmount = (list) =>
      (list || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    const result = {
      available: parseFloat(user.cash_points_available || 0),
      frozen: parseFloat(user.cash_points_frozen || 0),
      pending: parseFloat(user.cash_points_pending || 0),
      withdrawing: sumAmount(pendingWithdrawals0) + sumAmount(pendingWithdrawals1),
      total_earned: sumAmount(earnedRecords),
      total_spent: sumAmount(completedWithdrawals),
    };

    console.log('[getCashPoints] 查询成功');
    return response.success(result);

  } catch (error) {
    console.error('[getCashPoints] 查询失败:', error);
    return response.error('获取积分余额失败', error);
  }
};
