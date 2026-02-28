/**
 * 管理端接口：获取大使活动列表（新版，基于 ambassador_activities 表）
 * Action: getAmbassadorActivityList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { keyword, status, page = 1, pageSize = 20 } = event;

  try {
    console.log('[getAmbassadorActivityList] 查询活动列表:', { keyword, status, page });

    let queryBuilder = db
      .from('ambassador_activities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }
    if (keyword) {
      queryBuilder = queryBuilder.like('schedule_name', `%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    const list = (result.list || []).map(item => {
      let positions = [];
      try {
        positions = typeof item.positions === 'string' ? JSON.parse(item.positions) : (item.positions || []);
      } catch (e) {}

      // 计算总名额和已报名
      const totalQuota = positions.reduce((sum, p) => sum + (p.quota || 0), 0);
      const totalRegistered = positions.reduce((sum, p) => sum + (p.registered_count || 0), 0);

      return {
        id: item.id,
        schedule_id: item.schedule_id,
        schedule_name: item.schedule_name,
        schedule_date: item.schedule_date,
        schedule_location: item.schedule_location,
        positions,
        total_quota: totalQuota,
        total_registered: totalRegistered,
        status: item.status,
        merit_distributed: item.merit_distributed,
        merit_distributed_at: item.merit_distributed_at,
        created_at: item.created_at
      };
    });

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getAmbassadorActivityList] 失败:', error);
    return response.error('查询活动列表失败', error);
  }
};
