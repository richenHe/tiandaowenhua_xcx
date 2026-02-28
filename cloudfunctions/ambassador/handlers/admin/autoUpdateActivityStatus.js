/**
 * 定时任务：自动结束过期活动并发放功德分
 *
 * 触发方式：每日 0:00 由 cron trigger 自动执行
 *
 * 逻辑：
 *   1. 查询所有 status=1 的大使活动
 *   2. 批量查询对应排期（class_records），筛选 class_end_date < 今日（结课日期已过）
 *   3. 对每个符合条件的活动，执行功德分发放流程
 *   4. 更新活动 status=0（已结束）、merit_distributed=1
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  try {
    // 北京时间 (UTC+8) 今日日期
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    const now = formatDateTime(new Date());

    console.log(`[autoUpdateActivityStatus] 开始执行，日期: ${today}`);

    // 查询所有进行中（status=1）的大使活动
    const { data: activeActivities, error: fetchError } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('status', 1);
    if (fetchError) throw fetchError;

    if (!activeActivities || activeActivities.length === 0) {
      console.log('[autoUpdateActivityStatus] 无进行中活动');
      return response.success({ processed: 0 }, '无进行中活动');
    }

    // 批量查询对应排期，筛选结课日期已过（class_end_date < today）的排期
    const scheduleIds = activeActivities.map(a => a.schedule_id);
    const { data: endedSchedules, error: scheduleError } = await db
      .from('class_records')
      .select('id, class_date, class_end_date')
      .in('id', scheduleIds)
      .lt('class_end_date', today);
    if (scheduleError) throw scheduleError;

    if (!endedSchedules || endedSchedules.length === 0) {
      console.log('[autoUpdateActivityStatus] 无结课日期已过的活动');
      return response.success({ processed: 0 }, '无到期活动需要处理');
    }

    // 建立已结束排期的 Map（scheduleId → scheduleInfo）
    const endedScheduleMap = {};
    endedSchedules.forEach(s => { endedScheduleMap[s.id] = s; });

    // 筛选出结课日期已过的大使活动
    const expiredActivities = activeActivities.filter(a => endedScheduleMap[a.schedule_id]);

    console.log(`[autoUpdateActivityStatus] 发现 ${expiredActivities.length} 个结课活动需要处理`);

    let processedCount = 0;
    let totalDistributed = 0;

    for (const activity of expiredActivities) {
      const schedule = endedScheduleMap[activity.schedule_id];
      try {
        // 跳过已发放过的活动（防重），仅更新状态
        if (activity.merit_distributed === 1) {
          await db
            .from('ambassador_activities')
            .update({ status: 0, updated_at: now })
            .eq('id', activity.id);
          continue;
        }

        // 查询该活动所有有效报名（status=1）
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
                type: 1,
                source: 7,
                amount: meritPoints,
                balance_after: newBalance,
                activity_name: `${activity.schedule_name} - ${reg.position_name}`,
                remark: `参与活动岗位「${reg.position_name}」获得功德分（自动结算）`,
                created_at: now
              });

              // 写入大使活动记录（供小程序活动记录页展示）
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

              // 将报名状态更新为已发放（status=2）
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

        // 标记活动为已结束、已发放
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

    return response.success({
      date: today,
      processed: processedCount,
      total_distributed: totalDistributed
    }, `自动结算完成，处理 ${processedCount} 个活动，发放 ${totalDistributed} 人次功德分`);

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
