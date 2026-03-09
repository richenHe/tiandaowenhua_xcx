/**
 * 取消预约（客户端接口）
 *
 * 校验取消截止日期（class_date - cancel_deadline_days），
 * 复训预约取消时保留复训资格（retrain_credit_status=1），下次同课程排期可免付复训费
 *
 * @param {Object} event
 * @param {number} event.appointmentId - 预约 ID（必填）
 */
const { db, findOne, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const appointmentId = event.appointmentId || event.appointment_id;
  const { user } = context;

  try {
    const validation = validateRequired({ appointmentId }, ['appointmentId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 1. 查询预约记录，验证归属
    const appointment = await findOne('appointments', { id: appointmentId });
    if (!appointment) {
      return response.notFound('预约记录不存在');
    }
    if (appointment.user_id !== user.id) {
      return response.forbidden('无权操作此预约');
    }
    if (appointment.status !== 0) {
      return response.error('仅待上课的预约可以取消');
    }

    // 2. 查询排期，获取上课日期和取消截止天数
    const classRecord = await findOne('class_records', { id: appointment.class_record_id });
    if (!classRecord) {
      return response.error('排期信息不存在');
    }

    // 3. 校验取消截止日期（北京时间）
    const cancelDeadlineDays = classRecord.cancel_deadline_days || 3;
    const classDate = new Date(classRecord.class_date + 'T00:00:00+08:00');
    const deadline = new Date(classDate.getTime() - cancelDeadlineDays * 24 * 60 * 60 * 1000);
    const nowBJ = new Date(Date.now() + 8 * 60 * 60 * 1000);

    if (nowBJ >= deadline) {
      return response.error(`上课前 ${cancelDeadlineDays} 天内无法取消预约`);
    }

    const now = formatDateTime(new Date());

    // 4. 更新预约状态为已取消
    await update('appointments', {
      status: 3,
      cancel_time: now
    }, { id: appointmentId });

    // 5. 释放名额
    const newBooked = Math.max(0, (classRecord.booked_quota || 1) - 1);
    await db
      .from('class_records')
      .update({ booked_quota: newBooked })
      .eq('id', classRecord.id);

    // 6. 复训预约 → 保留复训资格
    let hasRetrainCredit = false;
    if (appointment.is_retrain === 1 && appointment.order_no) {
      const { data: orderData } = await db
        .from('orders')
        .select('id, retrain_credit_status')
        .eq('order_no', appointment.order_no)
        .eq('order_type', 2)
        .eq('pay_status', 1)
        .single();

      if (orderData) {
        await db
          .from('orders')
          .update({ retrain_credit_status: 1 })
          .eq('id', orderData.id);
        hasRetrainCredit = true;
        console.log(`[Course/cancelAppointment] 复训资格已保留, order_no: ${appointment.order_no}`);
      }
    }

    console.log(`[Course/cancelAppointment] 预约 ${appointmentId} 已取消, is_retrain=${appointment.is_retrain}`);

    return response.success({
      appointment_id: appointmentId,
      has_retrain_credit: hasRetrainCredit,
      message: hasRetrainCredit
        ? '预约已取消，您的复训费已保留至下期预约使用'
        : '预约已取消'
    }, hasRetrainCredit ? '预约已取消，复训费已保留至下期' : '预约已取消');

  } catch (error) {
    console.error('[Course/cancelAppointment] 取消失败:', error);
    return response.error('取消预约失败', error);
  }
};
