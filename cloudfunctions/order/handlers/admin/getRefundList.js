/**
 * 管理端接口：获取退款订单列表
 * Action: getRefundList
 *
 * 参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * - refund_status: 退款状态筛选（可选）
 * - keyword: 搜索关键词（订单号/用户姓名/手机号）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, pageSize = 20, refund_status, keyword } = event;

  try {
    console.log(`[admin:getRefundList] 管理员 ${admin.id} 获取退款列表`);

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询（使用外键名进行 JOIN）
    let query = db
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
        admin_remark,
        created_at,
        user:users!fk_orders_user(real_name, phone)
      `)
      .gt('refund_status', 0)
      .order('refund_time', { ascending: false });

    // 退款状态筛选
    if (refund_status != null && refund_status !== '') {
      query = query.eq('refund_status', parseInt(refund_status));
    }

    // 关键词搜索
    if (keyword) {
      query = query.or(`order_no.ilike.%${keyword}%,user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    // 分页
    const { data: refunds, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gt('refund_status', 0);

    if (refund_status != null && refund_status !== '') {
      countQuery = countQuery.eq('refund_status', parseInt(refund_status));
    }

    if (keyword) {
      countQuery = countQuery.or(`order_no.ilike.%${keyword}%,user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    const { count: total } = await countQuery;

    // 统计数据
    const statistics = {
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0
    };

    // 计算统计数据（基于当前筛选条件）
    let statsQuery = db
      .from('orders')
      .select('refund_status, refund_amount')
      .gt('refund_status', 0);

    if (refund_status != null && refund_status !== '') {
      statsQuery = statsQuery.eq('refund_status', parseInt(refund_status));
    }

    if (keyword) {
      statsQuery = statsQuery.or(`order_no.ilike.%${keyword}%,user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    const { data: statsData } = await statsQuery;

    if (statsData) {
      statsData.forEach(order => {
        if (order.refund_status === 1) statistics.pending++;
        else if (order.refund_status === 3) statistics.approved++;
        else if (order.refund_status === 4) statistics.rejected++;
        statistics.totalAmount += parseFloat(order.refund_amount || 0);
      });
    }

    // 处理数据 - 映射字段名称
    const processedRefunds = refunds.map(order => ({
      id: order.id,
      order_no: order.order_no,
      order_type: order.order_type,
      order_name: order.order_name,
      user_name: order.user?.real_name || '',
      user_phone: order.user?.phone || '',
      amount: order.refund_amount || order.final_amount,
      refund_reason: order.refund_reason,
      refund_status: order.refund_status,
      refund_time: order.refund_time,
      created_at: order.created_at,
      refund_status_text: getRefundStatusText(order.refund_status),
      pay_status_text: getPayStatusText(order.pay_status),
      order_type_text: getOrderTypeText(order.order_type)
    }));

    return response.success({
      list: processedRefunds,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      statistics
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getRefundList] 失败:', error);
    return response.error('获取退款列表失败', error);
  }
};

// 获取退款状态文本
function getRefundStatusText(status) {
  const statusMap = {
    0: '无退款',
    1: '申请退款',
    2: '退款处理中',
    3: '退款成功',
    4: '退款失败'
  };
  return statusMap[status] || '未知';
}

// 获取支付状态文本
function getPayStatusText(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '支付失败',
    3: '已取消'
  };
  return statusMap[status] || '未知';
}

// 获取订单类型文本
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

