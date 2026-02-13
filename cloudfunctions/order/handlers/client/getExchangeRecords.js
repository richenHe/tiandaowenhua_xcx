/**
 * 客户端接口：兑换记录列表
 * Action: getExchangeRecords
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');
const { getTempFileURL } = require('../../common/storage');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { status, page = 1, page_size = 10 } = event;

  try {
    console.log(`[getExchangeRecords] 查询兑换记录:`, { user_id: user.id, status, page });

    // 获取分页参数
    const { limit, offset } = getPagination(page, page_size);

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
      .eq('user_id', user.id);

    // 添加状态筛选
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 执行查询
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: records, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 格式化记录列表
    const list = (records || []).map(record => ({
      exchange_no: record.exchange_no,
      goods_name: record.goods_name,
      goods_image: record.goods_image,
      quantity: record.quantity,
      merit_points_used: record.merit_points_used,
      cash_points_used: record.cash_points_used,
      total_cost: record.total_cost,
      status: record.status,
      status_name: getExchangeStatusName(record.status),
      created_at: record.created_at
    }));

    // 🔥 转换云存储 fileID 为临时 URL
    if (list && list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(item => {
        if (item.goods_image) fileIDs.push(item.goods_image);
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(item => {
        if (item.goods_image && urlMap[item.goods_image]) {
          item.goods_image = urlMap[item.goods_image];
        }
      });
    }

    console.log(`[getExchangeRecords] 查询成功，共 ${total} 条`);

    return response.success({
      total: total || 0,
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
