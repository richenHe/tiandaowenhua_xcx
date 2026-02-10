/**
 * 客户端接口：更新个人资料
 * Action: client:updateProfile
 */
const { update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user, OPENID } = context;
  const { realName, phone, city, avatar } = event;

  try {
    console.log('[updateProfile] 更新个人资料:', user.id);

    // 参数验证
    const err = utils.validateRequired(event, ['realName', 'phone']);
    if (err) {
      return response.paramError(err);
    }

    // 更新用户资料
    await update('users', 
      {
        real_name: realName,
        phone: phone,
        city: city || '',
        avatar: avatar || '',
        profile_completed: 1
      },
      { _openid: OPENID }
    );

    console.log('[updateProfile] 更新成功');
    return response.success(null, '更新成功');

  } catch (error) {
    console.error('[updateProfile] 更新失败:', error);
    return response.error('更新个人资料失败', error);
  }
};
