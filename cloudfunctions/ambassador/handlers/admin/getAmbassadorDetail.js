/**
 * 管理端接口：大使详情
 * Action: getAmbassadorDetail
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { user_id } = event;

  try {
    console.log(`[getAmbassadorDetail] 管理员查询大使详情:`, { admin_id: admin.id, user_id });

    // 参数验证
    if (!user_id) {
      return response.paramError('缺少必要参数: user_id');
    }

    // 查询大使基本信息（users 表没有 deleted_at 字段）
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('id', user_id)
      .gt('ambassador_level', 0)
      .single();

    if (error || !user) {
      return response.error('用户不存在或不是大使');
    }

    // 统计推荐人数
    const { count: refereeCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id);

    // 查询推荐人列表（前10个）
    const { data: referees } = await db
      .from('users')
      .select('id, real_name, phone, ambassador_level, created_at')
      .eq('referee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 查询订单统计
    const { count: totalOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .eq('pay_status', 1);

    // 查询功德金统计
    const { count: meritPointsCount } = await db
      .from('merit_points_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 查询现金积分统计
    const { count: cashPointsCount } = await db
      .from('cash_points_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 查询合约信息（最新有效合约）
    const { data: contract } = await db
      .from('contract_signatures')
      .select('id, contract_name, sign_time, contract_end, status')
      .eq('user_id', user.id)
      .eq('status', 1)
      .order('sign_time', { ascending: false })
      .limit(1)
      .single()
      .catch(() => ({ data: null }));

    // 查询大使赠课名额（所有有效名额按类型汇总）
    const { data: quotas } = await db
      .from('ambassador_quotas')
      .select('quota_type, total_quantity, used_quantity, remaining_quantity, expire_date, status')
      .eq('user_id', user.id)
      .eq('status', 1)
      .order('expire_date', { ascending: true })
      .catch(() => ({ data: [] }));

    // 按类型汇总：初探班(type=1) / 密训班(type=2)
    const quotaSummary = { basic: { total: 0, used: 0, remaining: 0 }, advanced: { total: 0, used: 0, remaining: 0 } };
    (quotas || []).forEach(q => {
      const key = q.quota_type === 2 ? 'advanced' : 'basic';
      quotaSummary[key].total += q.total_quantity || 0;
      quotaSummary[key].used += q.used_quantity || 0;
      quotaSummary[key].remaining += q.remaining_quantity || 0;
    });

    console.log('[getAmbassadorDetail] 查询成功');
    // 🔥 转换用户头像等云存储字段 cloud:// fileID 为 CDN HTTPS URL
    if (user.avatar) user.avatar = cloudFileIDToURL(user.avatar);
    if (user.background_image) user.background_image = cloudFileIDToURL(user.background_image);
    if (user.qrcode_url) user.qrcode_url = cloudFileIDToURL(user.qrcode_url);

    // 展平返回结构，直接将所有字段合并到顶层，方便前端直接访问
    return response.success({
      // 用户基础信息（展平）
      ...user,
      // 团队统计数据（映射到前端期望的字段名）
      team_count: refereeCount || 0,
      direct_referrals: refereeCount || 0,
      order_count: totalOrders || 0,
      total_sales: 0,
      total_earnings: (user.cash_points_available || 0) + (user.cash_points_pending || 0),
      // 积分信息（冗余确保前端访问）
      cash_points_available: user.cash_points_available || 0,
      cash_points_frozen: user.cash_points_frozen || 0,
      merit_points: user.merit_points || 0,
      // 合约信息
      contract: contract ? {
        type_name: contract.contract_name || '大使协议',
        signed_at: contract.sign_time,
        expires_at: contract.contract_end,
        status: contract.status
      } : null,
      // 赠课名额汇总
      quota_summary: quotaSummary,
      quota_list: quotas || [],
      // 推荐人列表
      referees: referees || [],
      // 统计对象（保留向后兼容）
      statistics: {
        refereeCount: refereeCount || 0,
        totalOrders: totalOrders || 0,
        meritPointsCount: meritPointsCount || 0,
        cashPointsCount: cashPointsCount || 0
      }
    }, '获取大使详情成功');

  } catch (error) {
    console.error('[getAmbassadorDetail] 执行失败:', error);
    return response.error('获取大使详情失败', error);
  }
};
