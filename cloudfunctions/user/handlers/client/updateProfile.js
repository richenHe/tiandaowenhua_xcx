/**
 * 客户端接口:更新个人资料
 * Action: client:updateProfile
 */
const { update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user, OPENID } = context;
  const { realName, phone, city, avatar, backgroundImage, gender, industry, birthday, nickname, bankAccountName, bankName, bankAccountNumber } = event;

  try {
    console.log('[updateProfile] 更新个人资料:', user.id);
    console.log('[updateProfile] 接收到的参数:', { realName, phone, city, avatar, backgroundImage, gender, industry, birthday, nickname });

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
    if (nickname) {
      updateData.nickname = nickname;
    }
    if (backgroundImage) {
      updateData.background_image = backgroundImage;
    }
    // 修复：用 != null 而非 if(gender)，防止 0（女）因 falsy 被跳过
    // 前端传来数字（1=男/0=女）或字符串（'男'/'女'），统一映射到 DB 规范：0=女/1=男
    if (gender != null && gender !== '') {
      if (gender === 1 || gender === '男') {
        updateData.gender = 1;  // 男
      } else if (gender === 0 || gender === '女') {
        updateData.gender = 0;  // 女
      }
    }
    if (industry) {
      updateData.industry = industry;
    }
    // 银行账户信息（选填，用空字符串也允许清空）
    if (bankAccountName != null) {
      updateData.bank_account_name = bankAccountName;
    }
    if (bankName != null) {
      updateData.bank_name = bankName;
    }
    if (bankAccountNumber != null) {
      updateData.bank_account_number = bankAccountNumber;
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

    // 触发历史学员数据导入（非阻塞，失败不影响本次更新）
    if (realName) {
      try {
        const { processLegacyImport } = require('../../business-logic/legacyImport');
        const importResult = await processLegacyImport(user.id, realName, OPENID);
        if (importResult) {
          console.log('[updateProfile] 历史数据导入完成:', JSON.stringify(importResult));
        }
      } catch (legacyError) {
        console.error('[updateProfile] 历史数据导入失败（不影响本次更新）:', legacyError);
      }
    }

    return response.success({ profile_completed: 1 }, '更新成功');

  } catch (error) {
    console.error('[updateProfile] 更新失败:', error);
    return response.error('更新个人资料失败', error);
  }
};
