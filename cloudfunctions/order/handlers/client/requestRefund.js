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
const { findOne, update, query, db } = require('../../common/db');
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

    // refund_status: 0=无退款, 1=申请中, 2=退款失败, 3=已退款, 4=已驳回
    // 仅允许 0/2/4 状态重新申请
    if (order.refund_status === 1) {
      return response.error('该订单退款审核中，请耐心等待');
    }
    if (order.refund_status === 3) {
      return response.error('该订单已退款，无法重复申请');
    }

    // 大使升级订单不支持退款
    if (order.order_type === 4) {
      return response.error('大使升级订单不支持退款。如有疑问请联系客服。');
    }

    // 课程订单需检查合同签署状态：通过 source_order_id 精确关联，任一签了合同均拒绝退款
    // 使用 source_order_id 避免旧过期记录（已签合同但过期）干扰新订单退款判断
    if (order.order_type === 1) {
      const { data: signedCourses } = await db
        .from('user_courses')
        .select('id')
        .eq('source_order_id', order.id)
        .eq('contract_signed', 1)
        .in('status', [1, 3])
        .limit(1);

      if (signedCourses && signedCourses.length > 0) {
        return response.error('该课程已签署学习合同，无法退款。如有疑问请联系客服。');
      }
    }

    // 复训订单：校验复训资格仍可退（retrain_credit_status=1 表示资格保留未使用）
    if (order.order_type === 2) {
      if (order.retrain_credit_status !== 1) {
        if (order.retrain_credit_status === 2) {
          return response.error('复训资格已使用，无法退款。如有疑问请联系客服。');
        }
        return response.error('该复训订单不满足退款条件。如有疑问请联系客服。');
      }
    }

    const now = utils.formatDateTime(new Date());

    const updateFields = {
      refund_status: 1,
      refund_amount: order.final_amount,
      refund_reason: refund_reason.trim(),
      refund_applied_at: now,
      refund_reject_reason: null,
      refund_audit_admin_id: null,
      refund_audit_time: null
    };

    // 复训订单申请退款时立即将复训资格失效，防止审核期间被重复使用
    if (order.order_type === 2) {
      updateFields.retrain_credit_status = 0;
    }

    await update('orders', updateFields, { order_no });

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
