/**
 * 管理端接口：删除商城商品
 * Action: deleteMallGoods
 */
const { db, response } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id } = event;

  if (!id) {
    return response.paramError('商品ID不能为空');
  }

  try {
    console.log(`[deleteMallGoods] 管理员删除商品:`, { admin_id: admin.id, id });

    // 检查是否有兑换记录（有兑换记录的商品不能删除，只能下架）
    const exchangeCheck = await db
      .from('mall_exchange_records')
      .select('id', { count: 'exact' })
      .eq('goods_id', id);

    if (exchangeCheck.count > 0) {
      return response.error('该商品已有兑换记录，无法删除，请下架处理');
    }

    await db.from('mall_goods').delete().eq('id', id);

    return response.success({}, '删除成功');
  } catch (error) {
    console.error('[deleteMallGoods] 失败:', error);
    return response.error('删除商城商品失败', error);
  }
};
