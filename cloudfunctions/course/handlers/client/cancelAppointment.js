/**
 * 取消预约（客户端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { appointment_id } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ appointment_id }, ['appointment_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询预约记录（appointments 表无 deleted_at 列）
    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .eq('user_id', user.id)
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (!appointment) {
      return response.notFound('预约记录不存在');
    }

    if (appointment.status === 3) {
      return response.error('预约已取消');
    }

    if (appointment.status === 2) {
      return response.error('已签到的预约不能取消');
    }

    // 查询上课记录
    const { data: classRecord } = await db
      .from('class_records')
      .select('id, booked_quota')
      .eq('id', appointment.class_record_id)
      .single();

    // 取消预约（cancel_time 为实际列名）
    await db
      .from('appointments')
      .update({
        status: 3,
        cancel_time: new Date().toISOString()
      })
      .eq('id', appointment_id);

    // 恢复名额
    if (classRecord) {
      await db
        .from('class_records')
        .update({ booked_quota: Math.max(0, (classRecord.booked_quota || 0) - 1) })
        .eq('id', appointment.class_record_id);
    }

    return response.success({
      message: '取消预约成功'
    });

  } catch (error) {
    console.error('[Course/cancelAppointment] 取消失败:', error);
    return response.error('取消预约失败', error);
  }
};
