/**
 * 更新资料（管理端接口）
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

    // 查询资料是否存在
    const material = await findOne('academy_materials', 'id = ? AND deleted_at IS NULL', [id]);
    if (!material) {
      return response.notFound('资料不存在');
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'title', 'type', 'cover_image', 'description',
      'file_url', 'file_size', 'sort_order', 'status'
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

    // 更新资料
    await update('academy_materials', fieldsToUpdate, 'id = ?', [id]);

    return response.success({
      message: '资料更新成功'
    });

  } catch (error) {
    console.error('[Course/updateMaterial] 更新失败:', error);
    return response.error('更新资料失败', error);
  }
};
