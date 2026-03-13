/**
 * 客户端接口：获取用户当前有效活动报名列表
 * Action: getMyRegistrations
 *
 * 返回 status=1 且活动未结束（activity.status IN (1,2)）的报名记录
 * 前端用于展示"我的报名"列表并判断能否取消
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getMyRegistrations] 查询用户报名列表:', { userId: user.id });

    // 查询用户所有 status=1 的报名记录
    const { data: regRows, error: regError } = await db
      .from('ambassador_activity_registrations')
      .select('id, activity_id, position_name, merit_points, created_at')
      .eq('user_id', user.id)
      .eq('status', 1)
      .order('created_at', { ascending: false });
    if (regError) throw regError;

    if (!regRows || regRows.length === 0) {
      return response.success({ list: [] });
    }

    // 查询关联的活动信息
    const activityIds = regRows.map(r => r.activity_id);
    const { data: actRows, error: actError } = await db
      .from('ambassador_activities')
      .select('id, schedule_name, schedule_date, schedule_location, status')
      .in('id', activityIds)
      .in('status', [1, 2]);
    if (actError) throw actError;

    const actMap = {};
    (actRows || []).forEach(a => { actMap[a.id] = a; });

    // 只返回活动 status IN (1,2) 的记录，已结束的过滤掉
    const list = regRows
      .filter(r => actMap[r.activity_id])
      .map(r => {
        const act = actMap[r.activity_id];
        return {
          registration_id: r.id,
          activity_id: r.activity_id,
          activity_name: act.schedule_name,
          schedule_date: act.schedule_date,
          schedule_location: act.schedule_location || '',
          position_name: r.position_name,
          merit_points: r.merit_points,
          activity_status: act.status,
          created_at: r.created_at
        };
      });

    return response.success({ list });

  } catch (error) {
    console.error('[getMyRegistrations] 失败:', error);
    return response.error('获取报名列表失败', error);
  }
};
