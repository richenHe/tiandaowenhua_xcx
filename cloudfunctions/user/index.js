/**
 * User 云函数入口
 * 用户模块 - 17个action
 */
const cloudbase = require('@cloudbase/node-sdk');
const cloud = require('wx-server-sdk');
const { response } = require('./common');
const { checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');

// 初始化 CloudBase (用于其他功能)
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

// 初始化 wx-server-sdk (用于获取真实微信 openid)
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 导入客户端处理器
const clientHandlers = {
  login: require('./handlers/client/login'),
  getProfile: require('./handlers/client/getProfile'),
  updateProfile: require('./handlers/client/updateProfile'),
  updateReferee: require('./handlers/client/updateReferee'),
  getRefereeInfo: require('./handlers/client/getRefereeInfo'),
  searchReferees: require('./handlers/client/searchReferees'),
  getMyCourses: require('./handlers/client/getMyCourses'),
  getMyOrders: require('./handlers/client/getMyOrders'),
  getMeritPoints: require('./handlers/client/getMeritPoints'),
  getMeritPointsHistory: require('./handlers/client/getMeritPointsHistory'),
  getCashPoints: require('./handlers/client/getCashPoints'),
  getCashPointsHistory: require('./handlers/client/getCashPointsHistory'),
  applyWithdraw: require('./handlers/client/applyWithdraw'),
  getWithdrawRecords: require('./handlers/client/getWithdrawRecords'),
  getMyReferees: require('./handlers/client/getMyReferees'),
  getReferralStats: require('./handlers/client/getReferralStats')
};

// 导入管理端处理器
const adminHandlers = {
  getUserList: require('./handlers/admin/getUserList'),
  getUserDetail: require('./handlers/admin/getUserDetail'),
  updateUserReferee: require('./handlers/admin/updateUserReferee'),
  getRefereeChangeLogs: require('./handlers/admin/getRefereeChangeLogs')
};

// 路由配置
const ROUTES = {
  client: Object.keys(clientHandlers),
  admin: Object.keys(adminHandlers)
};

// HTTP Access Service 响应包装器
function wrapHttpResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    },
    body: JSON.stringify(data)
  };
}

exports.main = async (event, context) => {
  // 检测是否是 HTTP 请求
  const isHttpRequest = 
    (context && context.SOURCE === 'wx_http') || 
    event.httpMethod || 
    event.method ||
    event.body;
  
  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS' || event.method === 'OPTIONS') {
    return wrapHttpResponse({ message: 'OK' });
  }

  // 解析 HTTP 请求 body
  let requestData = event;
  if (event.body && typeof event.body === 'string') {
    try {
      requestData = JSON.parse(event.body);
    } catch (e) {
      return wrapHttpResponse({
        success: false,
        code: 400,
        message: '请求参数格式错误'
      });
    }
  }

  const { action, test_openid } = requestData;
  
  // 获取用户信息
  let OPENID = test_openid; // 测试模式支持
  
  try {
    // ✅ 使用 wx-server-sdk 获取真实的微信 openid
    // ⚠️ login 接口特殊处理：允许 OPENID 为空，因为它会通过 code 换取 openid
    if (!OPENID && action !== 'login') {
      const wxContext = cloud.getWXContext();
      OPENID = wxContext.OPENID;
      
      console.log(`[${action}] ========== 获取微信 openid ==========`);
      console.log(`[${action}] getWXContext 返回:`, {
        OPENID: OPENID || 'undefined',
        OPENID_Last6: OPENID?.slice(-6) || 'undefined',
        APPID: wxContext.APPID?.slice(-6) || 'undefined',
        UNIONID: wxContext.UNIONID?.slice(-6) || 'undefined',
        ENV: wxContext.ENV || 'undefined'
      });
      console.log(`[${action}] 这是真实的微信 openid，将用于用户识别和微信支付`);
      console.log(`[${action}] ======================================`);
      
      // ⚠️ 安全检查：确保 openid 已获取（login 接口除外）
      if (!OPENID) {
        console.error(`[${action}] ❌ 严重错误：未能获取微信 openid`);
        throw new Error('无法获取用户身份信息，请确保从微信小程序环境调用');
      }
    }
    
    // login 接口的特殊日志
    if (action === 'login') {
      console.log(`[${action}] ========== login 接口 ==========`);
      console.log(`[${action}] login 接口不依赖 getWXContext()，将通过 code 换取 openid`);
      console.log(`[${action}] 接收到的参数:`, {
        code_exists: !!requestData.code,
        scene: requestData.scene || 'none'
      });
    }

    console.log(`[${action}] 收到请求:`, { 
      openid: OPENID?.slice(-6) || 'undefined',
      test_mode: !!test_openid
    });

    let result;

    // 客户端接口（需用户登录）
    if (ROUTES.client.includes(action)) {
      // login 接口特殊处理，不需要提前验证，也不传递 OPENID（它会自己通过 code 换取）
      if (action === 'login') {
        result = await clientHandlers[action](requestData, {});
      } else {
        // 其他接口需要验证用户身份
        const user = await checkClientAuth(OPENID);
        result = await clientHandlers[action](requestData, { OPENID, user });
      }
    }
    // 管理端接口（需管理员权限）
    else if (ROUTES.admin.includes(action)) {
      // 支持两种鉴权方式：Web端JWT Token 和 小程序端OPENID
      let admin;
      if (requestData.jwtToken) {
        admin = checkAdminAuthByToken(requestData.jwtToken);
      } else {
        admin = await checkAdminAuth(OPENID);
      }
      result = await adminHandlers[action](requestData, { OPENID, admin });
    } else {
      result = response.paramError(`未知的操作: ${action}`);
    }

    // 如果是 HTTP 请求，包装为 HTTP 响应
    return isHttpRequest ? wrapHttpResponse(result) : result;

  } catch (error) {
    console.error(`[${action}] 执行失败:`, error);
    const errorResult = response.error(error.message, error, error.code || 500);
    return isHttpRequest ? wrapHttpResponse(errorResult) : errorResult;
  }
};
