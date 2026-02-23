/**
 * 获取用户积分信息（客户端接口，需要用户鉴权）
 * @description 返回用户的功德分和积分余额
 */

const { response } = require('common');

module.exports = async (event, context) => {
  const { user } = context;  // user 已通过 checkClientAuth 鉴权

  try {
    const meritPoints = Math.round(parseFloat(user.merit_points) || 0);
    const cashPointsAvailable = Math.round(parseFloat(user.cash_points_available) || 0);
    const cashPointsFrozen = Math.round(parseFloat(user.cash_points_frozen) || 0);
    const cashPointsPending = Math.round(parseFloat(user.cash_points_pending) || 0);

    return response.success({
      // camelCase（前端规范）
      meritPoints,
      cashPointsAvailable,
      cashPointsFrozen,
      cashPointsPending,
      // snake_case 兼容字段
      merit_points: meritPoints,
      cash_points_available: cashPointsAvailable,
      cash_points_frozen: cashPointsFrozen,
      cash_points_pending: cashPointsPending
    }, '获取成功');

  } catch (error) {
    console.error('获取用户积分失败:', error);
    return response.error('获取用户积分失败', error);
  }
};













