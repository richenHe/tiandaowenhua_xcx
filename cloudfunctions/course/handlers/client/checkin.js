/**
 * 签到（客户端接口）
 *
 * 非沙龙课程：按日签到，在 appointment_checkins 表中记录每日签到
 * 沙龙课程(type=4)：保持原有逻辑，更新 appointments.status=1
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, generateCode, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { appointment_id, checkin_code } = event;
  const { user } = context;

  try {
    const validation = validateRequired({ appointment_id }, ['appointment_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询预约记录
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

    // 查询排期信息（含课程类型和日期范围）
    const { data: classRecord } = await db
      .from('class_records')
      .select('course_type, class_date, class_end_date')
      .eq('id', appointment.class_record_id)
      .single();

    const isSalon = classRecord && classRecord.course_type === 4;

    // ===== 沙龙课程：保持原有逻辑 =====
    if (isSalon) {
      if (appointment.status === 1) return response.error('已签到，请勿重复签到');
      if (appointment.status === 2) return response.error('已缺席，无法签到');
      if (appointment.status === 3) return response.error('预约已取消，无法签到');

      if (checkin_code) {
        if (appointment.checkin_code !== checkin_code) {
          return response.error('签到码错误');
        }
      } else {
        const newCheckinCode = generateCode(6);
        await db.from('appointments').update({ checkin_code: newCheckinCode }).eq('id', appointment_id);
        return response.success({ message: '签到码已生成', checkin_code: newCheckinCode, need_verify: true });
      }

      await db.from('appointments')
        .update({ status: 1, checkin_time: formatDateTime(new Date()) })
        .eq('id', appointment_id);

      return response.success({ message: '签到成功', checkin_at: formatDateTime(new Date()) });
    }

    // ===== 非沙龙课程：日签到逻辑 =====
    if (appointment.status === 3) return response.error('预约已取消，无法签到');
    if (appointment.status === 1) return response.error('课程已结课，无法签到');

    // 校验今天是否在排期日期范围内
    const today = new Date().toISOString().slice(0, 10);
    const startDate = classRecord?.class_date;
    const endDate = classRecord?.class_end_date || startDate;

    if (!startDate || today < startDate || today > endDate) {
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
      return response.success({ message: '今日已签到', checkin_at: formatDateTime(new Date()), already_checked: true });
    }

    const now = formatDateTime(new Date());

    // 插入每日签到记录
    await db.from('appointment_checkins').insert({
      appointment_id: appointment.id,
      checkin_date: today,
      checkin_time: now,
      checkin_type: 1,
      _openid: user._openid || user.openid || '',
      created_at: now
    });

    console.log(`[Course/checkin] 日签到成功: user_id=${user.id}, appointment_id=${appointment.id}, date=${today}`);

    return response.success({
      message: '今日签到成功',
      checkin_at: now
    });

  } catch (error) {
    console.error('[Course/checkin] 签到失败:', error);
    return response.error('签到失败', error);
  }
};
