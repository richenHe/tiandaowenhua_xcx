/**
 * 管理端接口：手动添加活动报名人员
 * Action: adminAddRegistrant
 *
 * 入参：activityId, userId, positionName
 * 管理员不受排期名额限制，若用户无预约则自动创建
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { activityId, userId, positionName } = event;

  try {
    console.log('[adminAddRegistrant] 管理员添加报名:', { activityId, userId, positionName });

    if (!activityId) return response.paramError('缺少必要参数: activityId');
    if (!userId) return response.paramError('缺少必要参数: userId');
    if (!positionName) return response.paramError('缺少必要参数: positionName');

    // 1. 查询活动信息
    const { data: actRows } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('id', activityId);
    if (!actRows || actRows.length === 0) return response.error('活动不存在');

    const activity = actRows[0];
    if (activity.status === 0) return response.error('活动已结束，无法添加人员');

    // 2. 查询用户信息
    const { data: userRows } = await db
      .from('users')
      .select('id, real_name, phone, _openid, uid')
      .eq('id', userId);
    if (!userRows || userRows.length === 0) return response.error('用户不存在');

    const targetUser = userRows[0];

    // 3. 查询排期获取 course_id
    const { data: scheduleRows } = await db
      .from('class_records')
      .select('id, course_id, booked_quota')
      .eq('id', activity.schedule_id);
    if (!scheduleRows || scheduleRows.length === 0) return response.error('排期不存在');

    const schedule = scheduleRows[0];

    // 4. 校验用户是否购买了该课程
    const { data: ucRows } = await db
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', schedule.course_id)
      .eq('status', 1)
      .limit(1);
    if (!ucRows || ucRows.length === 0) {
      return response.error('该用户未购买该课程，无法添加');
    }
    const userCourseId = ucRows[0].id;

    // 5. 校验用户是否已报名该活动
    const { data: existReg } = await db
      .from('ambassador_activity_registrations')
      .select('id, position_name, status')
      .eq('activity_id', activityId)
      .eq('user_id', userId);
    if (existReg && existReg.length > 0 && existReg[0].status !== 0) {
      return response.error(`该用户已报名该活动的「${existReg[0].position_name}」岗位`);
    }

    // 6. 校验岗位名额
    let positions = [];
    try {
      positions = typeof activity.positions === 'string'
        ? JSON.parse(activity.positions) : (activity.positions || []);
    } catch (e) {}

    const targetPos = positions.find(p => p.name === positionName);
    if (!targetPos) return response.error('该岗位不存在');

    const remaining = (targetPos.quota || 0) - (targetPos.registered_count || 0);
    if (remaining <= 0) return response.error('该岗位名额已满');

    const now = formatDateTime(new Date());

    // 7. 检查/创建预约
    let appointmentId = null;
    const { data: apptRows } = await db
      .from('appointments')
      .select('id')
      .eq('user_id', userId)
      .eq('class_record_id', activity.schedule_id)
      .eq('status', 0);

    if (apptRows && apptRows.length > 0) {
      appointmentId = apptRows[0].id;
    } else {
      // 自动创建预约（管理员不受名额限制）
      const { data: newAppt, error: apptError } = await db
        .from('appointments')
        .insert({
          user_id: userId,
          _openid: targetUser._openid || '',
          course_id: schedule.course_id,
          class_record_id: activity.schedule_id,
          user_course_id: userCourseId,
          user_name: targetUser.real_name || '',
          user_phone: targetUser.phone || '',
          user_uid: targetUser.uid || '',
          is_retrain: 0,
          status: 0,
          remark: '管理员添加活动人员时自动创建',
          created_at: now
        })
        .select()
        .single();
      if (apptError) throw apptError;

      appointmentId = newAppt.id;

      // 更新排期已预约人数
      await db
        .from('class_records')
        .update({ booked_quota: (schedule.booked_quota || 0) + 1 })
        .eq('id', activity.schedule_id);

      console.log('[adminAddRegistrant] 自动创建预约:', appointmentId);
    }

    // 8. 创建报名记录
    if (existReg && existReg.length > 0 && existReg[0].status === 0) {
      // 复用已取消的记录
      const { error: updateErr } = await db
        .from('ambassador_activity_registrations')
        .update({
          position_name: positionName,
          merit_points: targetPos.merit_points || 0,
          appointment_id: appointmentId,
          status: 1,
          updated_at: now
        })
        .eq('id', existReg[0].id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await db
        .from('ambassador_activity_registrations')
        .insert({
          _openid: targetUser._openid || '',
          activity_id: activityId,
          user_id: userId,
          user_uid: targetUser.uid || '',
          user_name: targetUser.real_name || '',
          user_phone: targetUser.phone || '',
          appointment_id: appointmentId,
          position_name: positionName,
          merit_points: targetPos.merit_points || 0,
          status: 1,
          created_at: now
        });
      if (insertErr) throw insertErr;
    }

    // 9. 更新岗位 registered_count
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
      user_id: userId,
      position_name: positionName,
      appointment_id: appointmentId
    }, `已将「${targetUser.real_name || userId}」添加到「${positionName}」岗位`);

  } catch (error) {
    console.error('[adminAddRegistrant] 失败:', error);
    return response.error('添加报名人员失败', error);
  }
};
