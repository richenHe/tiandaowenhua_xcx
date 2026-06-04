/**
 * 获取课程分类列表（公开接口，前端 tabs 用）
 * 仅返回启用(status=1)的分类，排除咨询服务(category_id=3)
 * 按 sort_order 排序
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    const allCategories = await query('course_categories', {
      where: { status: 1 },
      orderBy: { column: 'sort_order', ascending: true }
    });

    // 前端不展示咨询服务（id=3）
    const list = allCategories.filter(c => c.id !== 3);

    return response.success({ list });
  } catch (error) {
    console.error('[public/getCategoryList] 查询失败:', error);
    return response.error('查询分类列表失败', error);
  }
};
