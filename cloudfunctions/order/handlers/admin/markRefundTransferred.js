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
  const now = new Date();
  const course = await findOne('courses', { id: order.related_id });
  if (!course) return;

  // 1. 主课程：回退有效期而非直接失效
  await rollbackUserCourseValidity(order.user_id, order.related_id, course.validity_days, now);

  // 2. 赠送课程：同样回退有效期
  let giftIds = course.included_course_ids;
  if (typeof giftIds === 'string') {
    try { giftIds = JSON.parse(giftIds); } catch (e) { giftIds = []; }
  }
  if (!giftIds || giftIds.length === 0) return;

  for (const giftCourseId of giftIds) {
    const giftCourse = await findOne('courses', { id: giftCourseId });
    if (!giftCourse) continue;
    await rollbackUserCourseValidity(order.user_id, giftCourseId, giftCourse.validity_days, now);
  }

  console.log(`[rollbackCoursePurchase] 课程购买回退完成（含赠送课程）`);
}

/**
 * 回退单条 user_courses 的有效期
 * 逻辑：expire_at 减去 validity_days；若减后仍在未来则保留课程，否则失效
 * 永久有效课程（validity_days=null）被退款时直接失效
 */
async function rollbackUserCourseValidity(userId, courseId, validityDays, now) {
  const { data: ucList } = await db
    .from('user_courses')
    .select('id, expire_at, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 1)
    .limit(1);

  if (!ucList || ucList.length === 0) {
    console.log(`[rollbackValidity] 未找到有效课程记录: user=${userId}, course=${courseId}`);
    return;
  }

  const uc = ucList[0];

  if (validityDays == null || !uc.expire_at) {
    // 永久有效课程被退款 → 直接失效
    await update('user_courses', { status: 0 }, { id: uc.id });
    console.log(`[rollbackValidity] 永久课程已失效: id=${uc.id}, course=${courseId}`);
    return;
  }

  const currentExpire = new Date(uc.expire_at);
  const rolledBack = new Date(currentExpire.getTime() - parseInt(validityDays) * 86400000);

  if (rolledBack > now) {
    // 回退后仍有剩余有效期（来自积分兑换等其他来源）→ 保留课程
    await update('user_courses', {
      expire_at: utils.formatDateTime(rolledBack)
    }, { id: uc.id });
    console.log(`[rollbackValidity] 有效期已缩短: id=${uc.id}, course=${courseId}, 新截止=${utils.formatDateTime(rolledBack)}`);
  } else {
    // 回退后已过期 → 失效
    await update('user_courses', { status: 0 }, { id: uc.id });
    console.log(`[rollbackValidity] 回退后已过期，课程失效: id=${uc.id}, course=${courseId}`);
  }
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

