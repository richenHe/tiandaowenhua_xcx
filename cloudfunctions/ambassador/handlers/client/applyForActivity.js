/**
 * 客户端接口：申请报名活动岗位
 * Action: applyForActivity
 *
 * 入参（camelCase）：activityId、positionName
 * 前置条件：用户必须已预约了该活动对应的课程排期（appointments.status=0）
 */
const { db, response, formatDateTime, formatBeijingDate } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { activityId, positionName } = event;

  try {
    console.log('[applyForActivity] 申请报名:', { userId: user.id, activityId, positionName });

    if (!activityId) return response.paramError('缺少必要参数: activityId');
    if (!positionName) return response.paramError('缺少必要参数: positionName（岗位名称）');

    // 资料未完善不允许报名
    if (!user.profile_completed) {
      return response.forbidden('请先完善个人资料后再报名活动');
    }

    // 黑名单校验：活动拉黑（blacklist_type=2）
    const { data: activityBlacklist } = await db
      .from('user_blacklist')
      .select('blacklist_months, blacklist_end_time')
      .eq('user_id', user.id)
      .eq('blacklist_type', 2)
      .eq('status', 1)
      .limit(1);
    if (activityBlacklist && activityBlacklist.length > 0) {
      const bl = activityBlacklist[0];
      if (new Date(bl.blacklist_end_time) > new Date()) {
        return response.error(`因为你多次缺席活动参与，${bl.blacklist_months}月内无法报名活动，请和客服联系`);
      }
    }

    // 查询活动
    const { data: actRows, error: actError } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('id', activityId);
    if (actError) throw actError;
    if (!actRows || actRows.length === 0) return response.error('活动不存在');

    const activity = actRows[0];
    if (activity.status !== 1) return response.error('该活动当前不在报名中');

    // 服务端兜底校验：开课前一天（class_date - 1）起截止报名
    if (activity.schedule_date) {
      const todayStr = formatBeijingDate(new Date());
      const classDate = new Date(activity.schedule_date + 'T00:00:00+08:00');
      const deadlineStr = formatBeijingDate(new Date(classDate.getTime() - 24 * 3600 * 1000));
      if (todayStr >= deadlineStr) {
        return response.error('活动报名已截止（开课前一天为最后报名日）');
      }
    }

    // 预约校验：用户必须已预约该活动的排期（status=0 有效预约）
    const { data: appointmentRows } = await db
      .from('appointments')
      .select('id')
      .eq('user_id', user.id)
      .eq('class_record_id', activity.schedule_id)
      .eq('status', 0);
    if (!appointmentRows || appointmentRows.length === 0) {
      return response.error('请先预约该课程排期后再报名活动');
    }
    const appointmentId = appointmentRows[0].id;

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
        const { data: levelRows } = await db
          .from('ambassador_level_configs')
          .select('level_name')
          .eq('level', requiredLevel);
        const levelName = (levelRows && levelRows[0]) ? levelRows[0].level_name : `等级${requiredLevel}`;
        return response.error(`报名该岗位需要达到「${levelName}」大使等级`);
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

    // 查询是否存在已取消的报名记录（status=0），唯一索引要求 UPDATE 而非 INSERT
    const { data: cancelledRegs } = await db
      .from('ambassador_activity_registrations')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .eq('status', 0);

    if (cancelledRegs && cancelledRegs.length > 0) {
      const { error: updateRegError } = await db
        .from('ambassador_activity_registrations')
        .update({
          position_name: positionName,
          merit_points: targetPos.merit_points || 0,
          appointment_id: appointmentId,
          status: 1,
          updated_at: now
        })
        .eq('id', cancelledRegs[0].id);
      if (updateRegError) throw updateRegError;
    } else {
      const { error: insertError } = await db.from('ambassador_activity_registrations').insert({
        _openid: user._openid || '',
        activity_id: activityId,
        user_id: user.id,
        user_uid: user.uid || '',
        user_name: user.real_name || '',
        user_phone: user.phone || '',
        appointment_id: appointmentId,
        position_name: positionName,
        merit_points: targetPos.merit_points || 0,
        status: 1,
        created_at: now
      });
      if (insertError) throw insertError;
    }

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
