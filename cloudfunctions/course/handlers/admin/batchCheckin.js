/**
 * 批量签到（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { class_record_id, user_ids } = event;

  try {
    // 参数验证
    const validation = validateRequired({ class_record_id, user_ids }, ['class_record_id', 'user_ids']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.paramError('user_ids 必须是非空数组');
    }

    // 查询待签到的预约记录（注意：appointments 表没有 deleted_at 字段，status=0或1 表示待上课）
    const { data: appointments, error: queryError } = await db
      .from('appointments')
      .select('id, user_id, course_id')
      .eq('class_record_id', parseInt(class_record_id))
      .in('user_id', user_ids)
      .in('status', [0, 1]);  // 0 或 1 都表示待上课

    if (queryError) {
      throw queryError;
    }

    if (!appointments || appointments.length === 0) {
      return response.error('没有找到待签到的预约记录');
    }

    // 批量更新签到状态（注意：字段是 checkin_time 而非 checkin_at）
    const appointmentIds = appointments.map(a => a.id);
    const now = new Date().toISOString();
    
    const { error: updateError } = await db
      .from('appointments')
      .update({
        status: 2,  // 2 = 已签到
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
      checkin_count: appointments.length
    });

  } catch (error) {
    console.error('[Course/batchCheckin] 批量签到失败:', error);
    return response.error('批量签到失败', error);
  }
};
