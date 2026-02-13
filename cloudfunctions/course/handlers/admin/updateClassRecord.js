/**
 * 更新上课排期（管理端接口）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id, ...updateData } = event;

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

    // 过滤允许更新的字段
    const allowedFields = [
      'course_id', 'class_date', 'start_time', 'end_time',
      'location', 'teacher', 'total_quota', 'notes', 'status'
    ];

    const fieldsToUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fieldsToUpdate[field] = updateData[field];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新排期
    await update('class_records', fieldsToUpdate, 'id = ?', [id]);

    return response.success({
      message: '上课排期更新成功'
    });

  } catch (error) {
    console.error('[Course/updateClassRecord] 更新失败:', error);
    return response.error('更新上课排期失败', error);
  }
};
