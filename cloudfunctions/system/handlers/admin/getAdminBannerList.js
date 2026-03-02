/**
 * 管理端接口：获取轮播图列表
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, keyword, status } = event;

  try {
    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('banners')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: false });

    if (keyword) {
      queryBuilder = queryBuilder.like('title', `%${keyword}%`);
    }
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);
    const list = result.list || [];

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL
    list.forEach(item => {
      item.cover_image_url = cloudFileIDToURL(item.image_url || '');
    });

    return response.success({ ...result, list }, '获取成功');
  } catch (error) {
    console.error('[admin:getAdminBannerList] 失败:', error);
    return response.error('获取轮播图列表失败', error);
  }
};
