/**
 * 管理端接口：获取活动列表
 * Action: getActivityList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { status, activity_type, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getActivityList] 查询活动列表:`, { status, activity_type, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('ambassador_activity_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 活动类型筛选
    if (activity_type) {
      queryBuilder = queryBuilder.eq('activity_type', activity_type);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据
    const list = (result.list || []).map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      target_level: activity.target_level,
      reward_config: activity.reward_config ? JSON.parse(activity.reward_config) : null,
      status: activity.status,
      created_at: activity.created_at
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getActivityList] 失败:`, error);
    return response.error('查询活动列表失败', error);
  }
};
