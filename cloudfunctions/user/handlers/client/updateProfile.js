/**
 * 客户端接口:更新个人资料
 * Action: client:updateProfile
 */
const { update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user, OPENID } = context;
  const { realName, phone, city, avatar, gender, industry, birthday } = event;

  try {
    console.log('[updateProfile] 更新个人资料:', user.id);
    console.log('[updateProfile] 接收到的参数:', { realName, phone, city, avatar, gender, industry, birthday });

    // 参数验证
    const err = utils.validateRequired(event, ['realName', 'phone']);
    if (err) {
      console.error('[updateProfile] 参数验证失败:', err);
      return response.paramError(err);
    }

    // 构建更新数据
    const updateData = {
      real_name: realName,
      phone: phone,
      city: city || '',
      avatar: avatar || '',
      profile_completed: 1
    };

    // 添加可选字段
    if (gender) {
      // 转换性别为数字: 男=1, 女=2
      updateData.gender = gender === '男' ? 1 : gender === '女' ? 2 : 0;
    }
    if (industry) {
      updateData.industry = industry;
    }
    if (birthday) {
      // birthday 格式为 "年-月-日-时"，解析为 JSON 存储到 birth_bazi
      const parts = birthday.split('-');
      if (parts.length === 4) {
        updateData.birth_bazi = JSON.stringify({
          year: parts[0],
          month: parts[1],
          day: parts[2],
          hour: parts[3]
        });
      }
    }

    // 更新用户资料
    await update('users', updateData, { _openid: OPENID });

    console.log('[updateProfile] 更新成功');
    return response.success({ profile_completed: 1 }, '更新成功');

  } catch (error) {
    console.error('[updateProfile] 更新失败:', error);
    return response.error('更新个人资料失败', error);
  }
};
