/**
 * 客户端接口：订单详情
 * Action: getDetail
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_no } = event;

  try {
    console.log(`[getDetail] 查询订单详情:`, { user_id: user.id, order_no });

    // 1. 参数验证
    if (!order_no) {
      return response.paramError('缺少订单号');
    }

    // 2. 查询订单信息
    const { data: orders, error: queryError } = await db
      .from('orders')
      .select('*')
      .eq('order_no', order_no)
      .eq('user_id', user.id)
      .single();

    if (queryError || !orders) {
      return response.notFound('订单不存在');
    }

    let order = orders;

    // 3. 检查订单是否超时（仅检查待支付订单）
    if (order.pay_status === 0) {
      const createdTime = new Date(order.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdTime) / 1000);
      const timeout = 15 * 60; // 15分钟

      if (elapsed >= timeout) {
        console.log(`[getDetail] 订单已超时，自动关闭:`, { order_no, elapsed, elapsedMinutes: Math.floor(elapsed / 60) });
        
        try {
          // 自动关闭订单
          const { data: updateResult, error: updateError } = await db
            .from('orders')
            .update({ 
              pay_status: 3,  // 已关闭（超时）
              updated_at: new Date().toISOString()
            })
            .eq('order_no', order_no);

          if (updateError) {
            console.error('[getDetail] 更新订单状态失败:', updateError);
          } else {
            console.log('[getDetail] 成功更新订单状态为已关闭:', updateResult);
            order.pay_status = 3;
          }
        } catch (updateErr) {
          console.error('[getDetail] 更新订单异常:', updateErr);
        }
      }
    }

    // 4. 查询推荐人信息
    let refereeInfo = null;
    if (order.referee_id) {
      const { data: referee } = await db
        .from('users')
        .select('id, uid, real_name, ambassador_level')
        .eq('id', order.referee_id)
        .single();

      if (referee) {
        refereeInfo = {
          referee: {
            id: referee.id,
            uid: referee.uid,
            real_name: referee.real_name,
            ambassador_level: referee.ambassador_level
          }
        };
      }
    }

    // 5. 查询关联课程信息（如果是课程订单）
    let courseInfo = null;
    if (order.order_type === 1 || order.order_type === 2) {
      const { data: course } = await db
        .from('courses')
        .select('id, name, type')
        .eq('id', order.related_id)
        .single();

      if (course) {
        courseInfo = {
          course_id: course.id,
          course_name: course.name,
          course_type: course.type
        };
      }
    }

    // 6. 构建响应数据
    const orderDetail = {
      order_no: order.order_no,
      user_id: order.user_id,
      order_type: order.order_type,
      order_name: order.order_name,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount || 0,
      final_amount: order.final_amount,
      user_name: order.user_name,
      user_phone: order.user_phone,
      pay_status: order.pay_status,
      pay_status_name: getPayStatusName(order.pay_status),
      pay_time: order.pay_time,
      pay_method: order.pay_method,
      transaction_id: order.transaction_id,
      is_reward_granted: order.is_reward_granted,
      reward_granted_at: order.reward_granted_at,
      created_at: order.created_at,
      expires_at: order.expire_at,
      ...refereeInfo,
      ...courseInfo
    };

    console.log(`[getDetail] 查询成功，订单状态: ${order.pay_status}`);

    return response.success(orderDetail, '查询成功');

  } catch (error) {
    console.error(`[getDetail] 失败:`, error);
    return response.error('查询订单详情失败', error);
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
