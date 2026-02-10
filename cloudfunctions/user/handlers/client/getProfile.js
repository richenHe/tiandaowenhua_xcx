/**
 * 客户端接口：获取个人资料
 * Action: client:getProfile
 */
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getProfile] 获取个人资料:', user.id);

    // 处理返回数据
    const profileData = {
      ...user,
      // 转换性别为字符串
      gender: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '',
      // 解析出生八字 JSON
      birthday: user.birth_bazi ? (() => {
        try {
          const bazi = typeof user.birth_bazi === 'string' 
            ? JSON.parse(user.birth_bazi) 
            : user.birth_bazi;
          return `${bazi.year}-${bazi.month}-${bazi.day}-${bazi.hour}`;
        } catch (e) {
          return '';
        }
      })() : ''
    };

    // user 已经由 checkClientAuth 查询并返回
    return response.success(profileData, '获取成功');

  } catch (error) {
    console.error('[getProfile] 获取失败:', error);
    return response.error('获取个人资料失败', error);
  }
};
