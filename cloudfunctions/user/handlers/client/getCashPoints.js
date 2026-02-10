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

    // 查询积分统计（总获得/总消耗）
    const { data: stats } = await db
      .from('cash_points_records')
      .select(`
        SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as total_spent
      `)
      .eq('user_id', user.id);

    // 查询待审核提现金额
    const { data: withdrawals } = await db
      .from('withdrawals')
      .select('SUM(amount) as withdrawing_amount')
      .eq('user_id', user.id)
      .eq('status', 0);

    const result = {
      available: user.cash_points_available || 0,      // 可用积分
      frozen: user.cash_points_frozen || 0,            // 冻结积分
      pending: user.cash_points_pending || 0,          // 待结算积分
      withdrawing: withdrawals?.[0]?.withdrawing_amount || 0,  // 提现中金额
      total_earned: stats?.[0]?.total_earned || 0,     // 总获得
      total_spent: stats?.[0]?.total_spent || 0        // 总消耗
    };

    console.log('[getCashPoints] 查询成功');
    return response.success(result);

  } catch (error) {
    console.error('[getCashPoints] 查询失败:', error);
    return response.error('获取积分余额失败', error);
  }
};
