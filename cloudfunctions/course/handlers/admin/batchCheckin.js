/**
 * 批量签到（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { class_record_id, user_ids, appointment_ids } = event;

  try {
    let appointmentsQuery;

    // 支持两种调用方式：
    // 方式1（推荐）：直接传 appointment_ids 预约ID数组
    // 方式2（旧版）：传 class_record_id + user_ids
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

      // 更新用户课程上课次数
      for (const appointment of appointments) {
        const { data: userCourse } = await db
          .from('user_courses')
          .select('attend_count')
          .eq('user_id', appointment.user_id)
          .eq('course_id', appointment.course_id)
          .single();

        if (userCourse) {
          await db
            .from('user_courses')
            .update({ attend_count: (userCourse.attend_count || 0) + 1 })
            .eq('user_id', appointment.user_id)
            .eq('course_id', appointment.course_id);
        }
      }

      return response.success({
        message: '批量签到成功',
        success_count: appointments.length,
        failed_count: 0
      });
    }

    // 旧版方式：通过 class_record_id + user_ids
    const validation = validateRequired({ class_record_id, user_ids }, ['class_record_id', 'user_ids']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.paramError('user_ids 必须是非空数组');
    }

    // 查询待签到的预约记录（status=0 为待上课）
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

    // 批量更新签到状态（注意：字段是 checkin_time 而非 checkin_at）
    const appointmentIds = appointments.map(a => a.id);
    const now = formatDateTime(new Date());  // 使用 MySQL 格式而非 ISO 格式
    
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

    // 更新用户课程上课次数
    for (const appointment of appointments) {
      const { data: userCourse } = await db
        .from('user_courses')
        .select('attend_count')
        .eq('user_id', appointment.user_id)
        .eq('course_id', appointment.course_id)
        .single();

      if (userCourse) {
        await db
          .from('user_courses')
          .update({
            attend_count: (userCourse.attend_count || 0) + 1
          })
          .eq('user_id', appointment.user_id)
          .eq('course_id', appointment.course_id);
      }
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
