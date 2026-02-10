/**
 * 客户端接口：获取我的名额
 * Action: getMyQuotas
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;

  try {
    console.log(`[getMyQuotas] 查询名额:`, user.id);

    // 验证是否为大使
    if (user.ambassador_level === 0) {
      return response.error('仅大使可以查看名额');
    }

    const { db } = require('../../common/db');

    // 查询名额记录
    const { data: quotas, error } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 统计总名额
    let totalQuotas = 0;
    let usedQuotas = 0;

    (quotas || []).forEach(quota => {
      totalQuotas += quota.total_count;
      usedQuotas += quota.used_count;
    });

    // 查询名额使用记录
    const { data: usageRecords, error: usageError } = await db
      .from('quota_usage_records')
      .select(`
        *,
        receiver:users!receiver_id(real_name, phone)
      `)
      .eq('giver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (usageError) throw usageError;

    return response.success({
      summary: {
        total: totalQuotas,
        used: usedQuotas,
        available: totalQuotas - usedQuotas
      },
      quotas: quotas || [],
      usage_records: usageRecords || []
    });

  } catch (error) {
    console.error(`[getMyQuotas] 失败:`, error);
    return response.error('查询名额失败', error);
  }
};
