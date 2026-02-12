/**
 * 管理端接口：大使详情
 * Action: getAmbassadorDetail
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

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

    console.log('[getAmbassadorDetail] 查询成功');
    return response.success({
      user,
      statistics: {
        refereeCount: refereeCount || 0,
        totalOrders: totalOrders || 0,
        meritPointsCount: meritPointsCount || 0,
        cashPointsCount: cashPointsCount || 0
      },
      referees: referees || []
    }, '获取大使详情成功');

  } catch (error) {
    console.error('[getAmbassadorDetail] 执行失败:', error);
    return response.error('获取大使详情失败', error);
  }
};
