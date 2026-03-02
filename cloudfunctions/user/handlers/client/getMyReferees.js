/**
 * 客户端接口：获取我推荐的用户列表
 * Action: client:getMyReferees
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize } = event;

  try {
    console.log('[getMyReferees] 获取推荐用户:', user.id);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('users')
      .select('id, real_name, phone, avatar, ambassador_level, created_at', { count: 'exact' })
      .eq('referee_id', user.id)
      .order('id', { ascending: true });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 查询推荐用户中已购课的 user_id 集合
    const refereeList = result.list || [];
    let purchasedSet = new Set();
    if (refereeList.length > 0) {
      const userIds = refereeList.map(u => u.id);
      const { data: paidOrders } = await db
        .from('orders')
        .select('user_id')
        .in('user_id', userIds)
        .eq('pay_status', 1);
      if (paidOrders) {
        paidOrders.forEach(o => purchasedSet.add(o.user_id));
      }
    }

    const list = refereeList.map(u => ({
      id: u.id,
      real_name: u.real_name,
      phone: u.phone,
      avatar: u.avatar,
      ambassador_level: u.ambassador_level,
      created_at: u.created_at,
      has_purchased: purchasedSet.has(u.id)
    }));

    console.log('[getMyReferees] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getMyReferees] 查询失败:', error);
    return response.error('获取推荐用户列表失败', error);
  }
};
