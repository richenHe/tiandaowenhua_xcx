/**
 * 客户端接口：微信登录/注册
 * Action: client:login
 */
const cloud = require('wx-server-sdk');
const { findOne, insert, query } = require('../../common/db');
const { response } = require('../../common');

// 初始化 wx-server-sdk
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

module.exports = async (event, context) => {
  const { code, scene } = event;
  let OPENID = null;

  try {
    console.log('[login] ========== 登录请求开始 ==========');
    console.log('[login] 接收到的参数:', {
      scene: scene || 'none',
      code: code ? `存在（后6位:${code?.slice(-6)}）` : 'none'
    });

    // ⚠️ 关键步骤：通过 code 换取真实的微信 openid
    if (code) {
      console.log('[login] 步骤1：使用 code 换取真实的微信 openid...');
      
      try {
        // 调用微信官方 API auth.code2Session 换取 openid
        // 需要 AppID 和 AppSecret
        const APPID = process.env.WECHAT_APPID;
        const APP_SECRET = process.env.WECHAT_APP_SECRET;
        
        console.log('[login] 使用 AppID:', APPID);
        
        if (!APPID || !APP_SECRET) {
          throw new Error('未配置微信 AppID 或 AppSecret 环境变量');
        }
        
        // 构造请求 URL
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
        
        console.log('[login] 调用微信 API: jscode2session');
        
        // 使用 cloud.getWXContext() 获取 openid（如果在云函数环境中）
        // 或者使用 HTTP 请求调用微信 API
        const https = require('https');
        const result = await new Promise((resolve, reject) => {
          https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          }).on('error', (err) => {
            reject(err);
          });
        });
        
        console.log('[login] 微信 API 返回:', {
          errcode: result.errcode || 0,
          errmsg: result.errmsg || 'ok',
          openid_last6: result.openid?.slice(-6) || 'undefined',
          session_key_exists: !!result.session_key
        });
        
        if (result.openid) {
          OPENID = result.openid;
          console.log('[login] ✅ 成功获取真实的微信 openid');
          console.log('[login] openid 详情:', {
            full: OPENID,
            last6: OPENID.slice(-6),
            length: OPENID.length,
            type: typeof OPENID
          });
        } else {
          console.error('[login] ❌ 换取 openid 失败:', result);
          throw new Error(`获取 openid 失败: ${result.errmsg || '未知错误'} (errcode: ${result.errcode})`);
        }
      } catch (apiError) {
        console.error('[login] ❌ 调用微信 API 失败:', apiError);
        throw new Error(`调用微信 API 失败: ${apiError.message}`);
      }
    } else {
      console.error('[login] ❌ 缺少 code 参数');
      throw new Error('缺少微信登录凭证 code');
    }
    
    // 安全检查：确保 openid 有效
    if (!OPENID || OPENID.length === 0) {
      console.error('[login] ❌ 严重错误：openid 无效或为空');
      throw new Error('未能获取有效的用户身份信息');
    }
    
    console.log('[login] ✅ openid 验证通过，这是真实的微信 openid');

    // 1. 查询用户是否已存在
    console.log('[login] 步骤1：查询数据库，检查用户是否已存在');
    console.log('[login] 查询条件: { _openid:', OPENID?.slice(-6), '}');
    const existingUser = await findOne('users', { _openid: OPENID });

    // 2. 如果用户已存在，直接返回用户信息
    if (existingUser) {
      console.log('[login] ✅ 用户已存在');
      console.log('[login] 用户信息:', {
        id: existingUser.id,
        uid: existingUser.uid,
        openid_last6: existingUser.openid?.slice(-6),
        _openid_last6: existingUser._openid?.slice(-6),
        openid_match: existingUser.openid === OPENID,
        _openid_match: existingUser._openid === OPENID,
        profile_completed: existingUser.profile_completed
      });
      console.log('[login] ========== 登录成功（已存在用户）==========');
      return response.success(existingUser, '登录成功');
    }

    // 3. 新用户注册流程
    console.log('[login] ========== 新用户注册流程 ==========');
    console.log('[login] 步骤2：用户不存在，开始注册流程');

    // 生成唯一6位推荐码（注意：使用 referee_code 字段）
    console.log('[login] 步骤3：生成唯一推荐码');
    const refereeCode = await generateUniqueRefereeCode();
    console.log('[login] 推荐码生成成功:', refereeCode);

    // 解析 scene 参数获取推荐人
    let refereeId = null;
    let refereeUid = null;
    if (scene) {
      console.log('[login] 步骤4：解析推荐人信息 (scene:', scene, ')');
      const refereeUser = await findOne('users', { referee_code: scene });
      if (refereeUser) {
        refereeId = refereeUser.id;
        refereeUid = refereeUser.uid;
        console.log('[login] ✅ 找到推荐人:', {
          id: refereeId,
          uid: refereeUid,
          referee_code: scene
        });
      } else {
        console.log('[login] ⚠️ 未找到对应的推荐人，scene:', scene);
      }
    } else {
      console.log('[login] 步骤4：无推荐人（scene 为空）');
    }

    // 生成用户 UID
    console.log('[login] 步骤5：生成用户 UID');
    const uid = generateUID();
    console.log('[login] UID 生成成功:', uid);

    // 创建新用户（需要手动设置 _openid 和 openid）
    console.log('[login] 步骤6：准备写入数据库');
    const newUserData = {
      uid,
      _openid: OPENID,  // ✅ CloudBase 标准字段（用于权限控制）
      openid: OPENID,   // ✅ 业务字段（用于微信支付等）
      referee_code: refereeCode,
      referee_id: refereeId,
      referee_uid: refereeUid,
      profile_completed: 0
    };
    
    console.log('[login] 新用户数据:', {
      uid,
      openid_last6: OPENID?.slice(-6),
      _openid_last6: OPENID?.slice(-6),
      openid_full_length: OPENID?.length,
      referee_code: refereeCode,
      referee_id: refereeId || 'none',
      referee_uid: refereeUid || 'none',
      profile_completed: 0
    });
    
    console.log('[login] ⚠️ 重要：openid 和 _openid 都使用真实的微信 openid');
    console.log('[login] ⚠️ openid 字段将用于微信支付 API');

    console.log('[login] 步骤7：执行数据库插入');
    const result = await insert('users', newUserData);
    console.log('[login] ✅ 数据库插入成功，插入结果:', result);

    // 查询新创建的用户信息
    console.log('[login] 步骤8：查询新创建的用户信息');
    const newUser = await findOne('users', { uid });
    
    if (!newUser) {
      console.error('[login] ❌ 严重错误：用户创建后查询失败');
      throw new Error('用户创建成功但查询失败');
    }

    console.log('[login] ✅ 新用户注册成功');
    console.log('[login] 用户信息:', {
      id: newUser.id,
      uid: newUser.uid,
      openid_last6: newUser.openid?.slice(-6),
      _openid_last6: newUser._openid?.slice(-6),
      openid_match: newUser.openid === OPENID,
      _openid_match: newUser._openid === OPENID,
      referee_code: newUser.referee_code,
      profile_completed: newUser.profile_completed
    });
    console.log('[login] ========== 注册成功 ==========');
    return response.success(newUser, '注册成功');

  } catch (error) {
    console.error('[login] ========== 登录失败 ==========');
    console.error('[login] 错误类型:', error.name);
    console.error('[login] 错误消息:', error.message);
    console.error('[login] 错误堆栈:', error.stack);
    console.error('[login] 接收到的 openid:', OPENID?.slice(-6) || 'undefined');
    console.error('[login] =====================================');
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
