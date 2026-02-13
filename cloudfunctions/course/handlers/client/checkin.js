/**
 * 签到（客户端接口）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, generateRandomCode, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { appointment_id, checkin_code } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ appointment_id }, ['appointment_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询预约记录
    const appointment = await findOne(
      'appointments',
      'id = ? AND user_id = ? AND deleted_at IS NULL',
      [appointment_id, user.id]
    );

    if (!appointment) {
      return response.notFound('预约记录不存在');
    }

    if (appointment.status === 2) {
      return response.error('已签到，请勿重复签到');
    }

    if (appointment.status === 3) {
      return response.error('预约已取消，无法签到');
    }

    // 如果提供了签到码，验证签到码
    if (checkin_code) {
      if (appointment.checkin_code !== checkin_code) {
        return response.error('签到码错误');
      }
    } else {
      // 生成签到码（6位数字）
      const newCheckinCode = generateRandomCode(6);

      await update(
        'appointments',
        { checkin_code: newCheckinCode },
        'id = ?',
        [appointment_id]
      );

      return response.success({
        message: '签到码已生成',
        checkin_code: newCheckinCode,
        need_verify: true
      });
    }

    // 更新签到状态
    await update(
      'appointments',
      {
        status: 2, // 已签到
        checkin_at: formatDateTime(new Date())
      },
      'id = ?',
      [appointment_id]
    );

    // 更新用户课程上课次数
    const userCourse = await findOne(
      'user_courses',
      'user_id = ? AND course_id = ?',
      [user.id, appointment.course_id]
    );

    if (userCourse) {
      await update(
        'user_courses',
        { attend_count: userCourse.attend_count + 1 },
        'id = ?',
        [userCourse.id]
      );
    }

    return response.success({
      message: '签到成功',
      checkin_at: formatDateTime(new Date())
    });

  } catch (error) {
    console.error('[Course/checkin] 签到失败:', error);
    return response.error('签到失败', error);
  }
};
