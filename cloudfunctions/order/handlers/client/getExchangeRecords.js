/**
 * 客户端接口：兑换记录列表
 * Action: getExchangeRecords
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { status, page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[getExchangeRecords] 查询兑换记录:`, { user_id: user.id, status, page });

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询（包含商品信息的 JOIN）
    let queryBuilder = db
      .from('mall_exchange_records')
      .select(`
        exchange_no,
        goods_name,
        goods_image,
        quantity,
        merit_points_used,
        cash_points_used,
        total_cost,
        status,
        created_at,
        goods:mall_goods!fk_mall_exchange_records_goods(goods_name, goods_image)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    // 添加状态筛选
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 格式化记录列表，cloud:// fileID 直接转换为 CDN HTTPS URL
    const list = (result.list || []).map(record => {
      return {
        exchange_no: record.exchange_no,
        goods_name: record.goods_name,
        goods_image: cloudFileIDToURL(record.goods_image || ''),
        quantity: record.quantity,
        merit_points_used: record.merit_points_used,
        cash_points_used: record.cash_points_used,
        total_cost: record.total_cost,
        status: record.status,
        status_name: getExchangeStatusName(record.status),
        created_at: record.created_at
      };
    });

    console.log(`[getExchangeRecords] 查询成功，共 ${result.total} 条`);

    return response.success({
      ...result,
      list
    }, '查询成功');

  } catch (error) {
    console.error(`[getExchangeRecords] 失败:`, error);
    return response.error('查询兑换记录失败', error);
  }
};

/**
 * 获取兑换状态名称
 */
function getExchangeStatusName(status) {
  const statusMap = {
    1: '已兑换',
    2: '已领取',
    3: '已取消'
  };
  return statusMap[status] || '未知';
}
