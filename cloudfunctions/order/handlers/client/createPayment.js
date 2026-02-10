/**
 * 客户端接口：发起支付
 * Action: createPayment
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_no } = event;

  try {
    console.log(`[createPayment] 发起支付:`, { user_id: user.id, order_no });

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
    if (order.pay_status === 1) {
      return response.error('订单已支付');
    }
    if (order.pay_status === 2) {
      return response.error('订单已取消');
    }
    if (order.pay_status === 3) {
      return response.error('订单已关闭');
    }

    // 4. 检查订单有效期
    const now = new Date();
    const expiresAt = new Date(order.expires_at);
    if (now > expiresAt) {
      // 更新订单状态为已关闭
      await update('orders',
        { pay_status: 3 },
        { order_no }
      );
      return response.error('订单已超时，请重新下单');
    }

    // 5. 验证订单金额
    if (order.final_amount <= 0) {
      return response.error('订单金额异常');
    }

    // 5. 调用 business-logic 层创建微信支付
    const payParams = await business.createWechatPayment({
      orderNo: order.order_no,
      amount: order.final_amount,
      description: order.order_name
    }, OPENID);

    // 6. 更新订单 prepay_id
    await update('orders',
      { prepay_id: payParams.prepayId },
      { order_no }
    );

    console.log(`[createPayment] 支付参数生成成功:`, { order_no, prepay_id: payParams.prepayId });

    return response.success({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      prepay_id: payParams.prepayId
    }, '支付参数生成成功');

  } catch (error) {
    console.error(`[createPayment] 失败:`, error);
    return response.error('发起支付失败', error);
  }
};
