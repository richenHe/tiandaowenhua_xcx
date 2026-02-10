/**
 * 客户端接口：订单详情
 * Action: getDetail
 */
const { findOne } = require('../../common/db');
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
    const order = await findOne('orders', {
      order_no,
      user_id: user.id
    });

    if (!order) {
      return response.notFound('订单不存在');
    }

    // 3. 查询推荐人信息
    let refereeInfo = null;
    if (order.referee_id) {
      const referee = await findOne('users', { id: order.referee_id });
      if (referee) {
        refereeInfo = {
          referee_id: referee.id,
          referee_uid: referee.uid,
          referee_name: referee.real_name,
          referee_level: referee.ambassador_level
        };
      }
    }

    // 4. 查询关联课程信息（如果是课程订单）
    let courseInfo = null;
    if (order.order_type === 1 || order.order_type === 2) {
      const course = await findOne('courses', { id: order.related_id });
      if (course) {
        courseInfo = {
          course_id: course.id,
          course_name: course.course_name,
          course_type: course.type
        };
      }
    }

    // 5. 构建响应数据
    const orderDetail = {
      order_no: order.order_no,
      user_id: order.user_id,
      order_type: order.order_type,
      order_name: order.order_name,
      original_amount: order.original_amount,
      final_amount: order.final_amount,
      pay_status: order.pay_status,
      pay_status_name: getPayStatusName(order.pay_status),
      pay_time: order.pay_time,
      pay_method: order.pay_method,
      transaction_id: order.transaction_id,
      is_reward_granted: order.is_reward_granted,
      reward_granted_at: order.reward_granted_at,
      created_at: order.created_at,
      expires_at: order.expires_at,
      ...refereeInfo,
      ...courseInfo
    };

    console.log(`[getDetail] 查询成功`);

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
