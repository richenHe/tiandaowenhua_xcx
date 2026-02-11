/**
 * 客户端接口：获取活动记录列表
 * Action: client:getActivityRecords
 * @description 获取用户的活动记录列表，支持分页和类型筛选
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('../../common');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

module.exports = async (event, context) => {
  const { user } = context;
  const { activityType = 0, page = 1, pageSize = 10 } = event;

  try {
    console.log('[getActivityRecords] 获取活动记录:', {
      userId: user.id,
      activityType,
      page,
      pageSize
    });

    // 构建查询条件
    const where = {
      user_id: user.id,
      status: 1  // 只查询有效记录
    };

    // 如果指定了活动类型，添加类型筛选
    if (activityType > 0) {
      where.activity_type = activityType;
    }

    // 1. 查询活动记录列表（分页）
    const listResult = await db.collection('ambassador_activity_records')
      .where(where)
      .field({
        id: true,
        activity_type: true,
        activity_name: true,
        activity_desc: true,
        location: true,
        start_time: true,
        duration: true,
        participant_count: true,
        merit_points: true,
        note: true,
        created_at: true
      })
      .orderBy('start_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 2. 查询总数
    const countResult = await db.collection('ambassador_activity_records')
      .where(where)
      .count();

    // 3. 查询统计信息
    const statsResult = await db.collection('ambassador_activity_records')
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
      total_count: statsResult.data.length,
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

    statsResult.data.forEach(record => {
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

    const result = {
      list: listResult.data || [],
      total: countResult.total || 0,
      stats
    };

    console.log('[getActivityRecords] 查询成功:', {
      listCount: result.list.length,
      total: result.total,
      stats: result.stats
    });

    return response.success(result);

  } catch (error) {
    console.error('[getActivityRecords] 查询失败:', error);
    return response.error('获取活动记录失败', error);
  }
};
