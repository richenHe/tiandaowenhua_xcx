/**
 * 管理端接口：驳回退款申请
 * Action: rejectRefund
 *
 * 将 refund_status 从 1（申请退款）更新为 4（已驳回）
 * 不涉及积分退回（与提现驳回不同）
 *
 * 入参：
 *   order_id      - 订单ID（必填）
 *   reject_reason - 驳回原因（必填）
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { order_id, reject_reason } = event;

  try {
    console.log(`[rejectRefund] 驳回退款:`, { admin_id: admin.id, order_id });

    if (!order_id) {
      return response.paramError('缺少订单ID');
    }
    if (!reject_reason) {
      return response.paramError('驳回时需要提供原因');
    }

    const order = await findOne('orders', { id: order_id });
    if (!order) {
      return response.notFound('订单不存在');
    }

    // 仅 refund_status=1（申请退款）可驳回
    if (order.refund_status !== 1) {
      return response.error('该退款申请状态不允许驳回（需为"申请退款"状态）');
    }

    const now = utils.formatDateTime(new Date());

    await update('orders',
      {
        refund_status: 4,
        refund_reject_reason: reject_reason,
        refund_audit_admin_id: admin.id,
        refund_audit_time: now
      },
      { id: order_id }
    );

    console.log(`[rejectRefund] 退款驳回成功: order_id=${order_id}`);

    return response.success({
      order_id,
      refund_status: 4,
      status_name: '已驳回',
      reject_reason
    }, '退款申请已驳回');

  } catch (error) {
    console.error(`[rejectRefund] 失败:`, error);
    return response.error('驳回退款失败', error);
  }
};
