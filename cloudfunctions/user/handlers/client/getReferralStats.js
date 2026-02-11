/**
 * 客户端接口：获取推荐统计信息
 * Action: client:getReferralStats
 * @description 返回推荐人数、成为大使时间、累计活动次数
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('../../common');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getReferralStats] 获取推荐统计:', user.id);

    // 1. 统计推荐人数（只统计已确认的推荐关系）
    const referralCountResult = await db.collection('users')
      .where({
        referee_id: user.id,
        referee_confirmed_at: db.command.neq(null)
      })
      .count();

    const total_referrals = referralCountResult.total || 0;

    // 2. 获取成为大使时间和累计活动次数
    const userResult = await db.collection('users')
      .where({
        id: user.id
      })
      .field({
        ambassador_start_date: true,
        total_activity_count: true
      })
      .get();

    const userData = userResult.data[0] || {};

    const result = {
      total_referrals,
      ambassador_start_date: userData.ambassador_start_date || null,
      total_activity_count: userData.total_activity_count || 0
    };

    console.log('[getReferralStats] 查询成功:', result);
    return response.success(result);

  } catch (error) {
    console.error('[getReferralStats] 查询失败:', error);
    return response.error('获取推荐统计失败', error);
  }
};
