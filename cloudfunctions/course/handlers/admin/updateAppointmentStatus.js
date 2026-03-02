/**
 * 更新预约状态（管理端接口）
 *
 * 状态枚举（与 client:checkin 和前端 HTML 保持一致）：
 *   1 = 已签到
 *   2 = 缺席
 *   3 = 已取消
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  // 兼容 id / appointment_id 两种参数名
  const appointmentId = event.id || event.appointment_id;
  const { status, notes } = event;

  try {
    // 参数验证
    const validation = validateRequired({ appointmentId, status }, ['appointmentId', 'status']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 验证状态值：1=已签到 2=缺席 3=已取消
    if (![1, 2, 3].includes(parseInt(status))) {
      return response.paramError('无效的状态值，合法值：1=已签到 2=缺席 3=已取消');
    }

    // 查询预约是否存在（同时取 user_id / course_id，供签到时更新 attend_count）
    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select('id, user_id, course_id, status')
      .eq('id', appointmentId)
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (!appointment) {
      return response.notFound('预约记录不存在');
    }

    // 构建更新数据
    const updateData = { status: parseInt(status) };

    if (notes) {
      updateData.notes = notes;
    }

    // status=1（已签到）：记录签到时间
    if (parseInt(status) === 1) {
      updateData.checkin_time = formatDateTime(new Date());
    }

    // status=3（已取消）：记录取消时间
    if (parseInt(status) === 3) {
      updateData.cancel_time = formatDateTime(new Date());
    }

    // 更新预约状态
    const { error: updateError } = await db
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // status=1（已签到）：更新用户课程上课次数 +1
    if (parseInt(status) === 1) {
      const { data: userCourse } = await db
        .from('user_courses')
        .select('id, attend_count')
        .eq('user_id', appointment.user_id)
        .eq('course_id', appointment.course_id)
        .single();

      if (userCourse) {
        await db
          .from('user_courses')
          .update({ attend_count: (userCourse.attend_count || 0) + 1 })
          .eq('id', userCourse.id);

        console.log(`[Course/updateAppointmentStatus] attend_count 更新: user_id=${appointment.user_id}, course_id=${appointment.course_id}, new_count=${(userCourse.attend_count || 0) + 1}`);
      }
    }

    return response.success({
      success: true,
      message: '预约状态更新成功'
    });

  } catch (error) {
    console.error('[Course/updateAppointmentStatus] 更新失败:', error);
    return response.error('更新预约状态失败', error);
  }
};
