/**
 * 客户端接口：微信登录/注册
 * Action: client:login
 */
const { findOne, insert, query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID } = context;
  const { code, scene } = event;

  try {
    console.log('[login] 登录请求:', { openid: OPENID?.slice(-6), scene });

    // 1. 查询用户是否已存在
    const existingUser = await findOne('users', { _openid: OPENID });

    // 2. 如果用户已存在，直接返回用户信息
    if (existingUser) {
      console.log('[login] 用户已存在，返回用户信息');
      return response.success(existingUser, '登录成功');
    }

    // 3. 新用户注册流程
    console.log('[login] 新用户注册');

    // 生成唯一6位推荐码（注意：使用 referee_code 字段）
    const refereeCode = await generateUniqueRefereeCode();

    // 解析 scene 参数获取推荐人
    let refereeId = null;
    let refereeUid = null;
    if (scene) {
      const refereeUser = await findOne('users', { referee_code: scene });
      if (refereeUser) {
        refereeId = refereeUser.id;
        refereeUid = refereeUser.uid;
        console.log('[login] 绑定推荐人:', refereeId);
      }
    }

    // 生成用户 UID
    const uid = generateUID();

    // 创建新用户（需要手动设置 _openid 和 openid）
    const newUserData = {
      uid,
      _openid: OPENID,  // ✅ CloudBase 标准字段
      openid: OPENID,   // ✅ 业务字段
      referee_code: refereeCode,
      referee_id: refereeId,
      referee_uid: refereeUid,
      profile_completed: 0
    };

    const result = await insert('users', newUserData);

    // 查询新创建的用户信息
    const newUser = await findOne('users', { uid });

    console.log('[login] 新用户注册成功:', newUser.id);
    return response.success(newUser, '注册成功');

  } catch (error) {
    console.error('[login] 登录失败:', error);
    return response.error('登录失败', error);
  }
};

/**
 * 生成唯一的6位推荐码
 */
async function generateUniqueRefereeCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    // 生成6位随机码
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // 检查是否已存在（注意：使用 referee_code 字段）
    const existing = await findOne('users', { referee_code: code });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * 生成用户 UID（64位唯一标识）
 */
function generateUID() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`.toUpperCase();
}
