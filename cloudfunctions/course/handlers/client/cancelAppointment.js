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

    // 取消预约（cancel_time 为实际列名，日期必须用 YYYY-MM-DD HH:MM:SS 格式）
    const now = new Date();
    const cancelTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const { error: updateErr } = await db
      .from('appointments')
      .update({
        status: 3,
        cancel_time: cancelTimeStr
      })
      .eq('id', appointment_id);

    if (updateErr) {
      console.error('[Course/cancelAppointment] 更新预约状态失败:', updateErr);
      throw updateErr;
    }

    // 恢复名额
    if (classRecord) {
      const newQuota = Math.max(0, (classRecord.booked_quota || 0) - 1);
      console.log(`[Course/cancelAppointment] 恢复名额: class_record_id=${appointment.class_record_id}, ${classRecord.booked_quota} -> ${newQuota}`);
      const { error: quotaErr } = await db
        .from('class_records')
        .update({ booked_quota: newQuota })
        .eq('id', appointment.class_record_id);

      if (quotaErr) {
        console.error('[Course/cancelAppointment] 恢复名额失败:', quotaErr);
      }
    }

    return response.success({
      message: '取消预约成功'
    });

  } catch (error) {
    console.error('[Course/cancelAppointment] 取消失败:', error);
    return response.error('取消预约失败', error);
  }
};
