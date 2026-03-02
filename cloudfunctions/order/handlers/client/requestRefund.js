/**
 * 客户端接口：申请退款
 * Action: requestRefund
 *
 * 入参：
 *   order_no      - 订单号（必填）
 *   refund_reason - 退款原因（必填）
 *
 * 校验流程：
 *   1. 订单存在 + 属于当前用户
 *   2. pay_status === 1（已支付）
 *   3. refund_status === 0（无退款申请）
 *   4. 查询 user_courses 检查 contract_signed：已签合同则拒绝退款
 *   5. 更新 orders: refund_status=1, refund_amount=final_amount, refund_reason
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { order_no, refund_reason } = event;

  try {
    console.log(`[requestRefund] 用户申请退款:`, { user_id: user.id, order_no });

    if (!order_no) {
      return response.paramError('缺少订单号');
    }
    if (!refund_reason || !refund_reason.trim()) {
      return response.paramError('请填写退款原因');
    }

    const order = await findOne('orders', {
      order_no,
      user_id: user.id
    });

    if (!order) {
      return response.notFound('订单不存在');
    }

    if (order.pay_status !== 1) {
      return response.error('只能对已支付订单申请退款');
    }

    if (order.refund_status !== 0) {
      const statusText = { 1: '退款审核中', 3: '已退款', 4: '退款被驳回' };
      return response.error(`该订单${statusText[order.refund_status] || '已有退款记录'}，无法重复申请`);
    }

    // 大使升级订单不支持退款
    if (order.order_type === 4) {
      return response.error('大使升级订单不支持退款。如有疑问请联系客服。');
    }

    // 课程订单需检查合同签署状态
    if (order.order_type === 1 && order.related_id) {
      const userCourse = await findOne('user_courses', {
        user_id: user.id,
        course_id: order.related_id,
        status: 1
      });

      if (userCourse && userCourse.contract_signed === 1) {
        return response.error('该课程已签署学习合同，无法退款。如有疑问请联系客服。');
      }
    }

    const now = utils.formatDateTime(new Date());

    await update('orders',
      {
        refund_status: 1,
        refund_amount: order.final_amount,
        refund_reason: refund_reason.trim()
      },
      { order_no }
    );

    console.log(`[requestRefund] 退款申请提交成功: order_no=${order_no}`);

    return response.success({
      order_no,
      refund_status: 1,
      refund_amount: order.final_amount
    }, '退款申请已提交，请等待审核');

  } catch (error) {
    console.error(`[requestRefund] 失败:`, error);
    return response.error('申请退款失败', error);
  }
};
