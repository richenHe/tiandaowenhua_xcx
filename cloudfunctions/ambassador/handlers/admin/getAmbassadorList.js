/**
 * 管理端接口：获取大使列表
 * Action: getAmbassadorList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level, keyword, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getAmbassadorList] 查询大使列表:`, { level, keyword, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('users')
      .select('*', { count: 'exact' })
      .gt('ambassador_level', 0)
      .order('ambassador_level', { ascending: false })
      .order('created_at', { ascending: false });

    // 等级筛选
    if (level != null && level !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', level);
    }

    // 关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`real_name.ilike.%${keyword}%,phone.ilike.%${keyword}%,referee_code.ilike.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 统计每个大使的推荐数据
    const list = await Promise.all((result.list || []).map(async (ambassador) => {
      // 统计推荐人数
      const { count: refereeCount } = await db
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referee_id', ambassador.id);

      // 统计推荐订单数
      const { count: orderCount } = await db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('referee_id', ambassador.id)
        .eq('pay_status', 1);

      return {
        id: ambassador.id,
        uid: ambassador.uid,
        real_name: ambassador.real_name,
        phone: ambassador.phone,
        avatar_url: ambassador.avatar_url,
        referee_code: ambassador.referee_code,
        ambassador_level: ambassador.ambassador_level,
        merit_points: ambassador.merit_points_available || 0,
        cash_points: ambassador.cash_points_available || 0,
        referee_count: refereeCount || 0,
        order_count: orderCount || 0,
        created_at: ambassador.created_at,
        ambassador_approved_at: ambassador.ambassador_approved_at
      };
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getAmbassadorList] 失败:`, error);
    return response.error('查询大使列表失败', error);
  }
};
