/**
 * 定时任务：自动更新活动状态（每日 0:00）
 *
 * 状态码：0已结束 / 1报名中 / 2报名截止
 *
 * 转换规则（两步，基于关联的 class_records 时间字段）：
 *   第一步：status=1 → status=2（报名截止）
 *     条件：today > class_date - 2（即 today >= class_date - 1，开课前一天截止报名）
 *   第二步：status=2 → status=0（已结束）+ 自动发放功德分
 *     条件：class_end_date < today（结课日期已过）
 *
 * 触发方式：cloudfunction.json 的 timer trigger，event 无 action 字段
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  try {
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    const now = formatDateTime(new Date());

    console.log(`[autoUpdateActivityStatus] 开始执行，日期: ${today}`);

    // ========== 第一步：报名中(1) → 报名截止(2) ==========
    let closedCount = 0;

    const { data: openActivities, error: openErr } = await db
      .from('ambassador_activities')
      .select('id, schedule_id')
      .eq('status', 1);
    if (openErr) throw openErr;

    if (openActivities && openActivities.length > 0) {
      const scheduleIds = openActivities.map(a => a.schedule_id);
      const { data: schedules, error: schErr } = await db
        .from('class_records')
        .select('id, class_date')
        .in('id', scheduleIds);
      if (schErr) throw schErr;

      const scheduleMap = {};
      (schedules || []).forEach(s => { scheduleMap[s.id] = s; });

      for (const activity of openActivities) {
        const sch = scheduleMap[activity.schedule_id];
        if (!sch || !sch.class_date) continue;

        // today >= class_date - 1 等价于 today > class_date - 2 天
        const classDate = new Date(sch.class_date + 'T00:00:00+08:00');
        const deadlineDate = new Date(classDate.getTime() - 1 * 24 * 3600 * 1000);
        const deadlineStr = deadlineDate.toISOString().slice(0, 10);

        if (today > deadlineStr) {
          await db
            .from('ambassador_activities')
            .update({ status: 2, updated_at: now })
            .eq('id', activity.id);
          closedCount++;
        }
      }
    }

    console.log(`[autoUpdateActivityStatus] 报名中→报名截止: ${closedCount}`);

    // ========== 第二步：报名截止(2) → 已结束(0) + 发放功德分 ==========
    const { data: closedActivities, error: closedErr } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('status', 2);
    if (closedErr) throw closedErr;

    let processedCount = 0;
    let totalDistributed = 0;

    if (closedActivities && closedActivities.length > 0) {
      const scheduleIds = closedActivities.map(a => a.schedule_id);
      const { data: endedSchedules, error: esErr } = await db
        .from('class_records')
        .select('id, class_date, class_end_date')
        .in('id', scheduleIds)
        .lt('class_end_date', today);
      if (esErr) throw esErr;

      const endedMap = {};
      (endedSchedules || []).forEach(s => { endedMap[s.id] = s; });

      const expiredActivities = closedActivities.filter(a => endedMap[a.schedule_id]);

      console.log(`[autoUpdateActivityStatus] 发现 ${expiredActivities.length} 个结课活动需要结算`);

      for (const activity of expiredActivities) {
        const schedule = endedMap[activity.schedule_id];
        try {
          if (activity.merit_distributed === 1) {
            await db
              .from('ambassador_activities')
              .update({ status: 0, updated_at: now })
              .eq('id', activity.id);
            processedCount++;
            continue;
          }

          const { data: registrations, error: regError } = await db
            .from('ambassador_activity_registrations')
            .select('*')
            .eq('activity_id', activity.id)
            .eq('status', 1);
          if (regError) throw regError;

          let successCount = 0;

          if (registrations && registrations.length > 0) {
            for (const reg of registrations) {
              try {
                const meritPoints = parseFloat(reg.merit_points) || 0;
                if (meritPoints <= 0) continue;

                const { data: userRows } = await db
                  .from('users')
                  .select('id, merit_points, real_name, _openid')
                  .eq('id', reg.user_id);
                if (!userRows || userRows.length === 0) continue;

                const user = userRows[0];
                const newBalance = parseFloat(user.merit_points || 0) + meritPoints;

                await db
                  .from('users')
                  .update({ merit_points: newBalance, updated_at: now })
                  .eq('id', reg.user_id);

                await db.from('merit_points_records').insert({
                  _openid: user._openid || '',
                  user_id: reg.user_id,
                  user_uid: reg.user_uid || '',
                  type: 1,
                  source: 7,
                  amount: meritPoints,
                  balance_after: newBalance,
                  activity_name: `${activity.schedule_name} - ${reg.position_name}`,
                  remark: `参与活动岗位「${reg.position_name}」获得功德分（自动结算）`,
                  created_at: now
                });

                await db.from('ambassador_activity_records').insert({
                  _openid: user._openid || '',
                  user_id: reg.user_id,
                  user_uid: reg.user_uid || '',
                  activity_type: getActivityTypeByPosition(reg.position_name),
                  activity_name: activity.schedule_name,
                  activity_desc: `担任「${reg.position_name}」岗位`,
                  class_record_id: activity.schedule_id,
                  location: activity.schedule_location || '',
                  start_time: schedule.class_date || now,
                  merit_points: meritPoints,
                  status: 1,
                  created_at: now
                });

                await db
                  .from('ambassador_activity_registrations')
                  .update({ status: 2, updated_at: now })
                  .eq('id', reg.id);

                successCount++;
                totalDistributed++;
              } catch (innerErr) {
                console.error('[autoUpdateActivityStatus] 单条发放失败:', reg.id, innerErr);
              }
            }
          }

          await db
            .from('ambassador_activities')
            .update({
              status: 0,
              merit_distributed: 1,
              merit_distributed_at: now,
              updated_at: now
            })
            .eq('id', activity.id);

          processedCount++;
          console.log(`[autoUpdateActivityStatus] 活动 ${activity.id}「${activity.schedule_name}」处理完成，发放 ${successCount} 人`);
        } catch (actErr) {
          console.error('[autoUpdateActivityStatus] 处理活动失败:', activity.id, actErr);
        }
      }
    }

    return response.success({
      date: today,
      closedRegistration: closedCount,
      ended: processedCount,
      total_distributed: totalDistributed
    }, `报名截止 ${closedCount} 个，结算 ${processedCount} 个，发放 ${totalDistributed} 人次功德分`);

  } catch (error) {
    console.error('[autoUpdateActivityStatus] 执行失败:', error);
    return response.error('自动更新活动状态失败', error);
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
