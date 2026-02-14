/**
 * 客户端接口：积分明细记录
 * Action: client:getCashPointsHistory
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize } = event;

  try {
    console.log('[getCashPointsHistory] 获取积分明细:', user.id);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('cash_points_records')
      .select('id, type, amount, frozen_after, available_after, order_no, withdraw_no, referee_user_id, referee_user_name, remark, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据
    const list = (result.list || []).map(record => ({
      id: record.id,
      change_amount: record.type === 1 ? record.amount : -record.amount, // type: 1=收入(正数), 2=支出(负数)
      balance_after: record.available_after, // 使用 available_after 作为余额
      change_type: record.type, // 1=收入, 2=支出
      related_id: record.order_no || record.withdraw_no, // 关联订单号或提现单号
      referee_user_id: record.referee_user_id,
      referee_user_name: record.referee_user_name,
      remark: record.remark,
      created_at: record.created_at
    }));

    console.log('[getCashPointsHistory] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getCashPointsHistory] 查询失败:', error);
    return response.error('获取积分明细失败', error);
  }
};
