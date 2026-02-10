/**
 * 客户端接口：兑换记录列表
 * Action: getExchangeRecords
 */
const { from } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { status, page = 1, page_size = 10 } = event;

  try {
    console.log(`[getExchangeRecords] 查询兑换记录:`, { user_id: user.id, status, page });

    // 1. 构建查询
    let queryBuilder = from('mall_exchange_records')
      .where('user_id', user.id);

    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.where('status', parseInt(status));
    }

    // 2. 查询总数
    const { total } = await queryBuilder.clone().count('* as total').then(res => res[0] || { total: 0 });

    // 3. 获取分页参数并查询列表
    const { limit, offset } = getPagination(page, page_size);
    const records = await queryBuilder
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // 4. 格式化记录列表
    const list = records.map(record => ({
      exchange_no: record.exchange_no,
      goods_name: record.goods_name,
      quantity: record.quantity,
      merit_points_used: record.merit_points_used,
      cash_points_used: record.cash_points_used,
      total_cost: record.total_cost,
      status: record.status,
      status_name: getExchangeStatusName(record.status),
      created_at: record.created_at
    }));

    console.log(`[getExchangeRecords] 查询成功，共 ${total} 条`);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
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
