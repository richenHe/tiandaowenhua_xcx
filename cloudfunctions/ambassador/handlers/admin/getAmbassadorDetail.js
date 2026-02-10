/**
 * 管理端接口：获取大使详情
 * Action: getAmbassadorDetail
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { user_id } = event;

  try {
    console.log(`[getAmbassadorDetail] 查询大使详情:`, user_id);

    // 参数验证
    if (!user_id) {
      return response.paramError('缺少必要参数: user_id');
    }

    // 查询用户信息
    const user = await findOne('users', { id: user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    if (user.ambassador_level === 0) {
      return response.error('该用户不是大使');
    }

    const { db } = require('../../common/db');

    // 统计推荐人数
    const { count: refereeCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .is('deleted_at', null);

    // 统计推荐订单
    const { data: orders, error: orderError } = await db
      .from('orders')
      .select('*')
      .eq('referee_id', user.id)
      .eq('pay_status', 1);

    if (orderError) throw orderError;

    const orderCount = orders?.length || 0;
    const totalAmount = (orders || []).reduce((sum, order) => sum + parseFloat(order.final_amount || 0), 0);

    // 查询名额信息
    const { data: quotas, error: quotaError } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', user.id);

    if (quotaError) throw quotaError;

    let totalQuotas = 0;
    let usedQuotas = 0;
    (quotas || []).forEach(quota => {
      totalQuotas += quota.total_count;
      usedQuotas += quota.used_count;
    });

    // 查询升级记录
    const { data: upgradeLogs, error: upgradeError } = await db
      .from('ambassador_upgrade_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (upgradeError) throw upgradeError;

    // 查询协议签署记录
    const { data: contracts, error: contractError } = await db
      .from('contract_signatures')
      .select(`
        *,
        template:contract_templates(title, level, version)
      `)
      .eq('user_id', user.id)
      .order('signed_at', { ascending: false });

    if (contractError) throw contractError;

    return response.success({
      user: {
        id: user.id,
        uid: user.uid,
        real_name: user.real_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        referee_code: user.referee_code,
        ambassador_level: user.ambassador_level,
        merit_points_available: user.merit_points_available || 0,
        merit_points_frozen: user.merit_points_frozen || 0,
        cash_points_available: user.cash_points_available || 0,
        cash_points_frozen: user.cash_points_frozen || 0,
        cash_points_pending: user.cash_points_pending || 0,
        created_at: user.created_at,
        ambassador_approved_at: user.ambassador_approved_at
      },
      stats: {
        referee_count: refereeCount || 0,
        order_count: orderCount,
        total_amount: totalAmount,
        total_quotas: totalQuotas,
        used_quotas: usedQuotas,
        available_quotas: totalQuotas - usedQuotas
      },
      upgrade_logs: upgradeLogs || [],
      contracts: (contracts || []).map(c => ({
        id: c.id,
        title: c.template?.title,
        level: c.template_level,
        version: c.template_version,
        signed_at: c.signed_at,
        status: c.status
      }))
    });

  } catch (error) {
    console.error(`[getAmbassadorDetail] 失败:`, error);
    return response.error('查询大使详情失败', error);
  }
};
