/**
 * 客户端接口：获取我的订单列表
 * Action: client:getMyOrders
 * 
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 10, status } = event;

  try {
    console.log('[getMyOrders] 获取我的订单:', user.id);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 构建查询
    let queryBuilder = db
      .from('orders')
      .select(`
        *,
        referee:users!orders_referee_id_fkey(id, real_name, nickname)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('order_status', status);
    }

    const { data: orders, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 格式化数据
    const list = (orders || []).map(order => ({
      ...order,
      referee_name: order.referee?.real_name || order.referee?.nickname || null
    }));

    console.log('[getMyOrders] 查询成功，共', total, '条');
    return response.success({
      total,
      page,
      pageSize,
      list
    });

  } catch (error) {
    console.error('[getMyOrders] 查询失败:', error);
    return response.error('获取订单列表失败', error);
  }
};
