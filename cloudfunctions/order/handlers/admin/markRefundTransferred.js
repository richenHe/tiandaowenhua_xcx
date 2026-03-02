/**
 * 管理端接口：标记退款已转账（含上传电子发票）
 * Action: markRefundTransferred
 *
 * 将 refund_status 从 1（申请退款）更新为 3（已退款/已转账）
 * 强制要求上传电子发票，无 invoice_file_id 时拒绝操作
 * 转账完成后执行业务回退（课程失效、预约取消、等级回退等）
 *
 * 入参：
 *   order_id        - 订单ID（必填）
 *   invoice_file_id - 电子发票云存储 fileID（必填，cloud://...）
 *   transfer_no     - 转账流水号（可选）
 */
const { findOne, update, db } = require('../../common/db');
const { response, utils, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { order_id, invoice_file_id, transfer_no } = event;

  try {
    console.log(`[markRefundTransferred] 标记退款已转账:`, { admin_id: admin.id, order_id });

    if (!order_id) {
      return response.paramError('缺少订单ID');
    }

    if (!invoice_file_id || !invoice_file_id.trim()) {
      return response.paramError('请先上传电子发票，上传后方可标记已转账');
    }

    const order = await findOne('orders', { id: order_id });
    if (!order) {
      return response.notFound('订单不存在');
    }

    // 仅 refund_status=1（申请退款）可标记已转账
    if (order.refund_status !== 1) {
      return response.error('该退款申请状态不允许标记转账（需为"申请退款"状态）');
    }

    const now = utils.formatDateTime(new Date());

    // 更新订单：退款状态 + 发票信息 + 审核信息
    await update('orders',
      {
        refund_status: 3,
        pay_status: 4,
        refund_time: now,
        refund_transfer_no: transfer_no || '',
        refund_invoice_file_id: invoice_file_id.trim(),
        refund_audit_admin_id: admin.id,
        refund_audit_time: now
      },
      { id: order_id }
    );

    // 执行业务回退逻辑
    await rollbackOrderBusiness(order);

    const invoice_url = cloudFileIDToURL ? cloudFileIDToURL(invoice_file_id.trim()) : invoice_file_id;

    console.log(`[markRefundTransferred] 退款转账标记成功，发票已记录: order_id=${order_id}`);

    return response.success({
      order_id,
      refund_status: 3,
      status_name: '已退款',
      invoice_url
    }, '已标记为退款转账完成');

  } catch (error) {
    console.error(`[markRefundTransferred] 失败:`, error);
    return response.error('标记退款转账失败', error);
  }
};

/**
 * 回退订单业务逻辑（复用 refund.js 的逻辑）
 */
async function rollbackOrderBusiness(order) {
  try {
    switch (order.order_type) {
      case 1:
        await rollbackCoursePurchase(order);
        break;
      case 2:
        await rollbackRetrain(order);
        break;
    }
    console.log(`[rollbackOrderBusiness] 业务回退完成: ${order.order_no}`);
  } catch (error) {
    console.error(`[rollbackOrderBusiness] 失败:`, error);
    throw error;
  }
}

async function rollbackCoursePurchase(order) {
  await update('user_courses', {
    status: 0,
    refund_time: utils.formatDateTime(new Date())
  }, {
    user_id: order.user_id,
    course_id: order.related_id
  });

  console.log(`[rollbackCoursePurchase] 课程购买回退完成`);
}

async function rollbackRetrain(order) {
  await update('appointments', {
    status: 3,
    cancel_reason: '订单退款'
  }, {
    order_no: order.order_no
  });

  const appointment = await findOne('appointments', { order_no: order.order_no });
  if (appointment) {
    await update('class_records', {
      booked_quota: db.raw('booked_quota - 1')
    }, {
      id: appointment.class_record_id
    });
  }
  console.log(`[rollbackRetrain] 复训预约回退完成`);
}

