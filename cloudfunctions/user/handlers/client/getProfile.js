/**
 * 客户端接口：获取个人资料
 * Action: client:getProfile
 */
const { response, db, cloudFileIDToURL } = require('common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log('[getProfile] 获取个人资料:', user.id);

    // 如果有推荐人，查询推荐人详细信息及活动次数
    let refereeName = null;
    let refereeLevel = 0;
    let refereeActivityCount = 0;
    if (user.referee_id) {
      const { data: refereeData, error } = await db
        .from('users')
        .select('real_name, nickname, ambassador_level')
        .eq('id', user.referee_id)
        .limit(1);
      
      if (!error && refereeData && refereeData.length > 0) {
        refereeName = refereeData[0].real_name || refereeData[0].nickname || null;
        refereeLevel = refereeData[0].ambassador_level || 0;

        // 查询推荐人的活动次数（status=1 有效记录，与活动记录页统计口径一致）
        const { count: actCount } = await db
          .from('ambassador_activity_records')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.referee_id)
          .eq('status', 1);
        refereeActivityCount = actCount || 0;

        console.log('[getProfile] 推荐人信息:', { name: refereeName, level: refereeLevel, activityCount: refereeActivityCount });
      }
    }

    // 处理返回数据
    const profileData = {
      ...user,
      // 添加推荐人信息
      referee_name: refereeName,
      referee_level: refereeLevel,
      referee_activity_count: refereeActivityCount,
      // 返回数字，与数据库规范一致（0=女/1=男）；兼容历史数据 gender=2（旧版误存的女性）
      gender: user.gender === 1 ? 1 : (user.gender === 0 || user.gender === 2) ? 0 : null,
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

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL（无需 API 调用，避免认证问题）
    // 同时保留原始 fileID 供前端更新时使用
    if (profileData.avatar && profileData.avatar.startsWith('cloud://')) {
      profileData.avatar_file_id = profileData.avatar;
      profileData.avatar = cloudFileIDToURL(profileData.avatar);
    }
    if (profileData.background_image && profileData.background_image.startsWith('cloud://')) {
      profileData.background_image_file_id = profileData.background_image;
      profileData.background_image = cloudFileIDToURL(profileData.background_image);
    }
    if (profileData.qrcode_url && profileData.qrcode_url.startsWith('cloud://')) {
      profileData.qrcode_url_file_id = profileData.qrcode_url;
      profileData.qrcode_url = cloudFileIDToURL(profileData.qrcode_url);
    }

    // user 已经由 checkClientAuth 查询并返回
    return response.success(profileData, '获取成功');

  } catch (error) {
    console.error('[getProfile] 获取失败:', error);
    return response.error('获取个人资料失败', error);
  }
};
