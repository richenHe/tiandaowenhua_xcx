/**
 * 客户端接口：取消订单
 * Action: cancel
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_no, cancel_reason } = event;

  try {
    console.log(`[cancel] 取消订单:`, { user_id: user.id, order_no });

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

    // 3. 验证订单状态
    if (order.pay_status !== 0) {
      return response.error('只能取消待支付订单');
    }

    // 4. 更新订单状态
    await update('orders',
      {
        pay_status: 2, // 已取消
        updated_at: utils.formatDateTime(new Date())
      },
      { order_no }
    );

    console.log(`[cancel] 取消成功`);

    return response.success({
      order_no,
      status: 2,
      status_name: '已取消'
    }, '订单已取消');

  } catch (error) {
    console.error(`[cancel] 失败:`, error);
    return response.error('取消订单失败', error);
  }
};
