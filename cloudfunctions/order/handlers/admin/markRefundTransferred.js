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
  const now = utils.formatDateTime(new Date());

  // 通过 source_order_id 精确找到该订单创建的所有 user_courses（主课程+赠送课程）
  const { data: ucList } = await db
    .from('user_courses')
    .select('id, course_id, pending_days, contract_signed, status')
    .eq('source_order_id', order.id)
    .in('status', [1]);

  if (!ucList || ucList.length === 0) {
    console.log(`[rollbackCoursePurchase] 未找到该订单的课程记录: order_id=${order.id}`);
    return;
  }

  // 查询各课程的 validity_days
  const course = await findOne('courses', { id: order.related_id });
  if (!course) return;

  // 构建课程ID到validity_days的映射
  const courseValidityMap = {};
  courseValidityMap[course.id] = course.validity_days || 365;

  let giftIds = course.included_course_ids;
  if (typeof giftIds === 'string') {
    try { giftIds = JSON.parse(giftIds); } catch (e) { giftIds = []; }
  }
  if (giftIds && giftIds.length > 0) {
    for (const giftCourseId of giftIds) {
      const giftCourse = await findOne('courses', { id: giftCourseId });
      if (giftCourse) courseValidityMap[giftCourseId] = giftCourse.validity_days || 365;
    }
  }

  for (const uc of ucList) {
    const validityDays = courseValidityMap[uc.course_id] || 365;
    // 退款时必定 contract_signed=0（签了就退不了），扣减 pending_days
    const newPendingDays = (uc.pending_days || 0) - validityDays;
    if (newPendingDays <= 0) {
      // pending_days 清零 → 课程退款失效
      await update('user_courses', { status: 2, pending_days: 0, updated_at: now }, { id: uc.id });
      console.log(`[rollbackCoursePurchase] 课程已退款失效: id=${uc.id}, course_id=${uc.course_id}`);
    } else {
      // 仍有兑换叠加的天数 → 保留记录，仅扣减
      await update('user_courses', { pending_days: newPendingDays, updated_at: now }, { id: uc.id });
      console.log(`[rollbackCoursePurchase] 扣减 pending_days: id=${uc.id}, course_id=${uc.course_id}, 剩余=${newPendingDays}`);
    }
  }

  console.log(`[rollbackCoursePurchase] 课程购买回退完成，共处理 ${ucList.length} 条记录`);
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

