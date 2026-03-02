/**
 * 获取资料列表（公开接口）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询
    let queryBuilder = db.from('academy_materials')
      .select('id, title, category, image_url, video_url, content, tags, view_count, download_count, share_count, sort_order, created_at', { count: 'exact' })
      .eq('status', 1)
      .order('id', { ascending: true });

    // 添加分类筛选
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,content.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL（无需 API 调用）
    const list = result.list || [];
    list.forEach(item => {
      if (item.image_url) item.image_url = cloudFileIDToURL(item.image_url);
      if (item.video_url) item.video_url = cloudFileIDToURL(item.video_url);
    });

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
