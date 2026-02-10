/**
 * 管理端接口：学员详情
 * Action: admin:getUserDetail
 * 
 * ⚠️⚠️⚠️ 警告：此接口极其复杂！
 * 涉及多个 JOIN 查询、多个聚合统计
 * CloudBase SDK 查询构建器无法直接实现
 * 
 * 建议方案：
 * 1. 使用 MCP executeReadOnlySQL 工具执行原始 SQL
 * 2. 或者拆分为多个简单查询逐个执行
 * 3. 或者在服务端实现专门的聚合接口
 * 
 * 当前版本：仅修改字段名，标注TODO
 */
const { findOne, query, count, db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId } = event;

  try {
    console.log('[admin:getUserDetail] 获取学员详情:', userId);

    // 参数验证
    if (!userId) {
      return response.paramError('缺少参数：userId');
    }

    // 查询用户基本信息（⚠️ 修正字段名）
    const user = await findOne('users', { id: userId });

    if (!user) {
      return response.error('用户不存在', null, 404);
    }

    // 查询推荐人信息
    let referee = null;
    if (user.referee_id) {
      referee = await findOne('users', { id: user.referee_id });
    }

    // 查询推荐的用户数量
    const refereeCount = await count('users', { referee_id: userId });

    // ⚠️ 以下部分涉及 JOIN 和聚合查询，需要使用 MCP 工具或其他方案
    console.warn('[getUserDetail] 复杂统计查询需要使用 MCP 工具');

    // TODO: 查询已购课程列表（需要JOIN）
    const courses = [];

    // TODO: 查询订单统计（需要聚合）
    const orderStats = {
      totalOrders: 0,
      paidOrders: 0,
      totalSpent: 0
    };

    // TODO: 查询最近的订单
    const recentOrders = [];

    // TODO: 查询积分统计（需要聚合）
    const meritPointsStats = {
      totalEarned: 0,
      totalSpent: 0,
      balance: user.merit_points || 0
    };

    const cashPointsStats = {
      totalEarned: 0,
      totalWithdrawn: 0,
      available: user.cash_points_available || 0,  // ⚠️ 修正字段名
      frozen: user.cash_points_frozen || 0  // ⚠️ 修正字段名
    };

    // TODO: 查询提现统计
    const withdrawStats = {
      totalWithdrawals: 0,
      approvedAmount: 0,
      pendingAmount: 0
    };

    console.log('[admin:getUserDetail] 查询成功（部分功能需要后续实现）');
    return response.success({
      user,
      referee,
      refereeCount: refereeCount || 0,
      courses,
      orderStats,
      recentOrders,
      meritPointsStats,
      cashPointsStats,
      withdrawStats,
      _warning: '⚠️ 部分统计数据需要使用 MCP 工具实现复杂查询'
    });

  } catch (error) {
    console.error('[admin:getUserDetail] 查询失败:', error);
    return response.error('获取学员详情失败', error);
  }
};
