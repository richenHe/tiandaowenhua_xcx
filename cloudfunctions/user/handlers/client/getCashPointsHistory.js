/**
 * 客户端接口：积分明细记录
 * Action: client:getCashPointsHistory
 *
 * type 枚举（与 DB 注释一致）：
 *   1=获得冻结（升级押金）
 *   2=解冻（首次推荐解冻）
 *   3=提现申请（扣减可用积分）
 *   4=提现成功（管理员标记转账完成，含发票，amount=0）
 *   5=提现失败退回（审核拒绝退回，amount 正数）
 *   6=系统调整
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize, type } = event;

  try {
    console.log('[getCashPointsHistory] 获取积分明细:', user.id);

    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('cash_points_records')
      .select(
        'id, type, amount, frozen_after, available_after, order_no, withdraw_no, referee_user_id, referee_user_name, remark, created_at',
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    // 支持按 type 过滤（如仅查提现相关：type=3/4/5）
    if (type !== undefined && type !== null) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 收集所有需要关联查询发票的 withdraw_no（type=5 的记录）
    const withdrawNos = (result.list || [])
      .filter(r => r.type === 4 && r.withdraw_no)
      .map(r => r.withdraw_no);

    // 批量查询发票信息（type=5 时通过 withdraw_no JOIN withdrawals.invoice_file_id）
    let invoiceMap = {};
    if (withdrawNos.length > 0) {
      const { data: withdrawals } = await db
        .from('withdrawals')
        .select('withdraw_no, invoice_file_id')
        .in('withdraw_no', withdrawNos);

      if (withdrawals) {
        withdrawals.forEach(w => {
          if (w.invoice_file_id) {
            invoiceMap[w.withdraw_no] = cloudFileIDToURL(w.invoice_file_id);
          }
        });
      }
    }

    // 格式化返回
    const list = (result.list || []).map(record => {
      // type=3 强制负数（提现申请扣积分），type=6 强制负数（商城兑换消费扣积分）
      // type=4（提现成功）amount=0，type=5（失败退回）amount 正数
      let changeAmount = record.amount;
      if (record.type === 3 || record.type === 6) {
        changeAmount = -Math.abs(record.amount);
      }

      const item = {
        id: record.id,
        change_amount: changeAmount,
        balance_after: record.available_after,
        change_type: record.type,
        related_id: record.order_no || record.withdraw_no,
        withdraw_no: record.withdraw_no,
        referee_user_id: record.referee_user_id,
        referee_user_name: record.referee_user_name,
        remark: record.remark,
        created_at: record.created_at,
        invoice_url: null
      };

      // type=4（提现成功）记录附加发票 URL
      if (record.type === 4 && record.withdraw_no && invoiceMap[record.withdraw_no]) {
        item.invoice_url = invoiceMap[record.withdraw_no];
      }

      return item;
    });

    console.log('[getCashPointsHistory] 查询成功，共', result.total, '条');
    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getCashPointsHistory] 查询失败:', error);
    return response.error('获取积分明细失败', error);
  }
};
