/**
 * 客户端接口：获取可报名的活动列表
 * Action: getAvailableActivities
 *
 * 返回 status=1（报名中）的活动，附带用户是否已报名信息和岗位等级门槛
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 20 } = event;

  try {
    console.log('[getAvailableActivities] 用户查询可报名活动:', { userId: user.id });

    // 查询当前用户的大使等级
    const { data: userRows } = await db
      .from('users')
      .select('ambassador_level')
      .eq('id', user.id);
    const userLevel = (userRows && userRows[0]) ? (userRows[0].ambassador_level || 0) : 0;

    // 查询等级名称映射（用于前端展示门槛提示）
    const { data: levelRows } = await db
      .from('ambassador_level_configs')
      .select('level, level_name')
      .eq('status', 1);
    const levelNameMap = {};
    (levelRows || []).forEach(l => { levelNameMap[l.level] = l.level_name; });

    // 截止报名日期：上课日期当天起不再受理（即上课前一天为最后报名日）
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 查询报名中（status=1）且尚未到上课日期的活动
    const queryBuilder = db
      .from('ambassador_activities')
      .select('*', { count: 'exact' })
      .eq('status', 1)
      .gt('schedule_date', todayStr)
      .order('schedule_date', { ascending: true });

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    // 查询该用户的报名记录
    const activityIds = (result.list || []).map(a => a.id);
    let myRegistrations = [];
    if (activityIds.length > 0) {
      const { data: regRows } = await db
        .from('ambassador_activity_registrations')
        .select('activity_id, position_name, status')
        .eq('user_id', user.id)
        .in('activity_id', activityIds);
      myRegistrations = regRows || [];
    }

    const myRegMap = {};
    myRegistrations.forEach(r => {
      myRegMap[r.activity_id] = r;
    });

    const list = (result.list || []).map(item => {
      let positions = [];
      try {
        positions = typeof item.positions === 'string' ? JSON.parse(item.positions) : (item.positions || []);
      } catch (e) {}

      const myReg = myRegMap[item.id];

      return {
        id: item.id,
        schedule_id: item.schedule_id,
        schedule_name: item.schedule_name,
        schedule_date: item.schedule_date,
        schedule_location: item.schedule_location,
        positions: positions.map(p => {
          const requiredLevel = p.required_level != null ? Number(p.required_level) : null;
          return {
            name: p.name,
            quota: p.quota,
            merit_points: p.merit_points,
            registered_count: p.registered_count || 0,
            remaining: Math.max(0, (p.quota || 0) - (p.registered_count || 0)),
            // 等级门槛相关字段
            required_level: requiredLevel,
            required_level_name: requiredLevel != null ? (levelNameMap[requiredLevel] || `等级${requiredLevel}`) : null,
            can_apply: requiredLevel == null || userLevel >= requiredLevel
          };
        }),
        status: item.status,
        // 当前用户大使等级
        user_level: userLevel,
        // 当前用户报名状态
        my_registration: myReg ? {
          position_name: myReg.position_name,
          status: myReg.status
        } : null
      };
    });

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getAvailableActivities] 失败:', error);
    return response.error('获取活动列表失败', error);
  }
};
