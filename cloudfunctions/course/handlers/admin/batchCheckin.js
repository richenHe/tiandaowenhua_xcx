/**
 * 批量签到（管理端接口）
 *
 * attend_count 从 0 变为 1 时，若课程 need_contract=0，自动触发后续业务逻辑
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');
const { triggerPostContractLogic } = require('../../common/triggerPostContractLogic');

/**
 * 更新单个预约的 attend_count，并在 0→1 时自动触发"不需要合同"课程的后续逻辑
 */
async function updateAttendCountAndCheck(appointment) {
  const { data: userCourse } = await db
    .from('user_courses')
    .select('id, attend_count, contract_signed')
    .eq('user_id', appointment.user_id)
    .eq('course_id', appointment.course_id)
    .single();

  if (!userCourse) return;

  const oldCount = userCourse.attend_count || 0;
  const newCount = oldCount + 1;

  await db
    .from('user_courses')
    .update({ attend_count: newCount })
    .eq('user_id', appointment.user_id)
    .eq('course_id', appointment.course_id);

  // attend_count 0→1 且尚未签合同：检查课程是否 need_contract=0
  if (newCount === 1 && oldCount === 0 && userCourse.contract_signed === 0) {
    const { data: course } = await db
      .from('courses')
      .select('need_contract')
      .eq('id', appointment.course_id)
      .single();

    if (course && course.need_contract === 0) {
      await triggerPostContractLogic(appointment.user_id, appointment.course_id, userCourse.id);
    }
  }
}

module.exports = async (event, context) => {
  const { class_record_id, user_ids, appointment_ids } = event;

  try {
    // 方式1（推荐）：直接传 appointment_ids 预约ID数组
    if (appointment_ids && Array.isArray(appointment_ids) && appointment_ids.length > 0) {
      const { data: appointments, error: queryError } = await db
        .from('appointments')
        .select('id, user_id, course_id')
        .in('id', appointment_ids)
        .eq('status', 0);

      if (queryError) throw queryError;

      if (!appointments || appointments.length === 0) {
        return response.error('没有找到待签到的预约记录');
      }

      const now = formatDateTime(new Date());
      const appointmentIdList = appointments.map(a => a.id);

      const { error: updateError } = await db
        .from('appointments')
        .update({ status: 1, checkin_time: now })
        .in('id', appointmentIdList);

      if (updateError) throw updateError;

      for (const appointment of appointments) {
        await updateAttendCountAndCheck(appointment);
      }

      return response.success({
        message: '批量签到成功',
        success_count: appointments.length,
        failed_count: 0
      });
    }

    // 方式2（旧版）：通过 class_record_id + user_ids
    const validation = validateRequired({ class_record_id, user_ids }, ['class_record_id', 'user_ids']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.paramError('user_ids 必须是非空数组');
    }

    const { data: appointments, error: queryError } = await db
      .from('appointments')
      .select('id, user_id, course_id')
      .eq('class_record_id', parseInt(class_record_id))
      .in('user_id', user_ids)
      .eq('status', 0);

    if (queryError) {
      throw queryError;
    }

    if (!appointments || appointments.length === 0) {
      return response.error('没有找到待签到的预约记录');
    }

    const appointmentIds = appointments.map(a => a.id);
    const now = formatDateTime(new Date());

    const { error: updateError } = await db
      .from('appointments')
      .update({
        status: 1,
        checkin_time: now
      })
      .in('id', appointmentIds);

    if (updateError) {
      throw updateError;
    }

    for (const appointment of appointments) {
      await updateAttendCountAndCheck(appointment);
    }

    return response.success({
      message: '批量签到成功',
      success_count: appointments.length,
      failed_count: 0
    });

  } catch (error) {
    console.error('[Course/batchCheckin] 批量签到失败:', error);
    return response.error('批量签到失败', error);
  }
};
