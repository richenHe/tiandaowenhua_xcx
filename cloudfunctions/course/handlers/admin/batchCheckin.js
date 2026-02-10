/**
 * 批量签到（管理端接口）
 */
const { rawQuery, from } = require('../../common/db');
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

    // 查询待签到的预约记录
    const placeholders = user_ids.map(() => '?').join(',');
    const appointmentsSql = `
      SELECT id, user_id, course_id
      FROM appointments
      WHERE class_record_id = ?
        AND user_id IN (${placeholders})
        AND status = 1
        AND deleted_at IS NULL
    `;
    const appointments = await rawQuery(appointmentsSql, [class_record_id, ...user_ids]);

    if (appointments.length === 0) {
      return response.error('没有找到待签到的预约记录');
    }

    // 批量更新签到状态
    const appointmentIds = appointments.map(a => a.id);
    const updatePlaceholders = appointmentIds.map(() => '?').join(',');
    const updateSql = `
      UPDATE appointments
      SET status = 2, checkin_at = NOW()
      WHERE id IN (${updatePlaceholders})
    `;
    await rawQuery(updateSql, appointmentIds);

    // 更新用户课程上课次数
    for (const appointment of appointments) {
      const userCourseSql = `
        UPDATE user_courses
        SET attend_count = attend_count + 1
        WHERE user_id = ? AND course_id = ?
      `;
      await rawQuery(userCourseSql, [appointment.user_id, appointment.course_id]);
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
