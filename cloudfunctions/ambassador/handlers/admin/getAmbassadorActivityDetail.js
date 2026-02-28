/**
 * 管理端接口：获取大使活动详情（岗位 + 剩余名额）
 * Action: getAmbassadorActivityDetail
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { activityId } = event;

  try {
    console.log('[getAmbassadorActivityDetail] 查询活动详情:', { activityId });

    if (!activityId) {
      return response.paramError('缺少必要参数: activityId');
    }

    const { data: rows, error } = await db
      .from('ambassador_activities')
      .select('*')
      .eq('id', activityId);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return response.error('活动不存在');
    }

    const item = rows[0];
    let positions = [];
    try {
      positions = typeof item.positions === 'string' ? JSON.parse(item.positions) : (item.positions || []);
    } catch (e) {}

    // 查询对应排期获取 class_date 和 class_end_date
    let classDate = item.schedule_date;
    let classEndDate = null;
    if (item.schedule_id) {
      const { data: scheduleRows } = await db
        .from('class_records')
        .select('class_date, class_end_date')
        .eq('id', item.schedule_id);
      if (scheduleRows && scheduleRows[0]) {
        classDate = scheduleRows[0].class_date || classDate;
        classEndDate = scheduleRows[0].class_end_date || null;
      }
    }

    const totalQuota = positions.reduce((sum, p) => sum + (p.quota || 0), 0);
    const totalRegistered = positions.reduce((sum, p) => sum + (p.registered_count || 0), 0);

    return response.success({
      id: item.id,
      schedule_id: item.schedule_id,
      schedule_name: item.schedule_name,
      class_date: classDate,
      class_end_date: classEndDate,
      schedule_date: item.schedule_date,
      schedule_location: item.schedule_location,
      positions: positions.map(p => ({
        name: p.name,
        quota: p.quota,
        merit_points: p.merit_points,
        required_level: p.required_level != null ? p.required_level : null,
        registered_count: p.registered_count || 0,
        remaining: (p.quota || 0) - (p.registered_count || 0)
      })),
      total_quota: totalQuota,
      total_registered: totalRegistered,
      status: item.status,
      merit_distributed: item.merit_distributed,
      merit_distributed_at: item.merit_distributed_at,
      created_at: item.created_at
    });

  } catch (error) {
    console.error('[getAmbassadorActivityDetail] 失败:', error);
    return response.error('获取活动详情失败', error);
  }
};
