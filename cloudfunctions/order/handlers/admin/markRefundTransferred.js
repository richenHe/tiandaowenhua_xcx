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

/**
 * 解析北京时间字符串为 Date 对象
 * 用于计算 expire_at 的回退值（路径C）
 */
function parseBeijingDateStr(dateStr) {
  if (!dateStr) return new Date();
  // 格式：'2026-04-05 23:59:59'
  const [datePart, timePart] = dateStr.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h = 23, min = 59, s = 59] = (timePart || '').split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - 8, min, s)); // 北京时间 UTC+8
}

async function rollbackCoursePurchase(order) {
  const now = utils.formatDateTime(new Date());

  // 路径A：通过 source_order_id 精确找到该订单新建的 user_courses（主课程+新建赠课）
  const { data: ucList } = await db
    .from('user_courses')
    .select('id, course_id, pending_days, contract_signed, status')
    .eq('source_order_id', order.id)
    .in('status', [1]);

  // 查询主课程信息
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

  // 处理路径A（source_order_id 匹配的记录）
  const processedUcIds = new Set();
  for (const uc of (ucList || [])) {
    processedUcIds.add(uc.id);
    const validityDays = courseValidityMap[uc.course_id] || 365;
    // 路径A的新建赠课 contract_signed=0，扣减 pending_days
    const newPendingDays = (uc.pending_days || 0) - validityDays;
    if (newPendingDays <= 0) {
      await update('user_courses', { status: 2, pending_days: 0, updated_at: now }, { id: uc.id });
      console.log(`[rollbackCoursePurchase] 路径A-课程失效: id=${uc.id}, course_id=${uc.course_id}`);
    } else {
      await update('user_courses', { pending_days: newPendingDays, updated_at: now }, { id: uc.id });
      console.log(`[rollbackCoursePurchase] 路径A-扣减 pending_days: id=${uc.id}, 剩余=${newPendingDays}`);
    }

    // 取消该课程下用户的待上课预约（status=0），并归还 booked_quota
    const { data: pendingAppts } = await db
      .from('appointments')
      .select('id, class_record_id')
      .eq('user_id', order.user_id)
      .eq('course_id', uc.course_id)
      .eq('status', 0);

    if (pendingAppts && pendingAppts.length > 0) {
      for (const appt of pendingAppts) {
        await update('appointments', { status: 4, cancel_reason: '订单退款', updated_at: now }, { id: appt.id });
        const cr = await findOne('class_records', { id: appt.class_record_id });
        if (cr && cr.booked_quota > 0) {
          await update('class_records', { booked_quota: cr.booked_quota - 1 }, { id: appt.class_record_id });
        }
        console.log(`[rollbackCoursePurchase] 取消预约: id=${appt.id}`);
      }
    }
  }

  if (!ucList || ucList.length === 0) {
    console.log(`[rollbackCoursePurchase] 未找到该订单的主课程记录: order_id=${order.id}`);
  }

  // 路径B/C：赠课记录被当前订单叠加了天数，但 source_order_id 不指向当前订单（旧记录复用）
  // 通过主课程的 included_course_ids 找到对应的赠课，扣减已叠加的天数
  if (giftIds && giftIds.length > 0) {
    for (const giftCourseId of giftIds) {
      const { data: giftUCList } = await db
        .from('user_courses')
        .select('id, course_id, pending_days, contract_signed, expire_at, status, source_order_id')
        .eq('user_id', order.user_id)
        .eq('course_id', giftCourseId)
        .eq('is_gift', 1)
        .eq('status', 1)
        .order('id', { ascending: false })
        .limit(1);

      if (!giftUCList || giftUCList.length === 0) continue;

      const giftUC = giftUCList[0];
      // 跳过路径A已处理的记录（source_order_id = order.id，已在上面处理）
      if (giftUC.source_order_id === order.id || processedUcIds.has(giftUC.id)) continue;

      const validityDays = courseValidityMap[giftCourseId] || 365;

      if (giftUC.contract_signed === 1) {
        // 路径C：撤销 expire_at 延长，回退 validityDays 天
        const currentExpire = parseBeijingDateStr(giftUC.expire_at);
        const restoredExpire = utils.formatDateTime(
          new Date(currentExpire.getTime() - validityDays * 86400000)
        );
        await update('user_courses', { expire_at: restoredExpire, updated_at: now }, { id: giftUC.id });
        // 同步回退 contract_signatures.contract_end
        await db.from('contract_signatures').update({
          contract_end: restoredExpire.split(' ')[0],
          updated_at: now
        }).eq('user_id', order.user_id).eq('course_id', giftCourseId).eq('status', 1);
        console.log(`[rollbackCoursePurchase] 路径C-回退赠课有效期: id=${giftUC.id}, course_id=${giftCourseId}, 新截止=${restoredExpire}`);
      } else {
        // 路径B：撤销 pending_days 叠加
        const restoredPendingDays = (giftUC.pending_days || 0) - validityDays;
        if (restoredPendingDays <= 0) {
          await update('user_courses', { status: 2, pending_days: 0, updated_at: now }, { id: giftUC.id });
          console.log(`[rollbackCoursePurchase] 路径B-回退赠课(清零): id=${giftUC.id}, course_id=${giftCourseId}`);
        } else {
          await update('user_courses', { pending_days: restoredPendingDays, updated_at: now }, { id: giftUC.id });
          console.log(`[rollbackCoursePurchase] 路径B-回退赠课(扣减): id=${giftUC.id}, course_id=${giftCourseId}, 剩余=${restoredPendingDays}`);
        }
      }
    }
  }

  console.log(`[rollbackCoursePurchase] 课程购买回退完成: order_id=${order.id}`);
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
    const cr = await findOne('class_records', { id: appointment.class_record_id });
    if (cr && cr.booked_quota > 0) {
      await update('class_records', { booked_quota: cr.booked_quota - 1 }, { id: appointment.class_record_id });
    }
  }
  console.log(`[rollbackRetrain] 复训预约回退完成`);
}

