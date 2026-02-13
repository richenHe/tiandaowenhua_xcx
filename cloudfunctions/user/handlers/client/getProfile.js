/**
 * 客户端接口：获取个人资料
 * Action: client:getProfile
 */
const { response, db } = require('../../common');
const { getTempFileURL } = require('../../common/storage');

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
    // 注意：用户资料页面的 avatar 和 background_image 已在前端使用 StorageApi 转换
    // 这里保留 fileID 格式不变，由前端 StorageApi 处理
    // qrcode_url 如果存在，也保持 fileID 格式
    // 
    // 如需后端转换，取消以下注释：
    /*
    const fileIDs = [];
    if (profileData.avatar) fileIDs.push(profileData.avatar);
    if (profileData.background_image) fileIDs.push(profileData.background_image);
    if (profileData.qrcode_url) fileIDs.push(profileData.qrcode_url);

    if (fileIDs.length > 0) {
      const tempURLs = await getTempFileURL(fileIDs);
      const urlMap = {};
      tempURLs.forEach((urlObj, index) => {
        if (urlObj && urlObj.tempFileURL) {
          urlMap[fileIDs[index]] = urlObj.tempFileURL;
        }
      });

      if (profileData.avatar && urlMap[profileData.avatar]) {
        profileData.avatar = urlMap[profileData.avatar];
      }
      if (profileData.background_image && urlMap[profileData.background_image]) {
        profileData.background_image = urlMap[profileData.background_image];
      }
      if (profileData.qrcode_url && urlMap[profileData.qrcode_url]) {
        profileData.qrcode_url = urlMap[profileData.qrcode_url];
      }
    }
    */

    // user 已经由 checkClientAuth 查询并返回
    return response.success(profileData, '获取成功');

  } catch (error) {
    console.error('[getProfile] 获取失败:', error);
    return response.error('获取个人资料失败', error);
  }
};
