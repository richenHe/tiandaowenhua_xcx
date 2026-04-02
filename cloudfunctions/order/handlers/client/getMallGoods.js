/**
 * 客户端接口：商城商品列表（游客可读，不要求 users 表已注册）
 * Action: getMallGoods
 */
const { db, response, cloudFileIDToURL, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[getMallGoods] 查询商城商品:`, { keyword, page });

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建基础查询
    let queryBuilder = db
      .from('mall_goods')
      .select('*', { count: 'exact' })
      .eq('status', 1) // 只查询上架商品
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false });

    // 关键词过滤
    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.or(
        `goods_name.like.%${keyword}%,description.like.%${keyword}%`
      );
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 格式化商品列表，cloud:// fileID 直接转换为 CDN HTTPS URL
    const list = (result.list || []).map(item => {
      return {
        id: item.id,
        goods_name: item.goods_name,
        goods_image: cloudFileIDToURL(item.goods_image || ''),
        merit_points_price: item.merit_points_price,
        stock_quantity: item.stock_quantity,
        sold_quantity: item.sold_quantity,
        description: item.description,
        is_unlimited_stock: item.stock_quantity === -1,
        can_exchange: item.stock_quantity === -1 || item.stock_quantity > 0
      };
    });

    console.log(`[getMallGoods] 查询成功，共 ${result.total} 件商品`);

    return response.success({
      ...result,
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getMallGoods] 失败:`, error);
    return response.error('查询商城商品失败', error);
  }
};
