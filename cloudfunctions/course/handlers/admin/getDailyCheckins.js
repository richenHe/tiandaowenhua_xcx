/**
 * 获取每日签到记录（管理端接口）
 *
 * 返回某个预约的所有日签到记录 + 排期日期范围
 * 入参：{ appointmentId }
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const appointmentId = event.appointmentId || event.appointment_id;

  try {
    const validation = validateRequired({ appointmentId }, ['appointmentId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询预约（含排期日期范围）
    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select(`
        id, class_record_id, status,
        class_record:class_records!fk_appointments_class_record(
          class_date,
          class_end_date,
          course_type
        )
      `)
      .eq('id', parseInt(appointmentId))
      .single();

    if (findError && !findError.message?.includes('0 rows')) throw findError;
    if (!appointment) return response.notFound('预约记录不存在');

    const classDate = appointment.class_record?.class_date;
    const classEndDate = appointment.class_record?.class_end_date || classDate;

    // 查询该预约的所有签到记录
    const { data: checkins, error: checkinError } = await db
      .from('appointment_checkins')
      .select('id, checkin_date, checkin_time, checkin_type, checkin_admin_id')
      .eq('appointment_id', appointment.id)
      .order('checkin_date', { ascending: true });

    if (checkinError) throw checkinError;

    return response.success({
      appointment_id: appointment.id,
      class_date: classDate,
      class_end_date: classEndDate,
      course_type: appointment.class_record?.course_type,
      checkins: checkins || []
    });

  } catch (error) {
    console.error('[getDailyCheckins] 查询失败:', error);
    return response.error('查询每日签到记录失败', error);
  }
};
