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

    // 构建查询条件
    const where = { user_id: user.id };
    if (status !== undefined) {
      where.status = status;
    }

    // 查询提现记录
    const records = await query('withdrawals', {
      columns: 'id, withdraw_no, amount, withdraw_type, account_info, status, audit_remark, created_at, audited_at',
      where,
      limit,
      offset,
      orderBy: { column: 'created_at', ascending: false }
    });

    // 查询总数
    const total = await count('withdrawals', where);

    console.log('[getWithdrawRecords] 查询成功，共', total, '条');
    return response.success({
      total,
      page,
      pageSize,
      list: records
    });

  } catch (error) {
    console.error('[getWithdrawRecords] 查询失败:', error);
    return response.error('获取提现记录失败', error);
  }
};
