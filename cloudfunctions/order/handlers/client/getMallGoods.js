/**
 * 客户端接口：商城商品列表
 * Action: getMallGoods
 */
const { from } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { keyword, page = 1, page_size = 10 } = event;

  try {
    console.log(`[getMallGoods] 查询商城商品:`, { keyword, page });

    // 1. 构建查询
    let queryBuilder = from('mall_goods')
      .where('status', 1); // 只查询上架商品

    // 2. 关键词过滤
    if (keyword) {
      queryBuilder = queryBuilder.and(qb => {
        qb.where('goods_name', 'like', `%${keyword}%`)
          .orWhere('description', 'like', `%${keyword}%`);
      });
    }

    // 3. 查询总数
    const { total } = await queryBuilder.clone().count('* as total').then(res => res[0] || { total: 0 });

    // 4. 获取分页参数并查询列表
    const { limit, offset } = getPagination(page, page_size);
    const goods = await queryBuilder
      .orderBy('sort_order', 'asc')
      .limit(limit)
      .offset(offset);

    // 5. 格式化商品列表
    const list = goods.map(item => ({
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

    console.log(`[getMallGoods] 查询成功，共 ${total} 件商品`);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getMallGoods] 失败:`, error);
    return response.error('查询商城商品失败', error);
  }
};
