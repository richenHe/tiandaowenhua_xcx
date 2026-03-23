/**
 * 管理端接口：获取退款订单列表
 * Action: getRefundList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - refund_status: 退款状态筛选（可选，1=申请退款/3=已退款/4=已驳回）
 * - keyword: 搜索关键词（订单号/用户姓名/手机号）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, refund_status, order_type, keyword, start_date, end_date } = event;

  try {
    console.log(`[admin:getRefundList] 管理员 ${admin.id} 获取退款列表`);

    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('orders')
      .select(`
        id,
        order_no,
        order_type,
        order_name,
        user_id,
        user_name,
        user_phone,
        original_amount,
        discount_amount,
        final_amount,
        referee_name,
        pay_status,
        pay_time,
        transaction_id,
        refund_status,
        refund_amount,
        refund_time,
        refund_reason,
        refund_applied_at,
        refund_reject_reason,
        refund_audit_admin_id,
        refund_audit_time,
        refund_invoice_file_id,
        refund_transfer_no,
        admin_remark,
        created_at,
        user:users!fk_orders_user(real_name, phone, bank_account_name, bank_name, bank_account_number)
      `, { count: 'exact' })
      .gt('refund_status', 0)
      .order('refund_applied_at', { ascending: false })
      .order('id', { ascending: false });

    if (refund_status != null && refund_status !== '') {
      queryBuilder = queryBuilder.eq('refund_status', parseInt(refund_status));
    }

    // 按退款分类筛选（1=课程退款，2=复训费退款）
    if (order_type != null && order_type !== '') {
      queryBuilder = queryBuilder.eq('order_type', parseInt(order_type));
    }

    // 日期范围筛选（按退款申请时间 refund_applied_at 过滤）
    if (start_date) {
      queryBuilder = queryBuilder.gte('refund_applied_at', start_date);
    }
    if (end_date) {
      queryBuilder = queryBuilder.lte('refund_applied_at', end_date + ' 23:59:59');
    }

    if (keyword) {
      queryBuilder = queryBuilder.or(`order_no.like.%${keyword}%,user_name.like.%${keyword}%,user_phone.like.%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 独立统计查询（不受搜索/筛选条件影响，对标 getWithdrawList）
    const [
      { count: pendingCount },
      { count: transferredCount },
      { count: rejectedCount },
      { data: pendingAmountData }
    ] = await Promise.all([
      db.from('orders').select('id', { count: 'exact', head: true }).eq('refund_status', 1),
      db.from('orders').select('id', { count: 'exact', head: true }).eq('refund_status', 3),
      db.from('orders').select('id', { count: 'exact', head: true }).eq('refund_status', 4),
      db.from('orders').select('refund_amount, final_amount').eq('refund_status', 1)
    ]);

    const pendingAmount = (pendingAmountData || []).reduce(
      (sum, row) => sum + parseFloat(row.refund_amount || row.final_amount || 0), 0
    );

    const statistics = {
      pending: pendingCount || 0,
      transferred: transferredCount || 0,
      rejected: rejectedCount || 0,
      pendingAmount
    };

    // 获取审核管理员信息
    const adminIds = [...new Set((result.list || []).map(o => o.refund_audit_admin_id).filter(id => id))];
    let adminMap = {};
    if (adminIds.length > 0) {
      const { data: admins } = await db
        .from('admin_users')
        .select('id, username, real_name')
        .in('id', adminIds);
      if (admins) {
        admins.forEach(a => { adminMap[a.id] = a; });
      }
    }

    const list = (result.list || []).map(order => ({
      id: order.id,
      order_no: order.order_no,
      order_type: order.order_type,
      order_name: order.order_name,
      user_name: order.user?.real_name || order.user_name || '',
      user_phone: order.user?.phone || order.user_phone || '',
      bank_account_name: order.user?.bank_account_name || '',
      bank_name: order.user?.bank_name || '',
      bank_account_number: order.user?.bank_account_number || '',
      amount: order.refund_amount || order.final_amount,
      final_amount: order.final_amount,
      refund_reason: order.refund_reason,
      refund_status: order.refund_status,
      refund_applied_at: order.refund_applied_at,
      refund_time: order.refund_time,
      refund_reject_reason: order.refund_reject_reason,
      refund_audit_time: order.refund_audit_time,
      refund_transfer_no: order.refund_transfer_no,
      refund_invoice_file_id: order.refund_invoice_file_id,
      invoice_url: order.refund_invoice_file_id ? (cloudFileIDToURL ? cloudFileIDToURL(order.refund_invoice_file_id) : order.refund_invoice_file_id) : '',
      created_at: order.created_at,
      refund_status_text: getRefundStatusText(order.refund_status),
      pay_status_text: getPayStatusText(order.pay_status),
      order_type_text: getOrderTypeText(order.order_type),
      audit_admin: order.refund_audit_admin_id ? adminMap[order.refund_audit_admin_id] : null
    }));

    return response.success({
      ...result,
      list,
      statistics
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getRefundList] 失败:', error);
    return response.error('获取退款列表失败', error);
  }
};

function getRefundStatusText(status) {
  const statusMap = {
    0: '无退款',
    1: '申请退款',
    2: '退款处理中',
    3: '已退款',
    4: '已驳回'
  };
  return statusMap[status] || '未知';
}

function getPayStatusText(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '支付失败',
    3: '已取消'
  };
  return statusMap[status] || '未知';
}

function getOrderTypeText(type) {
  const typeMap = {
    1: '课程订单',
    2: '复训订单',
    3: '升级订单',
    4: '积分兑换',
    5: '赠课订单'
  };
  return typeMap[type] || '未知';
}
