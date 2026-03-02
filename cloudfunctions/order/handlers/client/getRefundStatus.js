/**
 * 客户端接口：获取退款状态
 * Action: getRefundStatus
 *
 * 入参：
 *   order_no - 订单号（必填）
 *
 * 返回：订单基本信息 + 退款状态详情
 */
const { findOne } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { order_no } = event;

  try {
    console.log(`[getRefundStatus] 查询退款状态:`, { user_id: user.id, order_no });

    if (!order_no) {
      return response.paramError('缺少订单号');
    }

    const order = await findOne('orders', {
      order_no,
      user_id: user.id
    });

    if (!order) {
      return response.notFound('订单不存在');
    }

    const invoiceUrl = order.refund_invoice_file_id
      ? (cloudFileIDToURL ? cloudFileIDToURL(order.refund_invoice_file_id) : order.refund_invoice_file_id)
      : '';

    return response.success({
      order_no: order.order_no,
      order_name: order.order_name,
      order_type: order.order_type,
      final_amount: order.final_amount,
      refund_status: order.refund_status,
      refund_amount: order.refund_amount,
      refund_reason: order.refund_reason || '',
      refund_reject_reason: order.refund_reject_reason || '',
      refund_time: order.refund_time || null,
      refund_transfer_no: order.refund_transfer_no || null,
      refund_audit_time: order.refund_audit_time || null,
      invoice_url: invoiceUrl,
      pay_time: order.pay_time,
      created_at: order.created_at
    }, '获取成功');

  } catch (error) {
    console.error(`[getRefundStatus] 失败:`, error);
    return response.error('获取退款状态失败', error);
  }
};
