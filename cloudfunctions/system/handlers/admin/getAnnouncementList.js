/**
 * 管理端接口：获取公告列表
 * Action: getAnnouncementList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - keyword: 关键词搜索（可选）
 * - category: 类型筛选（可选）
 * - excludeCategory: 排除指定类型（可选，如 'banner' 用于公告管理排除轮播图）
 * - status: 状态筛选（可选）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, keyword, category, excludeCategory, status } = event;

  try {
    console.log(`[admin:getAnnouncementList] 管理员 ${admin.id} 获取公告列表`);

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询
    let queryBuilder = db
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false });

    // 筛选条件
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,content.like.%${keyword}%`);
    }
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }
    if (excludeCategory) {
      // neq 不匹配 NULL，用 or 同时过滤：category != value 或 category IS NULL
      queryBuilder = queryBuilder.or(`category.neq.${excludeCategory},category.is.null`);
    }
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL（无需 API 调用）
    const list = result.list || [];
    list.forEach(a => {
      if (a.cover_image) a.cover_image = cloudFileIDToURL(a.cover_image);
    });

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAnnouncementList] 失败:', error);
    return response.error('获取公告列表失败', error);
  }
};
