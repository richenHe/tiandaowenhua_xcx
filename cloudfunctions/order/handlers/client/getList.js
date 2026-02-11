/**
 * 客户端接口：订单列表
 * Action: getList
 * 
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能（消除 N+1 查询）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('common/utils');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { status, page = 1, page_size = 10 } = event;

  try {
    console.log(`[getList] 查询订单列表:`, { user_id: user.id, status, page });

    // 获取分页参数
    const { limit, offset } = getPagination(page, page_size);

    // 构建查询（一次查询获取所有数据，包括推荐人信息）
    let queryBuilder = db
      .from('orders')
      .select(`
        order_no,
        order_type,
        order_name,
        final_amount,
        pay_status,
        pay_time,
        is_reward_granted,
        created_at,
        expire_at,
        referee:users!orders_referee_id_fkey(real_name)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加状态过滤
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('pay_status', parseInt(status));
    }

    const { data: orders, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 格式化数据
    const list = (orders || []).map(order => ({
      order_no: order.order_no,
      order_type: order.order_type,
      order_name: order.order_name,
      final_amount: order.final_amount,
      pay_status: order.pay_status,
      pay_status_name: getPayStatusName(order.pay_status),
      pay_time: order.pay_time,
      referee_name: order.referee?.real_name || null,
      is_reward_granted: order.is_reward_granted,
      created_at: order.created_at,
      expires_at: order.expire_at
    }));

    console.log(`[getList] 查询成功，共 ${total} 条`);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getList] 失败:`, error);
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
