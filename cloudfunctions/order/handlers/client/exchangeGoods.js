/**
 * 客户端接口：功德分兑换商品
 * Action: exchangeGoods
 *
 * 使用功德分(+积分)兑换商品，直接完成扣除
 * 不走支付接口，不创建 orders 表记录
 */
const { findOne, insert, update, db } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { goods_id, quantity = 1, use_cash_points_if_not_enough = false } = event;

  try {
    console.log(`[exchangeGoods] 兑换商品:`, { user_id: user.id, goods_id, quantity });

    // 1. 权限验证 - 检查资料是否完善
    if (!user.profile_completed) {
      return response.forbidden('请先完善资料', {
        action: 'complete_profile',
        redirect_url: '/pages/auth/complete-profile/index'
      });
    }

    // 2. 参数验证
    if (!goods_id || quantity <= 0) {
      return response.paramError('参数错误');
    }

    // 3. 查询商品信息
    const goods = await findOne('mall_goods', { id: goods_id });
    if (!goods) {
      return response.notFound('商品不存在');
    }
    if (goods.status !== 1) {
      return response.error('商品已下架');
    }

    // 4. 检查库存
    if (goods.stock_quantity !== -1 && goods.stock_quantity < quantity) {
      return response.error('库存不足');
    }

    // 5. 计算支付方式（与前端三种情况对应）
    const totalCost = goods.merit_points_price * quantity;
    let merit_points_used = 0;
    let cash_points_used = 0;

    if (user.merit_points >= totalCost) {
      // 情况1：功德分充足，只用功德分
      merit_points_used = totalCost;
      cash_points_used = 0;
    } else if (use_cash_points_if_not_enough) {
      // 情况2：功德分不足但积分足够，只用积分全额支付（不动功德分）
      merit_points_used = 0;
      cash_points_used = totalCost;

      if (user.cash_points_available < cash_points_used) {
        return response.error(`现金积分不足，还需 ${cash_points_used - user.cash_points_available} 积分`);
      }
    } else {
      // 情况3：功德分不足且未允许积分补足
      return response.error(`功德分不足，还需 ${totalCost - user.merit_points} 功德分`);
    }

    // 6. 生成兑换单号
    const exchange_no = generateExchangeNo();

    // 7. 执行兑换操作（CloudBase SDK 不支持 db.raw，使用 JS 计算值）
    try {
      // 7.1 扣除功德分和积分（用 JS 计算后的值直接更新）
      await update('users',
        {
          merit_points: parseFloat(user.merit_points) - merit_points_used,
          cash_points_available: parseFloat(user.cash_points_available) - cash_points_used
        },
        { id: user.id }
      );

      // 7.2 更新商品库存
      if (goods.stock_quantity !== -1) {
        await update('mall_goods',
          {
            sold_quantity: (goods.sold_quantity || 0) + quantity,
            stock_quantity: goods.stock_quantity - quantity
          },
          { id: goods_id }
        );
      } else {
        await update('mall_goods',
          { sold_quantity: (goods.sold_quantity || 0) + quantity },
          { id: goods_id }
        );
      }

      // 7.3 创建兑换记录（使用数据库实际列名）
      await insert('mall_exchange_records', {
        exchange_no,
        user_id: user.id,
        _openid: OPENID || '',
        goods_id: goods_id,
        goods_name: goods.goods_name,
        quantity,
        unit_price: goods.merit_points_price,  // NOT NULL，必须填写
        merit_points_used,
        cash_points_used,
        total_cost: totalCost,
        status: 1
      });

      // 7.4 插入功德分明细记录（使用数据库实际列名）
      if (merit_points_used > 0) {
        await insert('merit_points_records', {
          user_id: user.id,
          _openid: OPENID || '',
          type: 2,                                              // 消费
          source: 6,                                            // 实际列名（非 source_type）：6=商城兑换
          amount: -merit_points_used,
          balance_after: parseFloat(user.merit_points) - merit_points_used,
          exchange_no,                                          // 关联兑换单号（非 source_id）
          remark: `兑换商品：${goods.goods_name}`              // 实际列名（非 description）
        });
      }

      // 7.5 插入积分明细记录（使用数据库实际列名）
      if (cash_points_used > 0) {
        await insert('cash_points_records', {
          user_id: user.id,
          _openid: OPENID || '',
          type: 2,                                              // 消费
          amount: -cash_points_used,
          available_after: parseFloat(user.cash_points_available) - cash_points_used,  // 实际列名（非 balance_after）
          remark: `兑换商品：${goods.goods_name}`              // 实际列名（非 description）
        });
      }

      console.log(`[exchangeGoods] 兑换成功:`, exchange_no);

      return response.success({
        exchange_no,
        goods_name: goods.goods_name,
        quantity,
        merit_points_used,
        cash_points_used,
        total_cost: totalCost,
        status: '兑换成功',
        pickup_info: '请凭兑换单号到前台领取'
      }, '兑换成功');

    } catch (txError) {
      console.error(`[exchangeGoods] 事务失败:`, txError);
      throw txError;
    }

  } catch (error) {
    console.error(`[exchangeGoods] 失败:`, error);
    return response.error(error.message || '兑换商品失败', error);
  }
};

/**
 * 生成兑换单号
 */
function generateExchangeNo() {
  return business.generateOrderNo('EX');
}
