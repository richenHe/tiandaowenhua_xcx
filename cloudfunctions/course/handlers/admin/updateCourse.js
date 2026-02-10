/**
 * 更新课程（管理端接口）
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

    // 查询课程是否存在
    const course = await findOne('courses', 'id = ? AND deleted_at IS NULL', [id]);
    if (!course) {
      return response.notFound('课程不存在');
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'name', 'type', 'cover_image', 'description', 'content',
      'outline', 'teacher', 'duration', 'current_price', 'original_price',
      'retrain_price', 'allow_retrain', 'sort_order', 'status'
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

    // 更新课程
    await update('courses', fieldsToUpdate, 'id = ?', [id]);

    return response.success({
      message: '课程更新成功'
    });

  } catch (error) {
    console.error('[Course/updateCourse] 更新失败:', error);
    return response.error('更新课程失败', error);
  }
};
