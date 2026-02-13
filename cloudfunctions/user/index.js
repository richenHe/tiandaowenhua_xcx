/**
 * User 云函数入口
 * 用户模块 - 17个action
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('./common');
const { checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

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
    // ✅ 使用 CloudBase Node SDK 获取当前调用者身份（CloudBase uid）
    // 说明：前端使用 @cloudbase/js-sdk 调用，auth.getUserInfo() 返回 CloudBase 用户标识
    // 这个标识用于数据库中 _openid 字段的用户识别
    // 真实的微信 openid 在 login 接口通过 code2session 获取，保存在 openid 字段
    if (!OPENID) {
      const userInfo = auth.getUserInfo();
      if (userInfo && userInfo.openId) {
        OPENID = userInfo.openId;
      } else if (userInfo && userInfo.uid) {
        OPENID = userInfo.uid;
      } else if (userInfo && userInfo.customUserId) {
        OPENID = userInfo.customUserId;
      }
      
      console.log(`[${action}] auth.getUserInfo 返回:`, {
        openId_last6: userInfo?.openId?.slice(-6) || 'N/A',
        uid_last6: userInfo?.uid?.slice(-6) || 'N/A',
        customUserId: userInfo?.customUserId || 'N/A',
        OPENID_last6: OPENID?.slice(-6) || 'undefined'
      });
    }

    console.log(`[${action}] 收到请求:`, { 
      openid_last6: OPENID?.slice(-6) || 'undefined',
      test_mode: !!test_openid
    });

    let result;

    // 客户端接口（需用户登录）
    if (ROUTES.client.includes(action)) {
      // login 接口特殊处理：不需要提前验证，但传递 OPENID（CloudBase uid）
      if (action === 'login') {
        result = await clientHandlers[action](requestData, { OPENID });
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
