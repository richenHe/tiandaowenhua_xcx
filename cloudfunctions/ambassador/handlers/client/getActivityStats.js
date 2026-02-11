/**
 * 客户端接口：获取活动统计信息
 * Action: client:getActivityStats
 * @description 获取用户的活动统计数据（累计活动、功德分、本月活动、类型分布）
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('../../common');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getActivityStats] 获取活动统计:', user.id);

    // 查询所有有效的活动记录
    const result = await db.collection('ambassador_activity_records')
      .where({
        user_id: user.id,
        status: 1
      })
      .field({
        activity_type: true,
        merit_points: true,
        start_time: true
      })
      .get();

    // 计算统计数据
    const stats = {
      total_count: result.data.length,
      total_merit_points: 0,
      month_count: 0,
      type_stats: {
        1: 0,  // 辅导员
        2: 0,  // 会务义工
        3: 0,  // 沙龙组织
        4: 0   // 其他活动
      }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    result.data.forEach(record => {
      // 累计功德分
      stats.total_merit_points += parseFloat(record.merit_points) || 0;

      // 统计活动类型
      if (record.activity_type >= 1 && record.activity_type <= 4) {
        stats.type_stats[record.activity_type]++;
      }

      // 统计本月活动
      const recordDate = new Date(record.start_time);
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        stats.month_count++;
      }
    });

    console.log('[getActivityStats] 查询成功:', stats);
    return response.success(stats);

  } catch (error) {
    console.error('[getActivityStats] 查询失败:', error);
    return response.error('获取活动统计失败', error);
  }
};
