/**
 * 取消预约（客户端接口）
 */
const { findOne, update, transaction } = require('../../common/db');
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

    // 查询预约记录
    const appointment = await findOne(
      'appointments',
      'id = ? AND user_id = ? AND deleted_at IS NULL',
      [appointment_id, user.id]
    );

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
    const classRecord = await findOne(
      'class_records',
      'id = ?',
      [appointment.class_record_id]
    );

    // 事务处理：取消预约 + 恢复名额
    await transaction(async (conn) => {
      // 更新预约状态
      await update(
        'appointments',
        {
          status: 3, // 已取消
          cancelled_at: new Date()
        },
        'id = ?',
        [appointment_id],
        conn
      );

      // 恢复名额
      if (classRecord) {
        await update(
          'class_records',
          { current_students: Math.max(0, classRecord.current_students - 1) },
          'id = ?',
          [appointment.class_record_id],
          conn
        );
      }
    });

    return response.success({
      message: '取消预约成功'
    });

  } catch (error) {
    console.error('[Course/cancelAppointment] 取消失败:', error);
    return response.error('取消预约失败', error);
  }
};
