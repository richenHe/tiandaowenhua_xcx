/**
 * 客户端接口：撤销兑换
 * Action: cancelExchange
 *
 * 仅限 status=1（已兑换/未领取）可撤销
 * 退还功德分/积分，恢复商品库存，状态改为 3（已取消）
 */
const { findOne, insert, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { exchange_no } = event;

  try {
    console.log(`[cancelExchange] 撤销兑换:`, { user_id: user.id, exchange_no });

    // 1. 参数验证
    if (!exchange_no) {
      return response.paramError('兑换单号不能为空');
    }

    // 2. 查询兑换记录，验证归属
    const record = await findOne('mall_exchange_records', {
      exchange_no,
      user_id: user.id
    });

    if (!record) {
      return response.notFound('兑换记录不存在');
    }

    // 3. 验证状态
    if (record.status === 2) {
      return response.error('商品已领取，无法撤销');
    }
    if (record.status === 3) {
      return response.error('该记录已取消');
    }
    // status !== 1 的其他情况兜底
    if (record.status !== 1) {
      return response.error('当前状态不支持撤销');
    }

    const meritRefund = parseFloat(record.merit_points_used) || 0;
    const cashRefund = parseFloat(record.cash_points_used) || 0;

    // 4. 更新兑换状态为已取消
    await update('mall_exchange_records', { status: 3 }, { exchange_no });

    // 5. 退还功德分和积分
    const newMeritPoints = parseFloat(user.merit_points) + meritRefund;
    const newCashPoints = parseFloat(user.cash_points_available) + cashRefund;
    await update('users', {
      merit_points: newMeritPoints,
      cash_points_available: newCashPoints
    }, { id: user.id });

    // 6. 恢复商品库存
    const goods = await findOne('mall_goods', { id: record.goods_id });
    if (goods && goods.stock_quantity !== -1) {
      await update('mall_goods', {
        stock_quantity: goods.stock_quantity + record.quantity,
        sold_quantity: Math.max(0, (goods.sold_quantity || 0) - record.quantity)
      }, { id: record.goods_id });
    } else if (goods) {
      // 无限库存只恢复 sold_quantity
      await update('mall_goods', {
        sold_quantity: Math.max(0, (goods.sold_quantity || 0) - record.quantity)
      }, { id: record.goods_id });
    }

    // 7. 插入功德分退还明细（有功德分消耗时才记录）
    if (meritRefund > 0) {
      await insert('merit_points_records', {
        user_id: user.id,
        _openid: OPENID || '',
        type: 1,                          // 收入
        source: 6,                        // 商城兑换
        amount: meritRefund,
        balance_after: newMeritPoints,
        exchange_no,
        remark: `撤销兑换：${record.goods_name}`
      });
    }

    // 8. 插入积分退还明细（有积分消耗时才记录）
    if (cashRefund > 0) {
      await insert('cash_points_records', {
        user_id: user.id,
        _openid: OPENID || '',
        type: 3,                          // 直接发放（退还）
        amount: cashRefund,
        available_after: newCashPoints,
        remark: `撤销兑换：${record.goods_name}`
      });
    }

    console.log(`[cancelExchange] 撤销成功:`, exchange_no);

    return response.success({
      exchange_no,
      goods_name: record.goods_name,
      merit_points_refunded: meritRefund,
      cash_points_refunded: cashRefund,
      status: '已取消'
    }, '撤销成功');

  } catch (error) {
    console.error(`[cancelExchange] 失败:`, error);
    return response.error(error.message || '撤销兑换失败', error);
  }
};
