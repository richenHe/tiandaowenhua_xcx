/**
 * 客户端接口：申请报名活动岗位
 * Action: applyForActivity
 *
 * 入参（camelCase）：activityId、positionName
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { activityId, positionName } = event;

  try {
    console.log('[applyForActivity] 申请报名:', { userId: user.id, activityId, positionName });

    if (!activityId) return response.paramError('缺少必要参数: activityId');
    if (!positionName) return response.paramError('缺少必要参数: positionName（岗位名称）');

    // 查询活动
    const { data: actRows, error: actError } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('id', activityId);
    if (actError) throw actError;
    if (!actRows || actRows.length === 0) return response.error('活动不存在');

    const activity = actRows[0];
    if (activity.status !== 1) return response.error('该活动当前不在报名中');

    // 校验报名截止：上课日期当天起不再受理（即上课前一天为最后报名日）
    // schedule_date 与 class_records.class_date 一致，直接使用
    if (activity.schedule_date) {
      // 北京时间 (UTC+8) 今日日期，避免时区偏差
      const todayStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
      if (todayStr >= activity.schedule_date) {
        return response.error('活动报名已截止（上课前一天为最后报名日）');
      }
    }

    // 解析岗位列表
    let positions = [];
    try {
      positions = typeof activity.positions === 'string'
        ? JSON.parse(activity.positions)
        : (activity.positions || []);
    } catch (e) {}

    const targetPos = positions.find(p => p.name === positionName);
    if (!targetPos) return response.error('该岗位不存在');

    const remaining = (targetPos.quota || 0) - (targetPos.registered_count || 0);
    if (remaining <= 0) return response.error('该岗位名额已满');

    // 检查岗位等级门槛
    if (targetPos.required_level != null) {
      const requiredLevel = Number(targetPos.required_level);
      const { data: userRows } = await db
        .from('users')
        .select('ambassador_level')
        .eq('id', user.id);
      const userLevel = (userRows && userRows[0]) ? (userRows[0].ambassador_level || 0) : 0;

      if (userLevel < requiredLevel) {
        // 获取等级名称给出友好提示
        const { data: levelRows } = await db
          .from('ambassador_level_configs')
          .select('level_name')
          .eq('level', requiredLevel);
        const levelName = (levelRows && levelRows[0]) ? levelRows[0].level_name : `等级${requiredLevel}`;
        return response.error(`报名该岗位需要达到「${levelName}」大使等级`);
      }
    }

    // 全局排他校验：是否已在其他未结束活动中有有效报名（status=1）
    const { data: globalRegs } = await db
      .from('ambassador_activity_registrations')
      .select('activity_id, position_name')
      .eq('user_id', user.id)
      .eq('status', 1);
    if (globalRegs && globalRegs.length > 0) {
      const { data: activeActs } = await db
        .from('ambassador_activities')
        .select('id, schedule_name')
        .in('id', globalRegs.map(r => r.activity_id))
        .neq('status', 0);
      if (activeActs && activeActs.length > 0) {
        const reg = globalRegs.find(r => r.activity_id === activeActs[0].id);
        return response.error(`您已报名「${activeActs[0].schedule_name}」的「${reg.position_name}」岗位，排期结束后方可报名新活动`);
      }
    }

    // 检查用户是否已报名该活动（同活动内不可重复报名）
    const { data: existReg } = await db
      .from('ambassador_activity_registrations')
      .select('id, position_name, status')
      .eq('activity_id', activityId)
      .eq('user_id', user.id);

    if (existReg && existReg.length > 0 && existReg[0].status !== 0) {
      return response.error(`您已报名该活动的「${existReg[0].position_name}」岗位`);
    }

    const now = formatDateTime(new Date());

    // 写入报名记录
    await db.from('ambassador_activity_registrations').insert({
      _openid: user._openid || '',
      activity_id: activityId,
      user_id: user.id,
      user_uid: user.uid || '',
      user_name: user.real_name || '',
      user_phone: user.phone || '',
      position_name: positionName,
      merit_points: targetPos.merit_points || 0,
      status: 1,
      created_at: now
    });

    // 更新岗位的 registered_count
    targetPos.registered_count = (targetPos.registered_count || 0) + 1;
    await db
      .from('ambassador_activities')
      .update({
        positions: JSON.stringify(positions),
        updated_at: now
      })
      .eq('id', activityId);

    return response.success({
      activity_id: activityId,
      position_name: positionName,
      merit_points: targetPos.merit_points
    }, '报名成功');

  } catch (error) {
    console.error('[applyForActivity] 失败:', error);
    return response.error('报名失败', error);
  }
};
