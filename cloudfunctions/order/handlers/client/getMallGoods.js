/**
 * 客户端接口：商城商品列表
 * Action: getMallGoods
 */
const { db, response, storage, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[getMallGoods] 查询商城商品:`, { keyword, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建基础查询
    let queryBuilder = db
      .from('mall_goods')
      .select('*', { count: 'exact' })
      .eq('status', 1) // 只查询上架商品
      .order('sort_order', { ascending: true });

    // 关键词过滤
    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.or(
        `goods_name.ilike.%${keyword}%,description.ilike.%${keyword}%`
      );
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化商品列表并转换云存储 fileID 为临时 URL
    const list = await Promise.all((result.list || []).map(async item => {
      let goodsImageUrl = item.goods_image || '';
      if (item.goods_image) {
        try {
          const tempResult = await storage.getTempFileURL(item.goods_image);
          if (tempResult.success && tempResult.tempFileURL) {
            goodsImageUrl = tempResult.tempFileURL;
          } else {
            console.warn(`[getMallGoods] 转换临时URL失败，fileID: ${item.goods_image}, 错误: ${tempResult.message}`);
          }
        } catch (error) {
          console.warn('[getMallGoods] 转换临时URL失败:', item.goods_image, error.message);
        }
      }

      return {
        id: item.id,
        goods_name: item.goods_name,
        goods_image: goodsImageUrl,
        merit_points_price: item.merit_points_price,
        stock_quantity: item.stock_quantity,
        sold_quantity: item.sold_quantity,
        description: item.description,
        is_unlimited_stock: item.stock_quantity === -1,
        can_exchange: item.stock_quantity === -1 || item.stock_quantity > 0
      };
    }));

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
