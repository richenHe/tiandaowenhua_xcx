/**
 * 更新课程分类（管理端接口）
 * 系统分类(is_system=1)禁止编辑
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { id, name, sortOrder, status } = event;

  try {
    if (!id) {
      return response.paramError('缺少分类ID');
    }

    const category = await findOne('course_categories', { id });
    if (!category) {
      return response.notFound('分类不存在');
    }

    if (category.is_system === 1) {
      return response.error('系统内置分类不可编辑');
    }

    const fields = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return response.paramError('分类名称不能为空');
      }
      fields.name = name.trim();
    }
    if (sortOrder !== undefined) fields.sort_order = parseInt(sortOrder) || 0;
    if (status !== undefined) fields.status = parseInt(status);

    if (Object.keys(fields).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    await update('course_categories', fields, { id });

    return response.success(null, '分类更新成功');
  } catch (error) {
    console.error('[updateCategory] 更新失败:', error);
    return response.error('更新分类失败', error);
  }
};
