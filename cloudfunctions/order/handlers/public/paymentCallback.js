/**
 * 公开接口：支付回调
 * Action: paymentCallback
 *
 * 微信支付成功回调，根据不同订单类型执行相应业务逻辑
 */
const { findOne, insert, update, query, db } = require('../../common/db');
const { response, utils } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID } = context;

  try {
    console.log(`[paymentCallback] 收到支付回调`);

    // 1. 验证支付回调签名
    const paymentResult = business.verifyPaymentCallback(event);

    if (!paymentResult || paymentResult.trade_state !== 'SUCCESS') {
      console.error(`[paymentCallback] 支付未成功:`, paymentResult);
      return response.error('支付未成功');
    }

    const { out_trade_no, transaction_id, amount } = paymentResult;

    // 2. 查询订单
    const order = await findOne('orders', { order_no: out_trade_no });
    if (!order) {
      console.error(`[paymentCallback] 订单不存在:`, out_trade_no);
      return response.error('订单不存在');
    }

    // 3. 检查订单是否已支付（幂等性）
    if (order.pay_status === 1) {
      console.log(`[paymentCallback] 订单已支付，跳过处理:`, out_trade_no);
      return response.success(null, '订单已支付');
    }

    // 4. 查询用户信息
    const user = await findOne('users', { id: order.user_id });
    if (!user) {
      console.error(`[paymentCallback] 用户不存在:`, order.user_id);
      return response.error('用户不存在');
    }

    // 5. 更新订单状态
    await update('orders', {
      pay_status: 1,
      pay_time: utils.formatDateTime(new Date()),
      transaction_id: transaction_id,
      pay_method: 'wechat'
    }, { order_no: out_trade_no });

    console.log(`[paymentCallback] 订单状态已更新:`, out_trade_no);

    // 6. 根据订单类型执行业务逻辑
    switch (order.order_type) {
      case 1: // 课程购买
        await handleCoursePurchaseSuccess(order, user);
        break;
      case 2: // 复训费
        await handleRetrainSuccess(order, user);
        break;
      case 4: // 大使升级
        await handleUpgradeSuccess(order, user);
        break;
      default:
        console.warn(`[paymentCallback] 未知订单类型:`, order.order_type);
    }

    // 7. 推荐人奖励由合同签署/首次上课流程单独标记，此处不标记

    console.log(`[paymentCallback] 支付回调处理完成:`, out_trade_no);

    return response.success(null, '支付回调处理成功');

  } catch (error) {
    console.error(`[paymentCallback] 失败:`, error);
    return response.error('支付回调处理失败', error);
  }
};

/**
 * 处理课程购买订单支付成功
 * 使用 business-logic 的 generateUserCourseRecord
 */
async function handleCoursePurchaseSuccess(order, user) {
  try {
    // 1. 使用 business-logic 生成用户课程记录
    await business.generateUserCourseRecord({
      user_id: user.id,
      order_id: order.id,
      course_id: order.related_id
    });

    // 2. 推荐人确认和奖励发放均在 contract_signed=1 时触发（签合同审核通过 / 初探班首次上课）
    //    支付阶段不锁定推荐人，允许用户在签约前更换

    // 4. 发送购买成功通知
    // await business.sendPaymentSuccessNotice({
    //   openid: user.openid,
    //   order_no: order.order_no,
    //   course_name: order.order_name,
    //   amount: order.final_amount
    // });

    console.log(`[handleCoursePurchaseSuccess] 课程购买处理完成`);

  } catch (error) {
    console.error(`[handleCoursePurchaseSuccess] 失败:`, error);
    throw error;
  }
}

/**
 * 处理复训订单支付成功
 */
async function handleRetrainSuccess(order, user) {
  try {
    // 1. 创建预约记录
    await insert('appointments', {
      user_id: user.id,
      class_record_id: order.class_record_id,
      user_course_id: order.related_id,
      is_retrain: 1,
      order_no: order.order_no,
      status: 0 // 待签到
    });

    // 2. 扣减课程名额
    await update('class_records',
      { booked_quota: db.raw('booked_quota + 1') },
      { id: order.class_record_id }
    );

    // 3. 发送预约成功通知
    // TODO: 调用订阅消息接口

    console.log(`[handleRetrainSuccess] 复训订单处理完成`);

  } catch (error) {
    console.error(`[handleRetrainSuccess] 失败:`, error);
    throw error;
  }
}

/**
 * 处理大使升级订单支付成功
 * 新流程：先支付后签合同，支付回调只记录日志，实际等级升级由 signContract 触发
 */
async function handleUpgradeSuccess(order, user) {
  const targetLevel = order.related_id;
  // 升级费支付成功，仅记录日志
  // 等级升级将在用户完成协议签署后由 signContract 云函数触发
  console.log(`[handleUpgradeSuccess] 用户 ${user.id} 升级费支付成功，目标等级 ${targetLevel}，等待签署协议`);
}

