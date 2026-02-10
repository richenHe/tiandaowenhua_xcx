/**
 * 删除上课排期（管理端接口）
 */
const { findOne, softDelete, query } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询排期是否存在
    const record = await findOne('class_records', 'id = ? AND deleted_at IS NULL', [id]);
    if (!record) {
      return response.notFound('上课排期不存在');
    }

    // 检查是否有预约记录
    const appointmentsSql = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE class_record_id = ? AND status IN (1,2) AND deleted_at IS NULL
    `;
    const appointmentsResult = await query(appointmentsSql, [id]);

    if (appointmentsResult[0].count > 0) {
      return response.error('该排期已有预约记录，无法删除');
    }

    // 软删除排期
    await softDelete('class_records', 'id = ?', [id]);

    return response.success({
      message: '上课排期删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteClassRecord] 删除失败:', error);
    return response.error('删除上课排期失败', error);
  }
};
