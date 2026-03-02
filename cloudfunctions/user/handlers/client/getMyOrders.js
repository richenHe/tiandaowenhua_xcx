/**
 * 客户端接口：获取我的订单列表
 * Action: client:getMyOrders
 *
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能
 */
const { db } = require('../../common/db');
const { response, executePaginatedQuery, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 100, pageSize, status } = event;

  try {
    console.log('[getMyOrders] 获取我的订单:', user.id, { page, page_size, pageSize, status });

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 100;

    // 构建查询（使用外键 fk_orders_referee）
    let queryBuilder = db
      .from('orders')
      .select(`
        *,
        referee:users!fk_orders_referee(id, real_name, nickname)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('id', { ascending: true });

    // 添加状态过滤
    if (status !== undefined && status !== null && status !== '') {
      const statusValue = parseInt(status);

      // 如果查询已取消订单(status=2)，包含已取消(2)和已关闭/超时(3)
      if (statusValue === 2) {
        queryBuilder = queryBuilder.in('pay_status', [2, 3]);
      } else {
        queryBuilder = queryBuilder.eq('pay_status', statusValue);
      }
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 检查并自动关闭超时订单
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15分钟（毫秒）
    const timeoutOrders = [];

    for (const order of result.list || []) {
      if (order.pay_status === 0) {
        // 数据库存储的是 CST（UTC+8），需加时区后缀才能被 Node.js 正确解析
        const createdTime = new Date(order.created_at.replace(' ', 'T') + '+08:00').getTime();
        const elapsed = now - createdTime;

        console.log(`[getMyOrders] 检查订单: ${order.order_no}, created: ${order.created_at}, elapsed: ${Math.floor(elapsed/1000)}秒, timeout: ${elapsed >= timeout}`);

        if (elapsed >= timeout) {
          timeoutOrders.push(order.order_no);
          order.pay_status = 2; // 超时视为已取消，本地更新状态用于返回
        }
      }
    }

    // 批量更新超时订单状态
    if (timeoutOrders.length > 0) {
      console.log(`[getMyOrders] 发现 ${timeoutOrders.length} 个超时订单，自动关闭:`, timeoutOrders);
      console.log('[getMyOrders] 准备执行 UPDATE 语句...');

      try {
        // 添加 .select() 确保返回更新结果
        const updateQuery = db
          .from('orders')
          .update({
            pay_status: 2,
            updated_at: formatDateTime(new Date())
          })
          .in('order_no', timeoutOrders)
          .select();  // 添加 select 确保返回结果

        console.log('[getMyOrders] UPDATE 查询已构建，开始执行...');

        const { data: updateResult, error: updateError } = await updateQuery;

        console.log('[getMyOrders] UPDATE 执行完成');
        console.log('[getMyOrders] updateResult:', JSON.stringify(updateResult));
        console.log('[getMyOrders] updateError:', JSON.stringify(updateError));

        if (updateError) {
          console.error('[getMyOrders] 更新超时订单状态失败:', updateError);
        } else {
          console.log('[getMyOrders] 成功更新超时订单状态，受影响行数:', updateResult?.length || 0);
        }
      } catch (updateErr) {
        console.error('[getMyOrders] 更新超时订单异常:', updateErr);
        console.error('[getMyOrders] 异常堆栈:', updateErr.stack);
      }
    }

    // 批量查询课程封面（order_type=1/2 时 related_id 为课程ID）
    const courseOrderIds = (result.list || [])
      .filter(o => o.order_type === 1 || o.order_type === 2)
      .map(o => o.related_id)
      .filter(id => id != null);

    const courseCovers = {};
    if (courseOrderIds.length > 0) {
      const { data: courses } = await db
        .from('courses')
        .select('id, cover_image')
        .in('id', [...new Set(courseOrderIds)]);
      (courses || []).forEach(c => { courseCovers[c.id] = c.cover_image || ''; });
    }

    // 格式化数据，附加课程封面
    const list = (result.list || []).map(order => ({
      ...order,
      referee_name: order.referee?.real_name || order.referee?.nickname || null,
      cover_image: courseCovers[order.related_id] || ''
    }));

    console.log('[getMyOrders] 查询成功，共', result.total, '条，超时订单:', timeoutOrders.length);
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getMyOrders] 查询失败:', error);
    return response.error('获取订单列表失败', error);
  }
};
