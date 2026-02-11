/**
 * 获取案例列表（公开接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（注意：academy_cases 表没有 deleted_at 字段）
    let queryBuilder = db.from('academy_cases')
      .select('id, title, student_name, student_avatar, student_title, summary, video_url, course_name, view_count, like_count, created_at', { count: 'exact' })
      .eq('status', 1);

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%,student_name.ilike.%${keyword}%`);
    }

    // 执行查询（带总数和分页）
    const { data: list, error, count: total } = await queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
