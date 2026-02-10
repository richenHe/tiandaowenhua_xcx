/**
 * 客户端接口：获取个人资料
 * Action: client:getProfile
 */
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getProfile] 获取个人资料:', user.id);

    // user 已经由 checkClientAuth 查询并返回
    return response.success(user, '获取成功');

  } catch (error) {
    console.error('[getProfile] 获取失败:', error);
    return response.error('获取个人资料失败', error);
  }
};
