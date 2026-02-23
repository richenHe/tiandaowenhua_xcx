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
const { db, response, executePaginatedQuery, getTempFileURLs } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, keyword, category, excludeCategory, status } = event;

  try {
    console.log(`[admin:getAnnouncementList] 管理员 ${admin.id} 获取公告列表`);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
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

    // 🔥 转换云存储 fileID 为临时 URL
    const list = result.list || [];
    if (list.length > 0) {
      const fileIDs = list
        .filter(a => a.cover_image)
        .map(a => a.cover_image);

      if (fileIDs.length > 0) {
        try {
          const tempURLs = await getTempFileURLs(fileIDs);
          const urlMap = {};
          tempURLs.forEach(item => {
            urlMap[item.fileID] = item.tempFileURL;
          });

          // 替换 fileID 为临时 URL
          list.forEach(a => {
            if (a.cover_image && urlMap[a.cover_image]) {
              a.cover_image = urlMap[a.cover_image];
            }
          });
        } catch (error) {
          console.warn('转换封面图片URL失败（不阻塞）:', error);
        }
      }
    }

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAnnouncementList] 失败:', error);
    return response.error('获取公告列表失败', error);
  }
};
