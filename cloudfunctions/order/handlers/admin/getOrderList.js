/**
 * 管理端接口：订单列表
 * Action: getOrderList
 * 优化：使用 LEFT JOIN 一次性获取用户和推荐人信息，消除 N+1 查询
 */
const { from, raw } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { pay_status, start_date, end_date, keyword, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getOrderList] 管理员查询订单:`, { admin_id: admin.id, pay_status, keyword });

    // 1. 构建基础查询
    let queryBuilder = from('orders')
      .leftJoin('users as u', 'orders.user_id', 'u.id')
      .leftJoin('users as referee_user', 'orders.referee_id', 'referee_user.id')
      .select(
        'orders.order_no',
        'orders.order_type',
        'orders.order_name',
        'orders.final_amount',
        'orders.pay_status',
        'orders.pay_time',
        'orders.is_reward_granted',
        'orders.created_at',
        'u.real_name as user_name',
        'u.phone as user_phone',
        'referee_user.real_name as referee_name'
      );

    // 2. 支付状态过滤
    if (pay_status !== undefined && pay_status !== null && pay_status !== '') {
      queryBuilder = queryBuilder.where('orders.pay_status', parseInt(pay_status));
    }

    // 3. 时间范围过滤
    if (start_date) {
      queryBuilder = queryBuilder.where('orders.created_at', '>=', start_date);
    }
    if (end_date) {
      queryBuilder = queryBuilder.where('orders.created_at', '<=', end_date);
    }

    // 4. 关键词过滤（订单号、用户姓名、手机号）
    if (keyword) {
      queryBuilder = queryBuilder.and(qb => {
        qb.where('orders.order_no', 'like', `%${keyword}%`)
          .orWhere('u.real_name', 'like', `%${keyword}%`)
          .orWhere('u.phone', 'like', `%${keyword}%`);
      });
    }

    // 5. 查询总数
    const countQuery = queryBuilder.clone();
    const { total } = await countQuery.count('orders.order_no as total').then(res => res[0] || { total: 0 });

    // 6. 获取分页参数并查询列表
    const { limit, offset } = getPagination(page, page_size);
    const orders = await queryBuilder
      .orderBy('orders.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // 7. 格式化结果
    const list = orders.map(order => ({
      order_no: order.order_no,
      user_name: order.user_name || '未知',
      user_phone: order.user_phone ? order.user_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      order_type: order.order_type,
      order_name: order.order_name,
      final_amount: order.final_amount,
      pay_status: order.pay_status,
      pay_status_name: getPayStatusName(order.pay_status),
      pay_time: order.pay_time,
      referee_name: order.referee_name,
      is_reward_granted: order.is_reward_granted,
      created_at: order.created_at
    }));

    console.log(`[getOrderList] 查询成功，共 ${total} 条`);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getOrderList] 失败:`, error);
    return response.error('查询订单列表失败', error);
  }
};

/**
 * 获取支付状态名称
 */
function getPayStatusName(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已关闭',
    4: '已退款'
  };
  return statusMap[status] || '未知';
}
