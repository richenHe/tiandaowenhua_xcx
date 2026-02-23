/**
 * 管理端接口：获取轮播图列表
 */
const { db, response, executePaginatedQuery, getTempFileURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, keyword, status } = event;

  try {
    const finalPageSize = page_size || pageSize || 20;

    let queryBuilder = db
      .from('banners')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });

    if (keyword) {
      queryBuilder = queryBuilder.ilike('title', `%${keyword}%`);
    }
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);
    const list = result.list || [];

    // tiandao_culture.banners 用 image_url 存储图片
    // image_url 可能是云存储 fileID（cloud://）或直接 HTTP URL，统一处理
    for (const item of list) {
      const rawUrl = item.image_url || '';
      if (rawUrl && rawUrl.startsWith('cloud://')) {
        try {
          const res = await getTempFileURL(rawUrl);
          item.cover_image_url = res.tempFileURL || rawUrl;
        } catch (e) {
          item.cover_image_url = rawUrl;
        }
      } else {
        // 直接 HTTP URL，无需转换
        item.cover_image_url = rawUrl;
      }
    }

    return response.success({ ...result, list }, '获取成功');
  } catch (error) {
    console.error('[admin:getAdminBannerList] 失败:', error);
    return response.error('获取轮播图列表失败', error);
  }
};
