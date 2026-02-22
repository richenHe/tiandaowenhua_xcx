/**
 * 删除资料（管理端接口）
 */
const { findOne, softDelete } = require('../../common/db');
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

    // 查询资料是否存在
    const material = await findOne('academy_materials', { id });
    if (!material) {
      return response.notFound('资料不存在');
    }

    // 删除资料（academy_materials 表没有 deleted_at 字段，使用状态标记）
    const { update } = require('../../common/db');
    await update('academy_materials', { status: 0 }, { id });

    return response.success({
      success: true,
      message: '资料删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteMaterial] 删除失败:', error);
    return response.error('删除资料失败', error);
  }
};
