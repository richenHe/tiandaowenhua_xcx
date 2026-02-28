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

    // 从报名表中实时统计每个岗位已报名人数（以 ambassador_activities.positions 的 registered_count 为准）
    const totalQuota = positions.reduce((sum, p) => sum + (p.quota || 0), 0);
    const totalRegistered = positions.reduce((sum, p) => sum + (p.registered_count || 0), 0);

    return response.success({
      id: item.id,
      schedule_id: item.schedule_id,
      schedule_name: item.schedule_name,
      schedule_date: item.schedule_date,
      schedule_location: item.schedule_location,
      positions: positions.map(p => ({
        name: p.name,
        quota: p.quota,
        merit_points: p.merit_points,
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
