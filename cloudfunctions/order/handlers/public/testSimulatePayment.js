/**
 * 测试专用接口：模拟支付成功回调
 * Action: testSimulatePayment
 *
 * ⚠️ 仅用于本地/测试环境，生产环境请禁用此接口。
 * 跳过微信签名验证，直接触发支付成功后的业务逻辑。
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');
const business = require('../../business-logic');

// 测试专用密钥，防止误触
const TEST_SECRET = 'tiandao_test_2026';

module.exports = async (event, context) => {
  const { order_no, test_secret } = event;

  try {
    // 验证测试密钥
    if (test_secret !== TEST_SECRET) {
      return response.forbidden('无效的测试密钥');
    }

    if (!order_no) {
      return response.paramError('缺少 order_no');
    }

    console.log(`[testSimulatePayment] 模拟支付成功: ${order_no}`);

    // 1. 查询订单
    const order = await findOne('orders', { order_no });
    if (!order) {
      return response.error(`订单不存在: ${order_no}`);
    }

    // 2. 幂等性检查
    if (order.pay_status === 1) {
      return response.success(null, '订单已支付，跳过处理');
    }

    // 3. 查询用户
    const user = await findOne('users', { id: order.user_id });
    if (!user) {
      return response.error(`用户不存在: ${order.user_id}`);
    }

    // 4. 更新订单状态
    const mockTransactionId = `TEST_TXN_${Date.now()}`;
    await update('orders', {
      pay_status: 1,
      pay_time: utils.formatDateTime(new Date()),
      transaction_id: mockTransactionId,
      pay_method: 'wechat'
    }, { order_no });

    console.log(`[testSimulatePayment] 订单状态已更新: ${order_no}`);

    // 5. 根据订单类型执行业务逻辑
    switch (order.order_type) {
      case 1: { // 课程购买
        // 生成课程记录
        await business.generateUserCourseRecord({
          user_id: user.id,
          order_id: order.id,
          course_id: order.related_id
        });

        // 锁定推荐人（首次购买）
        if (!user.referee_confirmed_at) {
          await update('users',
            { referee_confirmed_at: utils.formatDateTime(new Date()) },
            { id: user.id }
          );
        }

        // 发放推荐人奖励
        if (order.referee_id) {
          await business.processReferralReward({
            order_id: order.id,
            user_id: user.id,
            referee_id: order.referee_id,
            order_amount: order.final_amount,
            order_type: order.order_type
          });
        }
        break;
      }
      default:
        console.warn(`[testSimulatePayment] 暂不支持的订单类型: ${order.order_type}`);
    }

    // 6. 标记奖励已发放
    await update('orders', {
      is_reward_granted: 1,
      reward_granted_at: utils.formatDateTime(new Date())
    }, { order_no });

    console.log(`[testSimulatePayment] 处理完成: ${order_no}`);

    return response.success({
      order_no,
      transaction_id: mockTransactionId,
      processed_at: utils.formatDateTime(new Date())
    }, '模拟支付成功处理完成');

  } catch (error) {
    console.error(`[testSimulatePayment] 失败:`, error);
    return response.error('模拟支付处理失败', error);
  }
};
