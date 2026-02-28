/**
 * 管理端接口：创建大使活动（基于排期）
 * Action: createAmbassadorActivity
 *
 * 入参：scheduleId（排期ID）、positions（岗位JSON数组）
 * positions 格式：[{name: "辅导员", quota: 5, merit_points: 100}, ...]
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { scheduleId, positions } = event;

  try {
    console.log('[createAmbassadorActivity] 创建活动:', { scheduleId, positions });

    if (!scheduleId) {
      return response.paramError('缺少必要参数: scheduleId（排期ID）');
    }
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return response.paramError('缺少必要参数: positions（活动岗位列表）');
    }

    // 校验每个岗位参数
    for (const pos of positions) {
      if (!pos.name) return response.paramError('岗位名称不能为空');
      if (!pos.quota || pos.quota < 1) return response.paramError('岗位名额必须大于0');
      if (pos.merit_points == null || pos.merit_points < 0) return response.paramError('岗位功德分不能为负数');
    }

    // 查询排期信息（含结课日期）
    const { data: scheduleRows, error: scheduleError } = await db
      .from('class_records')
      .select('id, course_name, period, class_date, class_end_date, class_location, status')
      .eq('id', scheduleId);

    if (scheduleError) throw scheduleError;
    if (!scheduleRows || scheduleRows.length === 0) {
      return response.error('排期不存在');
    }
    const schedule = scheduleRows[0];

    // 开始日期和结束日期均为必填，缺失则无法创建活动
    if (!schedule.class_date) {
      return response.error('该排期缺少上课日期，无法创建活动');
    }
    if (!schedule.class_end_date) {
      return response.error('该排期缺少结课日期，无法创建活动，请先在排期管理中补充结课日期');
    }

    // 检查该排期是否已创建过活动
    const { data: existCheck } = await db
      .from('ambassador_activities')
      .select('id')
      .eq('schedule_id', scheduleId);
    if (existCheck && existCheck.length > 0) {
      return response.error('该排期已创建过活动，请勿重复创建');
    }

    // 初始化每个岗位的 registered_count，保留门槛等级字段
    const positionsWithCount = positions.map(p => ({
      name: p.name,
      quota: parseInt(p.quota),
      merit_points: parseFloat(p.merit_points),
      required_level: p.required_level != null ? Number(p.required_level) : null,
      registered_count: 0
    }));

    const scheduleName = `${schedule.course_name || ''}${schedule.period ? ' ' + schedule.period : ''}`.trim();

    const { data: inserted, error: insertError } = await db
      .from('ambassador_activities')
      .insert({
        _openid: '',
        schedule_id: scheduleId,
        schedule_name: scheduleName,
        schedule_date: schedule.class_date,
        schedule_location: schedule.class_location || '',
        positions: JSON.stringify(positionsWithCount),
        status: 1,
        merit_distributed: 0,
        created_at: formatDateTime(new Date())
      })
      .select('*');

    if (insertError) throw insertError;

    return response.success({
      id: inserted[0].id,
      schedule_id: scheduleId,
      schedule_name: scheduleName,
      positions: positionsWithCount
    }, '活动创建成功');

  } catch (error) {
    console.error('[createAmbassadorActivity] 失败:', error);
    return response.error('创建活动失败', error);
  }
};
