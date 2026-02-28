/**
 * 获取案例列表（管理端接口）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { category, status, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询
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
      `, { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 添加状态过滤
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,summary.like.%${keyword}%,student_name.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 转换云存储字段 cloud:// fileID 为 CDN HTTPS URL
    const list = (result.list || []).map(item => {
      let images = [];
      try { images = item.images ? JSON.parse(item.images) : []; } catch (e) {}
      return {
        ...item,
        student_avatar: cloudFileIDToURL(item.student_avatar || ''),
        video_url: cloudFileIDToURL(item.video_url || ''),
        images: images.map(img => cloudFileIDToURL(img))
      };
    });

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
