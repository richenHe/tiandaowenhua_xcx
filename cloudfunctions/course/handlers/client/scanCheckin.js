/**
 * 扫码签到（客户端接口）
 *
 * 非沙龙课程：按日签到，在 appointment_checkins 表中记录每日签到
 * 沙龙课程(type=4)：保持原有逻辑，更新 appointments.status=1
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { classRecordId } = event;
  const { user } = context;

  try {
    const validation = validateRequired({ classRecordId }, ['classRecordId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const recordId = parseInt(classRecordId);

    // 查询排期信息（含课程类型、日期范围）
    const { data: classRecord, error: crError } = await db
      .from('class_records')
      .select('id, course_id, class_date, class_end_date, course_type')
      .eq('id', recordId)
      .single();

    if (crError || !classRecord) {
      return response.error('排期不存在');
    }

    // 查找当前用户在该排期下的有效预约记录（过滤已取消，取最新一条）
    const { data: appointments, error: findError } = await db
      .from('appointments')
      .select('id, status, course_id, order_no')
      .eq('user_id', user.id)
      .eq('class_record_id', recordId)
      .in('status', [0, 1, 2])
      .order('id', { ascending: false })
      .limit(1);

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return response.error('您没有该课程的预约记录，无法签到');
    }

    const appointment = appointments[0];
    const now = formatDateTime(new Date());
    const isSalon = classRecord.course_type === 4;

    // ===== 沙龙课程：保持原有逻辑 =====
    if (isSalon) {
      if (appointment.status === 1) return response.error('您已签到，请勿重复签到');
      if (appointment.status === 2) return response.error('该预约已标记为缺席，无法签到');
      if (appointment.status === 3) return response.error('该预约已取消，无法签到');

      await db.from('appointments')
        .update({ status: 1, checkin_time: now })
        .eq('id', appointment.id);

      console.log(`[Course/scanCheckin] 沙龙签到成功: user_id=${user.id}, appointment_id=${appointment.id}`);
      return response.success({ message: '签到成功', checkin_at: now });
    }

    // ===== 非沙龙课程：日签到逻辑 =====
    if (appointment.status === 3) return response.error('该预约已取消，无法签到');
    if (appointment.status === 1) return response.error('课程已结课，无法签到');

    // 校验今天是否在排期日期范围内
    const today = new Date().toISOString().slice(0, 10);
    const startDate = classRecord.class_date;
    const endDate = classRecord.class_end_date || classRecord.class_date;

    if (today < startDate || today > endDate) {
      return response.error('不在签到时间内');
    }

    // 检查今天是否已签到
    const { data: existingCheckin } = await db
      .from('appointment_checkins')
      .select('id')
      .eq('appointment_id', appointment.id)
      .eq('checkin_date', today)
      .limit(1);

    if (existingCheckin && existingCheckin.length > 0) {
      return response.success({ message: '今日已签到', checkin_at: now, already_checked: true });
    }

    // 插入每日签到记录
    await db.from('appointment_checkins').insert({
      appointment_id: appointment.id,
      checkin_date: today,
      checkin_time: now,
      checkin_type: 1,
      _openid: user._openid || user.openid || '',
      created_at: now
    });

    console.log(`[Course/scanCheckin] 日签到成功: user_id=${user.id}, appointment_id=${appointment.id}, date=${today}`);

    return response.success({
      message: '今日签到成功',
      checkin_at: now
    });

  } catch (error) {
    console.error('[Course/scanCheckin] 签到失败:', error);
    return response.error('签到失败', error);
  }
};
