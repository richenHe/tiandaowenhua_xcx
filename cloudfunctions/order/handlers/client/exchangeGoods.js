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

    // 5. 计算混合支付
    const totalCost = goods.merit_points_price * quantity;
    let merit_points_used = 0;
    let cash_points_used = 0;

    if (user.merit_points >= totalCost) {
      // 功德分足够
      merit_points_used = totalCost;
      cash_points_used = 0;
    } else if (use_cash_points_if_not_enough) {
      // 功德分不足，使用积分补充
      merit_points_used = user.merit_points;
      cash_points_used = totalCost - merit_points_used;

      if (user.cash_points_available < cash_points_used) {
        return response.error(`现金积分不足，还需 ${cash_points_used - user.cash_points_available} 积分`);
      }
    } else {
      return response.error(`功德分不足，还需 ${totalCost - user.merit_points} 功德分`);
    }

    // 6. 生成兑换单号
    const exchange_no = generateExchangeNo();

    // 7. 开启事务处理
    try {
      // 7.1 扣除功德分和积分
      await update('users',
        {
          merit_points: db.raw(`merit_points - ${merit_points_used}`),
          cash_points_available: db.raw(`cash_points_available - ${cash_points_used}`)
        },
        { id: user.id }
      );

      // 7.2 更新商品库存
      if (goods.stock_quantity !== -1) {
        await update('mall_goods',
          {
            sold_quantity: db.raw(`sold_quantity + ${quantity}`),
            stock_quantity: db.raw(`stock_quantity - ${quantity}`)
          },
          { id: goods_id }
        );
      } else {
        await update('mall_goods',
          { sold_quantity: db.raw(`sold_quantity + ${quantity}`) },
          { id: goods_id }
        );
      }

      // 7.3 创建兑换记录
      await insert('mall_exchange_records', {
        exchange_no,
        user_id: user.id,
        goods_id: goods_id,
        goods_name: goods.goods_name,
        quantity,
        merit_points_used,
        cash_points_used,
        total_cost: totalCost,
        status: 1 // 已兑换
      });

      // 7.4 插入功德分明细记录
      if (merit_points_used > 0) {
        await insert('merit_points_records', {
          user_id: user.id,
          type: 2, // 消费
          amount: -merit_points_used,
          balance_after: user.merit_points - merit_points_used,
          source_type: 3, // 商城兑换
          source_id: goods_id,
          description: `兑换商品：${goods.goods_name}`
        });
      }

      // 7.5 插入积分明细记录
      if (cash_points_used > 0) {
        await insert('cash_points_records', {
          user_id: user.id,
          type: 2, // 消费
          amount: -cash_points_used,
          balance_after: user.cash_points_available - cash_points_used,
          source_type: 3, // 商城兑换
          source_id: goods_id,
          description: `兑换商品：${goods.goods_name}`
        });
      }

      console.log(`[exchangeGoods] 兑换成功:`, exchange_no);

      // 8. 返回兑换结果
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
      throw new Error('兑换失败，请重试');
    }

  } catch (error) {
    console.error(`[exchangeGoods] 失败:`, error);
    return response.error(error.message || '兑换商品失败', error);
  }
};

/**
 * 生成兑换单号
 * 格式：EX + 年月日 + 8位随机数
 */
function generateExchangeNo() {
  // 使用 business-logic 的 generateOrderNo，但替换前缀为 EX
  return business.generateOrderNo('EX');
}
