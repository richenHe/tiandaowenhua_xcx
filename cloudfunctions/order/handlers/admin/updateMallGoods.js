/**
 * 管理端接口：更新商城商品
 * Action: updateMallGoods
 */
const { db, response } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const {
    id,
    goods_name,
    description,
    goods_image,
    merit_points_price,
    stock_quantity,
    limit_per_user,
    sort_order,
    status
  } = event;

  if (!id) {
    return response.paramError('商品ID不能为空');
  }

  try {
    console.log(`[updateMallGoods] 管理员更新商品:`, { admin_id: admin.id, id });

    const updateData = {};
    if (goods_name !== undefined) updateData.goods_name = goods_name.trim();
    if (description !== undefined) updateData.description = description;
    if (goods_image !== undefined) updateData.goods_image = goods_image;
    if (merit_points_price !== undefined) updateData.merit_points_price = parseFloat(merit_points_price);
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity);
    if (limit_per_user !== undefined) updateData.limit_per_user = parseInt(limit_per_user);
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);
    if (status !== undefined) updateData.status = parseInt(status);

    if (Object.keys(updateData).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    await db.from('mall_goods').update(updateData).eq('id', id);

    return response.success({}, '更新成功');
  } catch (error) {
    console.error('[updateMallGoods] 失败:', error);
    return response.error('更新商城商品失败', error);
  }
};
