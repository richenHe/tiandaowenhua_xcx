/**
 * 客户端接口：获取可报名的活动列表
 * Action: getAvailableActivities
 *
 * 只返回用户已预约了对应排期（appointments.status=0）且活动 status=1（报名中）的活动
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

    // 查询用户有效预约（status=0），获取已预约的排期 ID 列表
    const { data: appointments } = await db
      .from('appointments')
      .select('class_record_id')
      .eq('user_id', user.id)
      .eq('status', 0);

    const bookedScheduleIds = (appointments || [])
      .map(a => a.class_record_id)
      .filter(Boolean);

    // 无有效预约 → 直接返回空列表
    if (bookedScheduleIds.length === 0) {
      return response.success({ list: [], total: 0, page, pageSize });
    }

    // 只查询用户已预约排期 且 status=1（报名中）的活动
    const queryBuilder = db
      .from('ambassador_activities')
      .select('*', { count: 'exact' })
      .eq('status', 1)
      .in('schedule_id', bookedScheduleIds)
      .order('schedule_date', { ascending: true });

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    // 批量查询对应排期，获取 class_date 和 class_end_date
    const scheduleIds = (result.list || []).map(a => a.schedule_id).filter(Boolean);
    const scheduleMap = {};
    if (scheduleIds.length > 0) {
      const { data: scheduleRows } = await db
        .from('class_records')
        .select('id, class_date, class_end_date')
        .in('id', scheduleIds);
      (scheduleRows || []).forEach(s => { scheduleMap[s.id] = s; });
    }

    // 查询该用户在这些活动中的有效报名记录（排除已取消 status=0，已取消视为未报名可重新申请）
    const activityIds = (result.list || []).map(a => a.id);
    let myRegistrations = [];
    if (activityIds.length > 0) {
      const { data: regRows } = await db
        .from('ambassador_activity_registrations')
        .select('activity_id, position_name, status')
        .eq('user_id', user.id)
        .in('activity_id', activityIds)
        .not('status', 'eq', 0);
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
      const schedule = scheduleMap[item.schedule_id] || {};

      return {
        id: item.id,
        schedule_id: item.schedule_id,
        schedule_name: item.schedule_name,
        class_date: schedule.class_date || item.schedule_date,
        class_end_date: schedule.class_end_date || null,
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
            required_level: requiredLevel,
            required_level_name: requiredLevel != null ? (levelNameMap[requiredLevel] || `等级${requiredLevel}`) : null,
            can_apply: requiredLevel == null || userLevel >= requiredLevel
          };
        }),
        status: item.status,
        user_level: userLevel,
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
