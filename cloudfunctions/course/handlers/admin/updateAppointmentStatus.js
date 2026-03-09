/**
 * 更新预约状态（管理端接口）
 *
 * 沙龙课程(type=4)：全自动流转，管理端禁止手动操作
 * 非沙龙课程：仅支持 status=3（取消），attend_count 不在此处变更
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const appointmentId = event.id || event.appointment_id;
  const { status, notes } = event;

  try {
    const validation = validateRequired({ appointmentId, status }, ['appointmentId', 'status']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const statusInt = parseInt(status);

    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select(`
        id, user_id, course_id, user_course_id, status,
        course:courses!fk_appointments_course(type)
      `)
      .eq('id', appointmentId)
      .single();

    if (findError && !findError.message?.includes('0 rows')) throw findError;
    if (!appointment) return response.notFound('预约记录不存在');

    const isSalon = appointment.course?.type === 4;

    // 沙龙课程：全自动流转（待上课→已签到→已结课），禁止手动操作
    if (isSalon) {
      return response.paramError('沙龙课程为全自动流转，不支持手动修改状态');
    }

    // 非沙龙课程：仅允许取消操作
    if (statusInt !== 3) {
      return response.paramError('非沙龙课程仅支持取消操作（status=3），签到请使用每日签到功能');
    }

    const updateData = { status: statusInt };
    if (notes) updateData.notes = notes;
    updateData.cancel_time = formatDateTime(new Date());

    await db.from('appointments').update(updateData).eq('id', appointmentId);

    // 非沙龙取消：清理日签到记录
    await db.from('appointment_checkins')
      .delete()
      .eq('appointment_id', appointment.id);

    return response.success({ success: true, message: '预约状态更新成功' });

  } catch (error) {
    console.error('[updateAppointmentStatus] 更新失败:', error);
    return response.error('更新预约状态失败', error);
  }
};
