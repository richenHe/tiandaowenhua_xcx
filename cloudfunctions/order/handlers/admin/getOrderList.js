/**
 * 管理端接口：订单列表
 * Action: getOrderList
 * 使用 CloudBase Query Builder 外键语法实现关联查询
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  // 兼容前端传 status 或 pay_status，以及 paymentMethod
  const { pay_status: _pay_status, status: _status, start_date, end_date, startDate, endDate, keyword, page = 1, page_size = 20, pageSize } = event;
  const pay_status = _pay_status != null ? _pay_status : _status;
  const finalStartDate = start_date || startDate;
  const finalEndDate = end_date || endDate;

  try {
    console.log(`[getOrderList] 管理员查询订单:`, { admin_id: admin.id, pay_status, keyword });

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询（使用 CloudBase Query Builder 外键语法）
    let queryBuilder = db
      .from('orders')
      .select(`
        *,
        user:users!fk_orders_user(id, real_name, phone),
        referee:users!fk_orders_referee(id, real_name, phone, referee_code)
      `, { count: 'exact' })
      .order('id', { ascending: true });

    // 支付状态筛选
    if (pay_status != null && pay_status !== '') {
      queryBuilder = queryBuilder.eq('pay_status', parseInt(pay_status));
    }

    // 日期范围筛选
    if (finalStartDate) {
      queryBuilder = queryBuilder.gte('created_at', finalStartDate);
    }
    if (finalEndDate) {
      queryBuilder = queryBuilder.lte('created_at', finalEndDate);
    }

    // 关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`order_no.like.%${keyword}%,order_name.like.%${keyword}%,user_name.like.%${keyword}%,user_phone.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据
    const formatOrderType = (type) => {
      switch (type) {
        case 1: return '课程订单';
        case 2: return '复训订单';
        case 3: return '升级订单';
        default: return '未知';
      }
    };

    const formatPayStatus = (status) => {
      const map = { 0: '未支付', 1: '已支付', 2: '已取消', 3: '已关闭', 4: '已退款' };
      return map[status] ?? '未知';
    };

    const list = (result.list || []).map(order => ({
      id: order.id,
      order_no: order.order_no,
      order_type: order.order_type,
      order_type_text: formatOrderType(order.order_type),
      order_name: order.order_name,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount || 0,
      final_amount: order.final_amount,
      paid_amount: order.final_amount,
      pay_status: order.pay_status,
      pay_status_text: formatPayStatus(order.pay_status),
      pay_time: order.pay_time,
      is_reward_granted: order.is_reward_granted,
      pay_method: order.pay_method || '',
      created_at: order.created_at,
      updated_at: order.updated_at,
      user_name: order.user?.real_name || '',
      user_nickname: order.user?.nickname || order.user?.real_name || '',
      user_phone: order.user?.phone || '',
      referee_name: order.referee?.real_name || '',
      referee_phone: order.referee?.phone || '',
      referee_code: order.referee?.referee_code || '',
      points_used: order.order_metadata?.points_used || 0
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getOrderList] 失败:', error);
    return response.error('查询订单列表失败', error);
  }
};
