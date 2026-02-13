/**
 * 客户端接口：获取个人资料
 * Action: client:getProfile
 */
const { response, db, getTempFileURL } = require('common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getProfile] 获取个人资料:', user.id);

    // 如果有推荐人，查询推荐人详细信息
    let refereeName = null;
    let refereeLevel = 0;
    if (user.referee_id) {
      const { data: refereeData, error } = await db
        .from('users')
        .select('real_name, nickname, ambassador_level')
        .eq('id', user.referee_id)
        .limit(1);
      
      if (!error && refereeData && refereeData.length > 0) {
        refereeName = refereeData[0].real_name || refereeData[0].nickname || null;
        refereeLevel = refereeData[0].ambassador_level || 0;
        console.log('[getProfile] 推荐人信息:', { name: refereeName, level: refereeLevel });
      }
    }

    // 处理返回数据
    const profileData = {
      ...user,
      // 添加推荐人信息
      referee_name: refereeName,
      referee_level: refereeLevel,
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

    // 🔥 转换云存储 fileID 为临时 URL
    if (profileData.avatar) {
      try {
        const result = await getTempFileURL(profileData.avatar);
        profileData.avatar = result.tempFileURL || profileData.avatar;
      } catch (error) {
        console.warn('[getProfile] 转换avatar临时URL失败:', profileData.avatar, error.message);
      }
    }
    
    if (profileData.background_image) {
      try {
        const result = await getTempFileURL(profileData.background_image);
        profileData.background_image = result.tempFileURL || profileData.background_image;
      } catch (error) {
        console.warn('[getProfile] 转换background_image临时URL失败:', profileData.background_image, error.message);
      }
    }
    
    if (profileData.qrcode_url) {
      try {
        const result = await getTempFileURL(profileData.qrcode_url);
        profileData.qrcode_url = result.tempFileURL || profileData.qrcode_url;
      } catch (error) {
        console.warn('[getProfile] 转换qrcode_url临时URL失败:', profileData.qrcode_url, error.message);
      }
    }

    // user 已经由 checkClientAuth 查询并返回
    return response.success(profileData, '获取成功');

  } catch (error) {
    console.error('[getProfile] 获取失败:', error);
    return response.error('获取个人资料失败', error);
  }
};
