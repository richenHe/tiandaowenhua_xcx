/**
 * 客户端接口：微信登录/注册
 * Action: client:login
 * 
 * 认证策略（切换至 wx.cloud.callFunction() 后）：
 * - context.OPENID = 真实微信 openid（微信运行时自动注入，不再是 CloudBase uid）
 * - _openid 字段：存储真实微信 openid（与 openid 字段相同）
 * - openid 字段：存储真实微信 openid（通过 code2session 二次确认）
 * - 迁移兼容：老用户 _openid 存的是 CloudBase uid，通过 openid 字段查找并自动迁移
 */
const { findOne, insert, update, query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  // 切换至 wx.cloud.callFunction() 后，context.OPENID = 真实微信 openid
  const { OPENID: wxContextOpenid } = context;
  const { code, scene } = event;
  let wxOpenid = null; // 通过 code2session 获取的真实微信 openid（二次确认）

  try {
    console.log('[login] ========== 登录请求开始 ==========');
    console.log('[login] context.OPENID（真实wx openid）:', wxContextOpenid?.slice(-6) || 'undefined');
    console.log('[login] 接收到的参数:', {
      scene: scene || 'none',
      code: code ? `存在（后6位:${code?.slice(-6)}）` : 'none'
    });

    // ========== 步骤1：通过 code 换取真实的微信 openid ==========
    if (code) {
      console.log('[login] 步骤1：使用 code 换取真实的微信 openid...');
      
      try {
        const APPID = process.env.WECHAT_APPID;
        const APP_SECRET = process.env.WECHAT_APP_SECRET;
        
        console.log('[login] 使用 AppID:', APPID);
        
        if (!APPID || !APP_SECRET) {
          console.error('[login] ⚠️ 未配置微信 AppID 或 AppSecret 环境变量');
        } else {
          const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
          
          console.log('[login] 调用微信 API: jscode2session');
          
          const https = require('https');
          const result = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
              });
            }).on('error', (err) => { reject(err); });
          });
          
          console.log('[login] 微信 API 返回:', {
            errcode: result.errcode || 0,
            errmsg: result.errmsg || 'ok',
            openid_last6: result.openid?.slice(-6) || 'undefined',
            session_key_exists: !!result.session_key
          });
          
          if (result.openid) {
            wxOpenid = result.openid;
            console.log('[login] ✅ 成功获取真实的微信 openid:', wxOpenid.slice(-6));
          } else {
            console.error('[login] ⚠️ 换取 openid 失败:', result.errmsg || '未知错误');
          }
        }
      } catch (apiError) {
        console.error('[login] ⚠️ 调用微信 API 失败:', apiError.message);
        // 不抛出错误，继续流程（openid 可后续补充）
      }
    } else {
      console.log('[login] ⚠️ 未传入 code，跳过微信 openid 获取');
    }

    // ========== 步骤2：查询用户是否已存在 ==========
    console.log('[login] 步骤2：查询数据库，检查用户是否已存在');
    
    // 使用真实 wx openid 作为主标识（优先用 code2session 结果，fallback 用 context.OPENID）
    const primaryOpenid = wxOpenid || wxContextOpenid;
    
    if (!primaryOpenid) {
      console.error('[login] ❌ 严重错误：未获取到用户 openid');
      throw new Error('未能获取用户身份信息，请重新登录');
    }

    // 策略1：用真实微信 openid 查找 _openid 字段（新用户或已迁移用户）
    let existingUser = await findOne('users', { _openid: primaryOpenid });
    console.log('[login] 策略1 查找 _openid =', primaryOpenid?.slice(-6), '结果:', existingUser ? `找到 id=${existingUser.id}` : '未找到');
    
    // 策略2：查找 openid 字段（老用户迁移场景：_openid 存的是旧的 CloudBase uid）
    if (!existingUser) {
      existingUser = await findOne('users', { openid: primaryOpenid });
      if (existingUser) {
        console.log('[login] ⚠️ 通过 openid 字段找到老用户（迁移场景），id:', existingUser.id);
        // 迁移：将 _openid 从 CloudBase uid 更新为真实微信 openid
        console.log('[login] 执行迁移：_openid 从 CloudBase uid 更新为真实微信 openid:', primaryOpenid?.slice(-6));
        await update('users', { _openid: primaryOpenid }, { id: existingUser.id });
        existingUser._openid = primaryOpenid;
        console.log('[login] ✅ _openid 迁移完成');
      }
    }

    // ========== 步骤3：已存在用户 - 更新并返回 ==========
    if (existingUser) {
      console.log('[login] ✅ 用户已存在, id:', existingUser.id);
      
      // 确保 openid 字段也是最新的真实微信 openid
      const needUpdateOpenid = wxOpenid && existingUser.openid !== wxOpenid;
      
      if (needUpdateOpenid) {
        await update('users', { openid: wxOpenid }, { id: existingUser.id });
        existingUser.openid = wxOpenid;
        console.log('[login] 更新 openid 字段:', wxOpenid?.slice(-6));
        console.log('[login] ✅ 用户信息更新完成');
      }
      
      console.log('[login] 用户信息:', {
        id: existingUser.id,
        uid: existingUser.uid,
        _openid_last6: existingUser._openid?.slice(-6),
        openid_last6: existingUser.openid?.slice(-6),
        profile_completed: existingUser.profile_completed
      });
      console.log('[login] ========== 登录成功（已存在用户）==========');
      return response.success(existingUser, '登录成功');
    }

    // ========== 步骤4：新用户注册 ==========
    console.log('[login] ========== 新用户注册流程 ==========');

    // 生成唯一6位推荐码
    const refereeCode = await generateUniqueRefereeCode();
    console.log('[login] 推荐码:', refereeCode);

    // 解析推荐人
    let refereeId = null;
    let refereeUid = null;
    if (scene) {
      console.log('[login] 解析推荐人 (scene:', scene, ')');
      const refereeUser = await findOne('users', { referee_code: scene });
      if (refereeUser) {
        refereeId = refereeUser.id;
        refereeUid = refereeUser.uid;
        console.log('[login] ✅ 找到推荐人, id:', refereeId);
      } else {
        console.log('[login] ⚠️ 未找到推荐人');
      }
    }

    // 生成用户 UID
    const uid = generateUID();
    console.log('[login] UID:', uid);

    // 创建新用户（_openid 和 openid 都使用真实微信 openid）
    const newUserData = {
      uid,
      _openid: primaryOpenid,  // 真实微信 openid（用于用户识别）
      openid: primaryOpenid,   // 真实微信 openid（用于微信支付等 API）
      referee_code: refereeCode,
      referee_id: refereeId,
      referee_uid: refereeUid,
      profile_completed: 0
    };
    
    console.log('[login] 新用户数据:', {
      uid,
      _openid_last6: primaryOpenid?.slice(-6),
      openid_last6: primaryOpenid?.slice(-6),
      referee_code: refereeCode,
      referee_id: refereeId || 'none'
    });

    await insert('users', newUserData);
    console.log('[login] ✅ 数据库插入成功');

    // 查询新创建的用户
    const newUser = await findOne('users', { uid });
    
    if (!newUser) {
      console.error('[login] ❌ 用户创建后查询失败');
      throw new Error('用户创建成功但查询失败');
    }

    console.log('[login] ✅ 新用户注册成功, id:', newUser.id);
    console.log('[login] ========== 注册成功 ==========');
    return response.success(newUser, '注册成功');

  } catch (error) {
    console.error('[login] ========== 登录失败 ==========');
    console.error('[login] 错误:', error.message);
    console.error('[login] context.OPENID:', wxContextOpenid?.slice(-6) || 'undefined');
    console.error('[login] code2session openid:', wxOpenid?.slice(-6) || 'undefined');
    console.error('[login] =============================');
    return response.error('登录失败', error);
  }
};

/**
 * 生成唯一的6位推荐码
 */
async function generateUniqueRefereeCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
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
