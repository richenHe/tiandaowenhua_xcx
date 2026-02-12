/**
 * 客户端接口：获取推荐统计信息
 * Action: client:getReferralStats
 * @description 返回推荐人数、成为大使时间、累计活动次数
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getReferralStats] 获取推荐统计:', user.id);

    // 1. 统计推荐人数（只统计已确认的推荐关系）
    const { count: total_referrals, error: countError } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .not('referee_confirmed_at', 'is', null);

    if (countError) {
      throw countError;
    }

    // 2. 获取成为大使时间和累计活动次数
    const { data: userData, error: userError } = await db
      .from('users')
      .select('ambassador_start_date, total_activity_count')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    const result = {
      total_referrals: total_referrals || 0,
      ambassador_start_date: userData?.ambassador_start_date || null,
      total_activity_count: userData?.total_activity_count || 0
    };

    console.log('[getReferralStats] 查询成功:', result);
    return response.success(result);

  } catch (error) {
    console.error('[getReferralStats] 查询失败:', error);
    return response.error('获取推荐统计失败', error);
  }
};
