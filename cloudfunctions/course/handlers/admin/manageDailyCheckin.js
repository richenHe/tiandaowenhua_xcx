/**
 * 管理每日签到（管理端接口）
 *
 * 支持按日期补签或取消签到，仅适用于非沙龙课程
 * 入参：{ appointmentId, checkinDate, operation: 'checkin' | 'cancel' }
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const appointmentId = event.appointmentId || event.appointment_id;
  const checkinDate = event.checkinDate || event.checkin_date;
  const { operation } = event;
  const { admin } = context;

  try {
    const validation = validateRequired({ appointmentId, checkinDate, operation }, ['appointmentId', 'checkinDate', 'operation']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    if (!['checkin', 'cancel'].includes(operation)) {
      return response.paramError('operation 必须为 checkin 或 cancel');
    }

    // 查询预约记录
    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select('id, class_record_id, course_id, status')
      .eq('id', parseInt(appointmentId))
      .single();

    if (findError && !findError.message?.includes('0 rows')) throw findError;
    if (!appointment) return response.notFound('预约记录不存在');
    if (appointment.status === 3) return response.error('预约已取消');

    // 查询排期信息
    const { data: classRecord } = await db
      .from('class_records')
      .select('class_date, class_end_date, course_type')
      .eq('id', appointment.class_record_id)
      .single();

    if (!classRecord) return response.error('排期不存在');
    if (classRecord.course_type === 4) return response.error('沙龙课程不支持按日签到');

    // 校验日期在排期范围内
    const startDate = classRecord.class_date;
    const endDate = classRecord.class_end_date || startDate;
    if (checkinDate < startDate || checkinDate > endDate) {
      return response.paramError(`签到日期必须在 ${startDate} 至 ${endDate} 范围内`);
    }

    const now = formatDateTime(new Date());

    if (operation === 'checkin') {
      // 检查是否已有记录
      const { data: existing } = await db
        .from('appointment_checkins')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('checkin_date', checkinDate)
        .limit(1);

      if (existing && existing.length > 0) {
        return response.error('该日期已签到，无需重复操作');
      }

      await db.from('appointment_checkins').insert({
        appointment_id: appointment.id,
        checkin_date: checkinDate,
        checkin_time: now,
        checkin_type: 2,
        checkin_admin_id: admin?.id || null,
        _openid: '',
        created_at: now
      });

      console.log(`[manageDailyCheckin] 补签成功: appointment_id=${appointment.id}, date=${checkinDate}, admin=${admin?.id}`);
      return response.success({ message: '补签成功' });

    } else {
      // 取消签到：删除该日期记录
      const { data: deleted, error: delError } = await db
        .from('appointment_checkins')
        .delete()
        .eq('appointment_id', appointment.id)
        .eq('checkin_date', checkinDate);

      if (delError) throw delError;

      console.log(`[manageDailyCheckin] 取消签到: appointment_id=${appointment.id}, date=${checkinDate}`);
      return response.success({ message: '已取消签到' });
    }

  } catch (error) {
    console.error('[manageDailyCheckin] 操作失败:', error);
    return response.error('操作失败', error);
  }
};
