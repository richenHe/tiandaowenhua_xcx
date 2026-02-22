/**
 * 管理端接口：获取统计数据
 * Action: getStatistics
 *
 * 功能：统计仪表盘数据
 * - 用户统计：总数、今日新增、大使数量
 * - 订单统计：总数、今日订单、总金额
 * - 课程统计：预约数、签到率
 * - 大使统计：各等级分布
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;

  try {
    console.log(`[admin:getStatistics] 管理员 ${admin.id} 获取统计数据`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 用户统计（注意：users 表没有 deleted_at 字段）
    const { count: totalUsers } = await db
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: todayUsers } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: ambassadorCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('ambassador_level', 0);

    // 2. 订单统计（注意：orders 表没有 deleted_at 字段）
    const { count: totalOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('pay_status', 1);

    const { count: todayOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('pay_status', 1)
      .gte('pay_time', today.toISOString());

    // 订单总金额
    const { data: orderAmounts } = await db
      .from('orders')
      .select('final_amount')
      .eq('pay_status', 1);

    const totalAmount = orderAmounts.reduce((sum, o) => sum + parseFloat(o.final_amount || 0), 0);

    // 3. 课程统计（注意：appointments 表没有 deleted_at 字段）
    const { count: totalAppointments } = await db
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    const { count: checkedInAppointments } = await db
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 2);

    const checkinRate = totalAppointments > 0
      ? ((checkedInAppointments / totalAppointments) * 100).toFixed(2)
      : 0;

    // 4. 大使等级分布
    const { data: ambassadorLevels } = await db
      .from('users')
      .select('ambassador_level')
      .gt('ambassador_level', 0);

    const levelDistribution = {};
    for (let i = 1; i <= 5; i++) {
      levelDistribution[`level_${i}`] = ambassadorLevels.filter(u => u.ambassador_level === i).length;
    }

    // 5. 今日数据概览
    const { count: todayAppointments } = await db
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: todayFeedbacks } = await db
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 返回适配测试用例的字段（简化版）
    return response.success({
      user_count: totalUsers,
      order_count: totalOrders,
      revenue_total: totalAmount.toFixed(2),
      ambassador_count: ambassadorCount,
      // 详细数据（可选）
      users: {
        total: totalUsers,
        today: todayUsers,
        ambassadors: ambassadorCount
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        total_amount: totalAmount.toFixed(2)
      },
      courses: {
        total_appointments: totalAppointments,
        checked_in: checkedInAppointments,
        checkin_rate: checkinRate
      },
      ambassadors: {
        total: ambassadorCount,
        level_distribution: levelDistribution
      },
      today: {
        users: todayUsers,
        orders: todayOrders,
        appointments: todayAppointments,
        feedbacks: todayFeedbacks
      }
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getStatistics] 失败:', error);
    return response.error('获取统计数据失败', error);
  }
};
