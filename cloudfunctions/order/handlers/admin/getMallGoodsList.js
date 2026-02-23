/**
 * 管理端接口：商城商品列表
 * Action: getMallGoodsList
 */
const { db, response, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { keyword, status, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getMallGoodsList] 管理员查询商城商品:`, { admin_id: admin.id, keyword, status });

    const finalPageSize = page_size || pageSize || 20;

    let queryBuilder = db
      .from('mall_goods')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: false });

    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.ilike('goods_name', `%${keyword.trim()}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    return response.success(result, '查询成功');
  } catch (error) {
    console.error('[getMallGoodsList] 失败:', error);
    return response.error('查询商城商品列表失败', error);
  }
};
