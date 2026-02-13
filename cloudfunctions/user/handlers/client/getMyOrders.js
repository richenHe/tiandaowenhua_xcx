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
  const { page = 1, pageSize = 100, status } = event;

  try {
    console.log('[getMyOrders] 获取我的订单:', user.id, { page, pageSize, status });

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 构建查询（使用外键 fk_orders_referee）
    let queryBuilder = db
      .from('orders')
      .select(`
        *,
        referee:users!fk_orders_referee(id, real_name, nickname)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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

    const { data: orders, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 检查并自动关闭超时订单
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15分钟（毫秒）
    const timeoutOrders = [];

    for (const order of orders || []) {
      if (order.pay_status === 0) {
        const createdTime = new Date(order.created_at).getTime();
        const elapsed = now - createdTime;
        
        console.log(`[getMyOrders] 检查订单: ${order.order_no}, created: ${order.created_at}, elapsed: ${Math.floor(elapsed/1000)}秒, timeout: ${elapsed >= timeout}`);
        
        if (elapsed >= timeout) {
          timeoutOrders.push(order.order_no);
          order.pay_status = 3; // 本地更新状态，用于返回
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
            pay_status: 3,
            updated_at: new Date().toISOString()
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

    // 格式化数据
    const list = (orders || []).map(order => ({
      ...order,
      referee_name: order.referee?.real_name || order.referee?.nickname || null
    }));

    console.log('[getMyOrders] 查询成功，共', total, '条，超时订单:', timeoutOrders.length);
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
