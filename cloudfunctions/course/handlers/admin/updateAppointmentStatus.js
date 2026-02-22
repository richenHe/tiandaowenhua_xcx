/**
 * 更新预约状态（管理端接口）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id, status, notes } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id, status }, ['id', 'status']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 验证状态值
    if (![1, 2, 3].includes(parseInt(status))) {
      return response.paramError('无效的状态值');
    }

    // 查询预约是否存在
    const appointment = await findOne('appointments', { id });
    if (!appointment) {
      return response.notFound('预约记录不存在');
    }

    // 更新预约状态
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    if (status === 2) {
      updateData.checkin_time = formatDateTime(new Date());
    } else if (status === 3) {
      updateData.cancel_time = formatDateTime(new Date());
    }

    await update('appointments', updateData, { id });

    return response.success({
      success: true,
      message: '预约状态更新成功'
    });

  } catch (error) {
    console.error('[Course/updateAppointmentStatus] 更新失败:', error);
    return response.error('更新预约状态失败', error);
  }
};
