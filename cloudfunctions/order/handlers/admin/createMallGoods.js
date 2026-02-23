/**
 * 管理端接口：创建商城商品
 * Action: createMallGoods
 */
const { db, response } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const {
    goods_name,
    description = '',
    goods_image = '',
    merit_points_price,
    stock_quantity = -1,
    limit_per_user = 0,
    sort_order = 0,
    status = 1
  } = event;

  if (!goods_name || !goods_name.trim()) {
    return response.paramError('商品名称不能为空');
  }
  if (!merit_points_price || merit_points_price <= 0) {
    return response.paramError('功德分价格必须大于0');
  }

  try {
    console.log(`[createMallGoods] 管理员创建商品:`, { admin_id: admin.id, goods_name, merit_points_price });

    const result = await db.from('mall_goods').insert({
      goods_name: goods_name.trim(),
      description,
      goods_image,
      merit_points_price: parseFloat(merit_points_price),
      stock_quantity: parseInt(stock_quantity),
      limit_per_user: parseInt(limit_per_user),
      sort_order: parseInt(sort_order),
      status: parseInt(status),
      sold_quantity: 0
    }).select();

    return response.success(result.data?.[0] || {}, '创建成功');
  } catch (error) {
    console.error('[createMallGoods] 失败:', error);
    return response.error('创建商城商品失败', error);
  }
};
