/**
 * 获取案例列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（注意：academy_cases 表没有 deleted_at 字段，实际字段是 image_url 而非 cover_image）
    let queryBuilder = db
      .from('academy_cases')
      .select(`
        id,
        student_name,
        student_avatar,
        student_title,
        title,
        summary,
        content,
        video_url,
        images,
        course_id,
        course_name,
        view_count,
        like_count,
        sort_order,
        is_featured,
        status,
        created_at,
        updated_at
      `, { count: 'exact' });

    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%,student_name.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: list, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
