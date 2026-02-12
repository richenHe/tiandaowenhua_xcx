/**
 * 客户端接口：提现记录列表
 * Action: client:getWithdrawRecords
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 20, status } = event;

  try {
    console.log('[getWithdrawRecords] 获取提现记录:', user.id);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 构建查询
    let queryBuilder = db
      .from('withdrawals')
      .select('id, withdraw_no, amount, account_type, account_info, status, audit_remark, apply_time, audit_time', { count: 'exact' })
      .eq('user_id', user.id);

    // 添加状态筛选
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行查询
    queryBuilder = queryBuilder
      .order('apply_time', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: records, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    console.log('[getWithdrawRecords] 查询成功，共', total, '条');
    return response.success({
      total: total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: records || []
    });

  } catch (error) {
    console.error('[getWithdrawRecords] 查询失败:', error);
    return response.error('获取提现记录失败', error);
  }
};
