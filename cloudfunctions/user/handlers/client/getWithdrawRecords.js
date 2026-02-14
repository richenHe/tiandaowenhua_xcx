/**
 * 客户端接口：提现记录列表
 * Action: client:getWithdrawRecords
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize, status } = event;

  try {
    console.log('[getWithdrawRecords] 获取提现记录:', user.id);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('withdrawals')
      .select('id, withdraw_no, amount, account_type, account_info, status, audit_remark, apply_time, audit_time', { count: 'exact' })
      .eq('user_id', user.id)
      .order('apply_time', { ascending: false });

    // 添加状态筛选
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    console.log('[getWithdrawRecords] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list: result.list || []
    });

  } catch (error) {
    console.error('[getWithdrawRecords] 查询失败:', error);
    return response.error('获取提现记录失败', error);
  }
};
