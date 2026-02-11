/**
 * 客户端接口：功德分明细记录
 * Action: client:getMeritPointsHistory
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 20 } = event;

  try {
    console.log('[getMeritPointsHistory] 获取功德分明细:', user.id);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 查询功德分明细
    const { data: records, error, count: total } = await db
      .from('merit_points_records')
      .select('id, type, amount, balance_after, source, order_no, referee_user_id, remark, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const list = (records || []).map(record => ({
      id: record.id,
      change_amount: record.type === 1 ? record.amount : -record.amount, // type: 1=收入(正数), 2=支出(负数)
      balance_after: record.balance_after, // 变更后余额
      change_type: record.type, // 1=收入, 2=支出
      source: record.source, // 来源：1=推荐新用户, 2=用户购课, 3=用户升级, 4=活动奖励, 5=兑换商品
      related_id: record.order_no, // 关联订单号
      referee_user_id: record.referee_user_id,
      remark: record.remark,
      created_at: record.created_at
    }));

    console.log('[getMeritPointsHistory] 查询成功，共', total, '条');
    return response.success({
      total,
      page,
      pageSize,
      list
    });

  } catch (error) {
    console.error('[getMeritPointsHistory] 查询失败:', error);
    return response.error('获取功德分明细失败', error);
  }
};
