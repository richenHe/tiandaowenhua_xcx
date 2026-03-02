/**
 * 管理端接口：兑换记录列表
 * Action: getExchangeList
 *
 * 查询所有用户兑换记录，通过外键 JOIN users 获取用户信息，
 * 供管理员现场核对姓名/手机号后确认领取（待领取 → 已领取）
 */
const { db, response, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { status, keyword, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getExchangeList] 管理员查询兑换记录:`, { admin_id: admin.id, status, keyword });

    // JOIN users（通过外键 fk_mall_exchange_records_user）获取用户姓名和手机号
    let queryBuilder = db
      .from('mall_exchange_records')
      .select(
        `*, user:users!fk_mall_exchange_records_user(id, real_name, phone)`,
        { count: 'exact' }
      )
      .order('id', { ascending: true });

    // 状态过滤（同时检查 null/undefined/空字符串，避免 parseInt(null) → NaN）
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 关键词过滤（兑换单号模糊搜索）
    if (keyword && keyword.trim()) {
      queryBuilder = queryBuilder.like('exchange_no', `%${keyword.trim()}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, page_size);

    // 将 JOIN 的 user 对象展开为平铺字段，并补充 status_name
    const list = (result.list || []).map(r => {
      const { user, ...rest } = r;
      return {
        ...rest,
        user_name:   user?.real_name || '',
        user_phone:  user?.phone     || '',
        status_name: r.status === 1 ? '已兑换(待领取)'
                   : r.status === 2 ? '已领取'
                   : r.status === 3 ? '已取消'
                   : '未知'
      };
    });

    return response.success({
      total:     result.total,
      page:      parseInt(page),
      page_size: parseInt(page_size),
      list
    }, '查询成功');

  } catch (error) {
    console.error('[getExchangeList] 失败:', error);
    return response.error('查询兑换记录失败', error);
  }
};
