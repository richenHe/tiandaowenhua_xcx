/**
 * 客户端接口：获取推荐统计信息
 * Action: client:getReferralStats
 * @description 返回推荐人数、成为大使时间、累计活动次数
 *
 * 注意：users 表中没有 ambassador_start_date 和 total_activity_count 字段
 * 需要从其他表统计或返回默认值
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getReferralStats] 获取推荐统计:', user.id);

    // 1. 统计推荐人数（只统计已确认的推荐关系）
    // 注意：users 表中没有 referee_confirmed_at 字段，只要有 referee_id 就算确认
    const { count: total_referrals, error: countError } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('referee_id', user.id);

    if (countError) {
      throw countError;
    }

    // 2. 获取用户的大使等级信息
    const { data: userData, error: userError } = await db
      .from('users')
      .select('ambassador_level, created_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    // 3. 统计活动次数（从 ambassador_activity_records 表，与活动记录页保持一致）
    const { count: activity_count, error: activityError } = await db
      .from('ambassador_activity_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 1); // status=1 有效记录，与活动记录页统计口径一致

    if (activityError && activityError.code !== 'PGRST116') {
      throw activityError;
    }

    const result = {
      total_referrals: total_referrals || 0,
      ambassador_start_date: userData?.ambassador_level > 0 ? userData.created_at : null,
      total_activity_count: activity_count || 0
    };

    console.log('[getReferralStats] 查询成功:', result);
    return response.success(result);

  } catch (error) {
    console.error('[getReferralStats] 查询失败:', error);
    return response.error('获取推荐统计失败', error);
  }
};
