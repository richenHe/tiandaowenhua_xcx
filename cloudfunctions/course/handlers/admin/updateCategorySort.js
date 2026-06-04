/**
 * 批量更新课程分类排序（管理端接口）
 * 接收排序数组 [{id, sortOrder}]，批量更新
 */
const { db, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { items } = event;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.paramError('缺少排序数据');
    }

    // 逐条更新排序
    for (const item of items) {
      if (!item.id) continue;
      await update('course_categories', { sort_order: parseInt(item.sortOrder) || 0 }, { id: item.id });
    }

    return response.success(null, '排序更新成功');
  } catch (error) {
    console.error('[updateCategorySort] 更新失败:', error);
    return response.error('更新排序失败', error);
  }
};
