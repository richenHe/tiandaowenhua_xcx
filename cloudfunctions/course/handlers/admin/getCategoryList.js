/**
 * 获取课程分类列表（管理端接口）
 * 返回所有分类（含禁用），按 sort_order 排序
 */
const { query, count } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { status, page = 1, page_size = 100 } = event;

  try {
    const where = {};
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }

    const list = await query('course_categories', {
      where,
      orderBy: { column: 'sort_order', ascending: true }
    });

    return response.success({ list, total: list.length });
  } catch (error) {
    console.error('[getCategoryList] 查询失败:', error);
    return response.error('查询分类列表失败', error);
  }
};
