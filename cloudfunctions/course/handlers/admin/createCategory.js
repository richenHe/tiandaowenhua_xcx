/**
 * 新增课程分类（管理端接口）
 * 新增的分类 is_system=0，status=1
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { name, sortOrder } = event;

  try {
    const validation = validateRequired({ name }, ['name']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return response.paramError('分类名称不能为空');
    }

    const [result] = await insert('course_categories', {
      name: name.trim(),
      sort_order: parseInt(sortOrder) || 0,
      status: 1,
      is_system: 0
    });

    return response.success({ id: result.id }, '分类创建成功');
  } catch (error) {
    console.error('[createCategory] 创建失败:', error);
    return response.error('创建分类失败', error);
  }
};
