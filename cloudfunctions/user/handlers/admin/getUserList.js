/**
 * 管理端接口：学员管理 - 列表（支持搜索/筛选）
 * Action: admin:getUserList
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, keyword, ambassadorLevel, startDate, endDate } = event;

  try {
    console.log('[admin:getUserList] 获取学员列表');

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询
    let queryBuilder = db.from('users')
      .select('id, _openid, real_name, phone, city, avatar, referee_code, referee_id, ambassador_level, merit_points, cash_points_available, cash_points_frozen, profile_completed, created_at', { count: 'exact' })
      .order('id', { ascending: false });

    // 关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`real_name.like.%${keyword}%,phone.like.%${keyword}%,referee_code.like.%${keyword}%`);
    }

    // 大使等级筛选
    if (ambassadorLevel != null && ambassadorLevel !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', ambassadorLevel);
    }

    // 注册时间范围
    if (startDate) {
      queryBuilder = queryBuilder.gte('created_at', startDate);
    }
    if (endDate) {
      queryBuilder = queryBuilder.lte('created_at', endDate);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    console.log('[admin:getUserList] 查询成功，共', result.total, '条');

    const rawList = result.list || [];

    // 批量查询推荐人姓名
    const refereeIds = [...new Set(rawList.filter(u => u.referee_id).map(u => u.referee_id))];
    let refereeMap = {};
    if (refereeIds.length > 0) {
      const { data: referees } = await db.from('users')
        .select('id, real_name')
        .in('id', refereeIds);
      if (referees) {
        refereeMap = Object.fromEntries(referees.map(r => [r.id, r.real_name]));
      }
    }

    const list = rawList.map(user => ({
      ...user,
      avatar: cloudFileIDToURL(user.avatar || ''),
      referee_name: refereeMap[user.referee_id] || null,
      cash_points: user.cash_points_available,
      frozen_cash_points: user.cash_points_frozen
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[admin:getUserList] 查询失败:', error);
    return response.error('获取学员列表失败', error);
  }
};
