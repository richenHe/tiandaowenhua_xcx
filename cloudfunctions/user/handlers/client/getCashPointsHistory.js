/**
 * 客户端接口：积分明细记录
 * Action: client:getCashPointsHistory
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 20 } = event;

  try {
    console.log('[getCashPointsHistory] 获取积分明细:', user.id);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 查询积分明细
    const { data: records, error, count: total } = await db
      .from('cash_points_records')
      .select('id, change_amount, balance_after, change_type, related_id, remark, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    console.log('[getCashPointsHistory] 查询成功，共', total, '条');
    return response.success({
      total,
      page,
      pageSize,
      list: records || []
    });

  } catch (error) {
    console.error('[getCashPointsHistory] 查询失败:', error);
    return response.error('获取积分明细失败', error);
  }
};
