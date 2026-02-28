/**
 * 管理端接口：发放活动功德分
 * Action: distributeActivityMeritPoints
 *
 * 排期结束后，管理员手动触发，给所有已报名大使发放对应岗位的功德分
 * 发放流程：
 *   1. 遍历该活动所有有效报名记录
 *   2. 为每人增加 users.merit_points
 *   3. 向 merit_points_records 插入明细
 *   4. 向 ambassador_activity_records 插入参与记录（用于小程序活动记录页展示）
 *   5. 更新 ambassador_activities.merit_distributed = 1
 *   6. 将报名状态更新为 status=2（已发放）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { activityId } = event;

  try {
    console.log('[distributeActivityMeritPoints] 发放功德分:', { activityId });

    if (!activityId) {
      return response.paramError('缺少必要参数: activityId');
    }

    // 查询活动
    const { data: actRows, error: actError } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('id', activityId);
    if (actError) throw actError;
    if (!actRows || actRows.length === 0) return response.error('活动不存在');

    const activity = actRows[0];
    if (activity.merit_distributed === 1) {
      return response.error('该活动功德分已发放，请勿重复操作');
    }

    // 查询所有有效报名（status=1）
    const { data: registrations, error: regError } = await db
      .from('ambassador_activity_registrations')
      .select('*')
      .eq('activity_id', activityId)
      .eq('status', 1);
    if (regError) throw regError;

    if (!registrations || registrations.length === 0) {
      return response.error('该活动暂无报名记录，无法发放');
    }

    const now = new Date().toISOString();
    let successCount = 0;

    for (const reg of registrations) {
      try {
        const meritPoints = parseFloat(reg.merit_points) || 0;
        if (meritPoints <= 0) continue;

        // 查询用户当前功德分余额
        const { data: userRows } = await db
          .from('users')
          .select('id, merit_points, real_name, _openid')
          .eq('id', reg.user_id);
        if (!userRows || userRows.length === 0) continue;

        const user = userRows[0];
        const newBalance = parseFloat(user.merit_points || 0) + meritPoints;

        // 更新用户功德分余额
        await db
          .from('users')
          .update({ merit_points: newBalance, updated_at: now })
          .eq('id', reg.user_id);

        // 写入功德分明细记录
        await db.from('merit_points_records').insert({
          _openid: user._openid || '',
          user_id: reg.user_id,
          user_uid: reg.user_uid || '',
          type: 1,            // 获得
          source: 7,          // 其他（活动岗位）
          amount: meritPoints,
          balance_after: newBalance,
          activity_name: `${activity.schedule_name} - ${reg.position_name}`,
          remark: `参与活动岗位「${reg.position_name}」获得功德分`,
          created_at: now
        });

        // 写入大使活动记录（用于小程序活动记录页展示）
        const activityType = getActivityTypeByPosition(reg.position_name);
        await db.from('ambassador_activity_records').insert({
          _openid: user._openid || '',
          user_id: reg.user_id,
          user_uid: reg.user_uid || '',
          activity_type: activityType,
          activity_name: activity.schedule_name,
          activity_desc: `担任「${reg.position_name}」岗位`,
          class_record_id: activity.schedule_id,
          location: activity.schedule_location || '',
          start_time: activity.schedule_date || now,
          merit_points: meritPoints,
          status: 1,
          created_at: now
        });

        // 更新报名状态为已发放
        await db
          .from('ambassador_activity_registrations')
          .update({ status: 2, updated_at: now })
          .eq('id', reg.id);

        successCount++;
      } catch (innerErr) {
        console.error('[distributeActivityMeritPoints] 单条发放失败:', reg.id, innerErr);
      }
    }

    // 标记活动为已发放
    await db
      .from('ambassador_activities')
      .update({
        merit_distributed: 1,
        merit_distributed_at: now,
        merit_distributed_admin_id: admin?.id || null,
        status: 0,   // 已结束
        updated_at: now
      })
      .eq('id', activityId);

    return response.success({
      total: registrations.length,
      success_count: successCount
    }, `功德分发放完成，共发放 ${successCount} 人`);

  } catch (error) {
    console.error('[distributeActivityMeritPoints] 失败:', error);
    return response.error('发放功德分失败', error);
  }
};

/**
 * 根据岗位名称推断活动类型
 */
function getActivityTypeByPosition(positionName) {
  if (!positionName) return 4;
  const name = positionName.trim();
  if (name.includes('辅导员')) return 1;
  if (name.includes('义工') || name.includes('会务')) return 2;
  if (name.includes('沙龙')) return 3;
  return 4;
}
