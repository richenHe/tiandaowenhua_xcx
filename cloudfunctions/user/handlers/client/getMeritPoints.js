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

    // ⚠️ 聚合查询暂时使用 db 实例直接查询
    // CloudBase SDK 的查询构建器可能不支持复杂聚合
    const statsQuery = await db
      .from('merit_points_records')
      .select('change_amount')
      .eq('user_id', user.id);

    const { data: records, error } = statsQuery;

    if (error) {
      throw new Error(error.message);
    }

    let total_earned = 0;
    let total_spent = 0;

    (records || []).forEach(record => {
      if (record.change_amount > 0) {
        total_earned += parseFloat(record.change_amount);
      } else {
        total_spent += Math.abs(parseFloat(record.change_amount));
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
