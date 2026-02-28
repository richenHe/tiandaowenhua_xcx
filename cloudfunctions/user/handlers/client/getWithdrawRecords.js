/**
 * 客户端接口：提现记录列表
 * Action: client:getWithdrawRecords
 *
 * 返回用户的提现申请记录，包含电子发票展示 URL
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize, status } = event;

  try {
    console.log('[getWithdrawRecords] 获取提现记录:', user.id);

    const finalPageSize = page_size || pageSize || 20;

    // 构建查询，新增 invoice_file_id、transfer_time 字段
    let queryBuilder = db
      .from('withdrawals')
      .select(
        'id, withdraw_no, amount, account_type, account_info, status, audit_remark, reject_reason, apply_time, audit_time, transfer_time, invoice_file_id',
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('apply_time', { ascending: false });

    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const list = (result.list || []).map(item => {
      // 解析收款银行信息
      let accountInfo = null;
      try {
        accountInfo = item.account_info
          ? (typeof item.account_info === 'string' ? JSON.parse(item.account_info) : item.account_info)
          : null;
      } catch (e) {}

      // 电子发票 fileID → CDN URL（无需网络请求，直接转换）
      const invoice_url = item.invoice_file_id ? cloudFileIDToURL(item.invoice_file_id) : null;

      return {
        id: item.id,
        withdraw_no: item.withdraw_no,
        amount: item.amount,
        account_type: item.account_type,
        bank_account_name: accountInfo?.bank_account_name || '',
        bank_name: accountInfo?.bank_name || '',
        bank_account_number: accountInfo?.bank_account_number || '',
        status: item.status,
        audit_remark: item.audit_remark,
        reject_reason: item.reject_reason,
        apply_time: item.apply_time,
        audit_time: item.audit_time,
        transfer_time: item.transfer_time,
        invoice_url,
        created_at: item.apply_time
      };
    });

    console.log('[getWithdrawRecords] 查询成功，共', result.total, '条');
    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getWithdrawRecords] 查询失败:', error);
    return response.error('获取提现记录失败', error);
  }
};
