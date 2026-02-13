/**
 * 客户端接口：商城商品列表
 * Action: getMallGoods
 */
const { db, response } = require('../../common');
const { getTempFileURL } = require('../../common/storage');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { keyword, page = 1, page_size = 10 } = event;

  try {
    console.log(`[getMallGoods] 查询商城商品:`, { keyword, page });

    // 1. 计算分页参数
    const limit = parseInt(page_size) || 10;
    const offset = (parseInt(page) - 1) * limit;

    // 2. 构建基础查询
    let queryBuilder = db
      .from('mall_goods')
      .select('*', { count: 'exact' })
      .eq('status', 1) // 只查询上架商品
      .order('sort_order', { ascending: true })
      .range(offset, offset + limit - 1);

    // 3. 关键词过滤
    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.or(
        `goods_name.ilike.%${keyword}%,description.ilike.%${keyword}%`
      );
    }

    // 4. 执行查询
    const { data: goods, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 5. 格式化商品列表
    const list = (goods || []).map(item => ({
      id: item.id,
      goods_name: item.goods_name,
      goods_image: item.goods_image,
      merit_points_price: item.merit_points_price,
      stock_quantity: item.stock_quantity,
      sold_quantity: item.sold_quantity,
      description: item.description,
      is_unlimited_stock: item.stock_quantity === -1,
      can_exchange: item.stock_quantity === -1 || item.stock_quantity > 0
    }));

    // 🔥 转换云存储 fileID 为临时 URL
    if (list && list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(item => {
        if (item.goods_image) fileIDs.push(item.goods_image);
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(item => {
        if (item.goods_image && urlMap[item.goods_image]) {
          item.goods_image = urlMap[item.goods_image];
        }
      });
    }

    console.log(`[getMallGoods] 查询成功，共 ${total} 件商品`);

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getMallGoods] 失败:`, error);
    return response.error('查询商城商品失败', error);
  }
};
