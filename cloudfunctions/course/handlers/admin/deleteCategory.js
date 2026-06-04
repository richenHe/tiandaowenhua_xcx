/**
 * 删除课程分类（管理端接口）
 * 系统分类(is_system=1)禁止删除
 * 有关联课程的分类禁止删除
 */
const { findOne, deleteRecord, db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    if (!id) {
      return response.paramError('缺少分类ID');
    }

    const category = await findOne('course_categories', { id });
    if (!category) {
      return response.notFound('分类不存在');
    }

    if (category.is_system === 1) {
      return response.error('系统内置分类不可删除');
    }

    // 检查是否有课程引用此分类
    const { data: courses, error } = await db
      .from('courses')
      .select('id')
      .eq('category_id', id)
      .eq('is_deleted', 0)
      .limit(1);

    if (error) throw error;

    if (courses && courses.length > 0) {
      return response.error('该分类下存在课程，无法删除。请先删除或转移相关课程。');
    }

    await deleteRecord('course_categories', { id });

    return response.success(null, '分类删除成功');
  } catch (error) {
    console.error('[deleteCategory] 删除失败:', error);
    return response.error('删除分类失败', error);
  }
};
