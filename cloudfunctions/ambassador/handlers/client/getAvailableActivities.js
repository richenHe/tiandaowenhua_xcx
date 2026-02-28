/**
 * 客户端接口：获取可报名的活动列表
 * Action: getAvailableActivities
 *
 * 返回 status=1（报名中/报名截止但未结束）的活动，附带：
 * - class_date（开始日期）：前端据此判断是否显示"报名截止"置灰
 * - class_end_date（结束日期）：活动结束日期
 * - my_active_registration：用户跨活动的全局有效报名（若有），用于"每人限报一个活动"展示逻辑
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

    // 查询所有 status=1 的活动（含报名截止但活动未结束的），按开始日期升序
    // 前端根据 class_date 判断是否置灰（today >= class_date 则显示"报名截止"）
    const queryBuilder = db
      .from('ambassador_activities')
      .select('*', { count: 'exact' })
      .eq('status', 1)
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
      const schedule = scheduleMap[item.schedule_id] || {};

      return {
        id: item.id,
        schedule_id: item.schedule_id,
        schedule_name: item.schedule_name,
        // class_date / schedule_date 用于前端判断报名是否截止（today >= class_date → 置灰"报名截止"）
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

    // 全局已报名状态检查：查询用户在任意活动中是否存在有效报名（status=1）
    const { data: globalRegs } = await db
      .from('ambassador_activity_registrations')
      .select('id, activity_id, position_name')
      .eq('user_id', user.id)
      .eq('status', 1);

    let myActiveRegistration = null;
    if (globalRegs && globalRegs.length > 0) {
      const actIds = globalRegs.map(r => r.activity_id);
      const { data: activeActs } = await db
        .from('ambassador_activities')
        .select('id, schedule_name, schedule_date, schedule_location')
        .in('id', actIds)
        .neq('status', 0);
      if (activeActs && activeActs.length > 0) {
        const reg = globalRegs.find(r => r.activity_id === activeActs[0].id);
        myActiveRegistration = {
          registration_id: reg.id,
          activity_id: activeActs[0].id,
          position_name: reg.position_name,
          activity_name: activeActs[0].schedule_name,
          schedule_date: activeActs[0].schedule_date,
          schedule_location: activeActs[0].schedule_location || ''
        };
      }
    }

    return response.success({ ...result, list, my_active_registration: myActiveRegistration });

  } catch (error) {
    console.error('[getAvailableActivities] 失败:', error);
    return response.error('获取活动列表失败', error);
  }
};
