/**
 * 客户端接口：获取我推荐的用户列表
 * Action: client:getMyReferees
 *
 * 业务规则：只展示至少有一条 contract_signed=1 的 user_courses 记录的被推荐用户
 * （扫码绑定 referee_id 只是记录来源，contract_signed=1 才算正式推荐关系）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize } = event;

  try {
    console.log('[getMyReferees] 获取推荐用户:', user.id);

    const finalPageSize = page_size || pageSize || 20;

    // 1. 查询所有 referee_id = 我 的用户 id
    const { data: allReferees } = await db
      .from('users')
      .select('id')
      .eq('referee_id', user.id);

    if (!allReferees || allReferees.length === 0) {
      console.log('[getMyReferees] 无推荐用户');
      return response.success({ list: [], total: 0, page: 1, pageSize: finalPageSize, totalPages: 0, hasMore: false });
    }

    const allRefereeIds = allReferees.map(u => u.id);

    // 2. 从 user_courses 中筛选出 contract_signed=1 的用户（正式推荐关系）
    const { data: confirmedRecords } = await db
      .from('user_courses')
      .select('user_id')
      .in('user_id', allRefereeIds)
      .eq('contract_signed', 1);

    const confirmedUserIds = [...new Set((confirmedRecords || []).map(r => r.user_id))];

    if (confirmedUserIds.length === 0) {
      console.log('[getMyReferees] 无已确认（contract_signed=1）的推荐用户');
      return response.success({ list: [], total: 0, page: 1, pageSize: finalPageSize, totalPages: 0, hasMore: false });
    }

    // 3. 分页查询已确认用户的详细信息
    const total = confirmedUserIds.length;
    const totalPages = Math.ceil(total / finalPageSize);
    const offset = (page - 1) * finalPageSize;

    const { data: userList } = await db
      .from('users')
      .select('id, real_name, phone, avatar, ambassador_level, created_at')
      .in('id', confirmedUserIds)
      .order('id', { ascending: false })
      .range(offset, offset + finalPageSize - 1);

    const refereeList = userList || [];

    // 4. 批量查询已购课情况和活动次数
    let purchasedSet = new Set();
    let activityCountMap = new Map();

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

      const { data: activityRecords } = await db
        .from('ambassador_activity_records')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 1);
      if (activityRecords) {
        activityRecords.forEach(r => {
          activityCountMap.set(r.user_id, (activityCountMap.get(r.user_id) || 0) + 1);
        });
      }
    }

    const list = refereeList.map(u => ({
      id: u.id,
      real_name: u.real_name,
      phone: u.phone,
      avatar: u.avatar,
      ambassador_level: u.ambassador_level,
      activity_count: activityCountMap.get(u.id) || 0,
      created_at: u.created_at,
      has_purchased: purchasedSet.has(u.id)
    }));

    console.log('[getMyReferees] 查询成功，已确认推荐用户:', total, '条');
    return response.success({
      list,
      total,
      page,
      pageSize: finalPageSize,
      totalPages,
      hasMore: page < totalPages
    });

  } catch (error) {
    console.error('[getMyReferees] 查询失败:', error);
    return response.error('获取推荐用户列表失败', error);
  }
};
