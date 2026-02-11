/**
 * 客户端接口：获取功德分余额和统计
 * Action: client:getMeritPoints
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getMeritPoints] 获取功德分:', user.id);

    // 查询功德分记录
    const { data: records, error } = await db
      .from('merit_points_records')
      .select('type, amount')
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    let total_earned = 0;
    let total_spent = 0;

    // type: 1=收入, 2=支出
    (records || []).forEach(record => {
      const amount = parseFloat(record.amount) || 0;
      if (record.type === 1) {
        total_earned += amount;
      } else if (record.type === 2) {
        total_spent += amount;
      }
    });

    const result = {
      balance: user.merit_points || 0,
      total_earned,
      total_spent
    };

    console.log('[getMeritPoints] 查询成功');
    return response.success(result);

  } catch (error) {
    console.error('[getMeritPoints] 查询失败:', error);
    return response.error('获取功德分失败', error);
  }
};
