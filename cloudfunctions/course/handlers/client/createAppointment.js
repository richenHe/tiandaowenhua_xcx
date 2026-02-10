/**
 * 创建预约（客户端接口）
 */
const { findOne, insert, transaction } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { class_record_id } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ class_record_id }, ['class_record_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询上课记录
    const classRecord = await findOne(
      'class_records',
      'id = ? AND status = 1 AND deleted_at IS NULL',
      [class_record_id]
    );

    if (!classRecord) {
      return response.notFound('上课记录不存在或已取消');
    }

    // 验证用户是否已购买该课程
    const userCourse = await findOne(
      'user_courses',
      'user_id = ? AND course_id = ? AND deleted_at IS NULL',
      [user.id, classRecord.course_id]
    );

    if (!userCourse) {
      return response.forbidden('您还未购买该课程');
    }

    // 检查是否已预约
    const existingAppointment = await findOne(
      'appointments',
      'user_id = ? AND class_record_id = ? AND status IN (1,2) AND deleted_at IS NULL',
      [user.id, class_record_id]
    );

    if (existingAppointment) {
      return response.error('您已预约该课程，请勿重复预约');
    }

    // 检查名额
    if (classRecord.current_students >= classRecord.max_students) {
      return response.error('该课程名额已满');
    }

    // 事务处理：创建预约 + 扣减名额
    await transaction(async (conn) => {
      // 创建预约记录
      const appointmentId = await insert(
        'appointments',
        {
          user_id: user.id,
          course_id: classRecord.course_id,
          class_record_id: class_record_id,
          status: 1, // 待上课
          appointed_at: new Date()
        },
        conn
      );

      // 扣减名额（使用原始 SQL）
      await conn.query(
        'UPDATE class_records SET current_students = current_students + 1 WHERE id = ?',
        [class_record_id]
      );

      return appointmentId;
    });

    return response.success({
      message: '预约成功',
      class_record_id,
      class_date: classRecord.class_date,
      start_time: classRecord.start_time
    });

  } catch (error) {
    console.error('[Course/createAppointment] 创建失败:', error);
    return response.error('创建预约失败', error);
  }
};
