/**
 * 客户端接口：订单列表
 * Action: getList
 *
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能（消除 N+1 查询）
 */
const { db } = require('../../common/db');
const { response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { status, page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[getList] 查询订单列表:`, { user_id: user.id, status, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

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
        referee:users!fk_orders_referee(real_name)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 添加状态过滤
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('pay_status', parseInt(status));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 检查并自动关闭超时订单
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15分钟（毫秒）
    const timeoutOrders = [];

    for (const order of result.list || []) {
      if (order.pay_status === 0) {
        const createdTime = new Date(order.created_at).getTime();
        if (now - createdTime >= timeout) {
          timeoutOrders.push(order.order_no);
          order.pay_status = 3; // 本地更新状态，用于返回
        }
      }
    }

    // 批量更新超时订单状态
    if (timeoutOrders.length > 0) {
      console.log(`[getList] 发现 ${timeoutOrders.length} 个超时订单，自动关闭:`, timeoutOrders);

      try {
        const { data: updateResult, error: updateError } = await db
          .from('orders')
          .update({
            pay_status: 3,
            updated_at: new Date().toISOString()
          })
          .in('order_no', timeoutOrders);

        if (updateError) {
          console.error('[getList] 更新超时订单状态失败:', updateError);
        } else {
          console.log('[getList] 成功更新超时订单状态:', updateResult);
        }
      } catch (updateErr) {
        console.error('[getList] 更新超时订单异常:', updateErr);
      }
    }

    // 格式化数据
    const list = (result.list || []).map(order => ({
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

    console.log(`[getList] 查询成功，共 ${result.total} 条`);

    return response.success({
      ...result,
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
