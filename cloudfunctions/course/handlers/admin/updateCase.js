/**
 * 更新案例（管理端接口）
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

    // 查询案例是否存在
    const caseItem = await findOne('academy_cases', 'id = ? AND deleted_at IS NULL', [id]);
    if (!caseItem) {
      return response.notFound('案例不存在');
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'title', 'category', 'cover_image', 'summary', 'content',
      'author', 'sort_order', 'status'
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

    // 更新案例
    await update('academy_cases', fieldsToUpdate, 'id = ?', [id]);

    return response.success({
      message: '案例更新成功'
    });

  } catch (error) {
    console.error('[Course/updateCase] 更新失败:', error);
    return response.error('更新案例失败', error);
  }
};
