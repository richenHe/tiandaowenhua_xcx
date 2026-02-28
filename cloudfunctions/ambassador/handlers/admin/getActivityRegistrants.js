/**
 * 管理端接口：获取活动报名人员列表（分页）
 * Action: getActivityRegistrants
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { activityId, positionName, page = 1, pageSize = 20 } = event;

  try {
    console.log('[getActivityRegistrants] 查询报名人员:', { activityId, positionName, page });

    if (!activityId) {
      return response.paramError('缺少必要参数: activityId');
    }

    let queryBuilder = db
      .from('ambassador_activity_registrations')
      .select('*', { count: 'exact' })
      .eq('activity_id', activityId)
      .neq('status', 0)  // 排除已取消
      .order('created_at', { ascending: true });

    if (positionName) {
      queryBuilder = queryBuilder.eq('position_name', positionName);
    }

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    const list = (result.list || []).map(reg => ({
      id: reg.id,
      user_id: reg.user_id,
      user_name: reg.user_name || '未知',
      user_phone: reg.user_phone || '',
      position_name: reg.position_name,
      merit_points: reg.merit_points,
      status: reg.status,
      status_text: reg.status === 2 ? '已发放功德分' : '已报名',
      created_at: reg.created_at
    }));

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getActivityRegistrants] 失败:', error);
    return response.error('获取报名人员失败', error);
  }
};
