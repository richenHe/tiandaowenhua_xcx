/**
 * 客户端接口：功德分明细记录
 * Action: client:getMeritPointsHistory
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 20, pageSize, sourceFilter } = event;

  try {
    console.log('[getMeritPointsHistory] 获取功德分明细:', {
      userId: user.id,
      sourceFilter
    });

    const finalPageSize = page_size || pageSize || 20;

    let queryBuilder = db
      .from('merit_points_records')
      .select('id, type, amount, balance_after, source, order_no, exchange_no, referee_user_id, referee_user_name, activity_name, remark, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    // 按来源筛选（数组形式，如 [1,2] 表示推荐初探班+密训班）
    if (Array.isArray(sourceFilter) && sourceFilter.length > 0) {
      queryBuilder = queryBuilder.in('source', sourceFilter);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const list = (result.list || []).map(record => ({
      id: record.id,
      change_amount: record.type === 1 ? record.amount : -record.amount,
      balance_after: record.balance_after,
      change_type: record.type,
      source: record.source,
      related_id: record.order_no || record.exchange_no || null,
      referee_user_id: record.referee_user_id,
      referee_user_name: record.referee_user_name || null,
      activity_name: record.activity_name || null,
      remark: record.remark,
      created_at: record.created_at
    }));

    console.log('[getMeritPointsHistory] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getMeritPointsHistory] 查询失败:', error);
    return response.error('获取功德分明细失败', error);
  }
};
