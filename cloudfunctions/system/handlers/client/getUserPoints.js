/**
 * 获取用户积分信息（客户端接口，需要用户鉴权）
 * @description 返回用户的功德分和积分余额
 */

const { response } = require('common');

module.exports = async (event, context) => {
  const { user } = context;  // user 已通过 checkClientAuth 鉴权

  try {
    // 返回用户积分信息
    return response.success({
      meritPoints: parseFloat(user.merit_points) || 0,          // 功德分
      cashPointsFrozen: parseFloat(user.cash_points_frozen) || 0,      // 冻结积分
      cashPointsAvailable: parseFloat(user.cash_points_available) || 0, // 可用积分
      cashPointsPending: parseFloat(user.cash_points_pending) || 0     // 提现中积分
    }, '获取成功');

  } catch (error) {
    console.error('获取用户积分失败:', error);
    return response.error('获取用户积分失败', error);
  }
};



