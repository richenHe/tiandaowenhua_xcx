/**
 * 管理端接口：商城商品列表
 * Action: getMallGoodsList
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { keyword, status, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getMallGoodsList] 管理员查询商城商品:`, { admin_id: admin.id, keyword, status });

    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('mall_goods')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true });

    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.like('goods_name', `%${keyword.trim()}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 转换商品图片 cloud:// fileID 为 CDN HTTPS URL
    const list = (result.list || []).map(item => ({
      ...item,
      goods_image: cloudFileIDToURL(item.goods_image || '')
    }));

    return response.success({ ...result, list }, '查询成功');
  } catch (error) {
    console.error('[getMallGoodsList] 失败:', error);
    return response.error('查询商城商品列表失败', error);
  }
};
