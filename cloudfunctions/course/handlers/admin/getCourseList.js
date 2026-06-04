/**
 * 获取课程列表（管理端接口）
 *
 * 使用 CloudBase Query Builder（不使用 mysql2，避免连接问题）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL, query } = require('../../common');

module.exports = async (event, context) => {
  const { type, categoryId, status, keyword, page = 1, page_size = 10, pageSize } = event;

  console.log('[getCourseList] 开始执行');
  console.log('[getCourseList] 接收参数:', JSON.stringify({ type, categoryId, status, keyword, page, page_size }));

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 使用 Query Builder 查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false });

    // 添加分类ID过滤（优先于 type）
    if (categoryId) {
      queryBuilder = queryBuilder.eq('category_id', parseInt(categoryId));
    } else if (type) {
      // 向后兼容：未传 categoryId 时仍可用 type 过滤
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 始终过滤已软删除的课程
    queryBuilder = queryBuilder.eq('is_deleted', 0);

    // 添加状态过滤
    if (status !== undefined && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`name.like.%${keyword}%,description.like.%${keyword}%`);
    }

    console.log('[getCourseList] 执行分页查询...');

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    console.log('[getCourseList] 查询成功:', { total: result.total, count: result.list?.length });

    // 获取所有分类（用于映射 category_id → category_name）
    const categories = await query('course_categories', { orderBy: { column: 'sort_order', ascending: true } });
    const categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.id] = cat.name;
    }

    // 🔥 同时转换封面图 cloud:// fileID 为 CDN HTTPS URL
    const list = (result.list || []).map(course => ({
      ...course,
      cover_image: cloudFileIDToURL(course.cover_image || ''),
      category_name: categoryMap[course.category_id] || ''
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getCourseList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
