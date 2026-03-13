/**
 * 公共模块：推荐人奖励发放
 * 从 auditContractSignature.js 提取，供 adminCreateCourseContract / signContract 共用
 */

const { db } = require('./db');
const { formatDateTime } = require('./utils');

/**
 * 签约/录入合同后发放推荐人奖励
 * 查找该用户该课程的未发放奖励订单，按等级配置发放功德分/可提现积分/解冻积分
 */
async function grantRefereeRewardAfterSign(userId, courseId) {
  try {
    const { data: orders } = await db
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('related_id', courseId)
      .eq('order_type', 1)
      .eq('pay_status', 1)
      .eq('is_reward_granted', 0);

    if (!orders || orders.length === 0) return;

    const order = orders[0];
    if (!order.referee_id) {
      await markRewardGranted(order.order_no);
      return;
    }

    const { data: course } = await db.from('courses').select('*').eq('id', courseId).single();
    if (!course) return;

    const { data: referee } = await db.from('users').select('*').eq('id', order.referee_id).single();
    if (!referee) { await markRewardGranted(order.order_no); return; }

    const { data: config } = await db
      .from('ambassador_level_configs')
      .select('*')
      .eq('level', referee.ambassador_level)
      .single();

    // 未找到该等级配置，标记已处理后跳过
    if (!config) {
      await markRewardGranted(order.order_no);
      return;
    }

    const { data: buyer } = await db.from('users').select('real_name').eq('id', order.user_id).single();
    const buyerName    = buyer?.real_name || '';
    const baseAmount   = parseFloat(order.final_amount);
    const frozenBal    = parseFloat(referee.cash_points_frozen) || 0;
    const unfreezeAmt  = parseFloat(config.unfreeze_per_referral) || 0;

    // 优先级1：初探班 + 有冻结积分 → 解冻
    if (course.type === 1 && unfreezeAmt > 0 && frozenBal >= unfreezeAmt) {
      const newFrozen    = frozenBal - unfreezeAmt;
      const newAvailable = (parseFloat(referee.cash_points_available) || 0) + unfreezeAmt;
      await db.from('users').update({ cash_points_frozen: newFrozen, cash_points_available: newAvailable }).eq('id', referee.id);
      await db.from('cash_points_records').insert({
        user_id: referee.id, _openid: referee._openid || '', type: 2, amount: unfreezeAmt,
        frozen_after: newFrozen, available_after: newAvailable, order_no: order.order_no,
        referee_user_id: order.user_id, referee_user_name: buyerName,
        remark: `推荐学员购买${course.name}，解冻积分`, created_at: formatDateTime(new Date())
      });
      await markRewardGranted(order.order_no);
      return;
    }

    // 优先级2：按比例发放功德分或可提现积分
    const meritRate = course.type === 1 ? (parseFloat(config.merit_rate_basic) || 0) : (parseFloat(config.merit_rate_advanced) || 0);
    const cashRate  = course.type === 1 ? (parseFloat(config.cash_rate_basic) || 0)  : (parseFloat(config.cash_rate_advanced) || 0);

    if (meritRate > 0) {
      const meritPoints = Math.round(baseAmount * meritRate * 100) / 100;
      if (meritPoints > 0) {
        const { data: r } = await db.from('users').select('merit_points').eq('id', referee.id).single();
        const newBalance = (parseFloat(r?.merit_points) || 0) + meritPoints;
        await db.from('users').update({ merit_points: newBalance }).eq('id', referee.id);
        await db.from('merit_points_records').insert({
          user_id: referee.id, _openid: referee._openid || '', type: 1,
          source: course.type === 1 ? 1 : 2, amount: meritPoints, balance_after: newBalance,
          order_no: order.order_no, referee_user_id: order.user_id, referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(meritRate * 100).toFixed(0)}%功德分`,
          created_at: formatDateTime(new Date())
        });
      }
    } else if (cashRate > 0) {
      const cashPoints = Math.round(baseAmount * cashRate * 100) / 100;
      if (cashPoints > 0) {
        const { data: r } = await db.from('users').select('cash_points_available').eq('id', referee.id).single();
        const newAvailable = (parseFloat(r?.cash_points_available) || 0) + cashPoints;
        await db.from('users').update({ cash_points_available: newAvailable }).eq('id', referee.id);
        await db.from('cash_points_records').insert({
          user_id: referee.id, _openid: referee._openid || '', type: 3, amount: cashPoints,
          available_after: newAvailable, order_no: order.order_no,
          referee_user_id: order.user_id, referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(cashRate * 100).toFixed(0)}%可提现积分`,
          created_at: formatDateTime(new Date())
        });
      }
    }

    await markRewardGranted(order.order_no);

  } catch (err) {
    console.error('[grantRefereeReward] 推荐人奖励发放失败（不影响主流程）:', err);
  }
}

async function markRewardGranted(orderNo) {
  await db.from('orders').update({
    is_reward_granted: 1,
    reward_granted_at: formatDateTime(new Date())
  }).eq('order_no', orderNo);
}

module.exports = { grantRefereeRewardAfterSign, markRewardGranted };
