/**
 * User 云函数入口
 * 用户模块 - 23个action（客户端14 + 管理端14，含表现分与黑名单6个、用户课程管理2个）
 *
 * 认证方式：前端使用 wx.cloud.callFunction()，通过 cloud.getWXContext().OPENID 获取真实 openid
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { response } = require('./common');
const { checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');

// 导入客户端处理器
const clientHandlers = {
  login: require('./handlers/client/login'),
  getProfile: require('./handlers/client/getProfile'),
  updateProfile: require('./handlers/client/updateProfile'),
  getRefereeInfo: require('./handlers/client/getRefereeInfo'),
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
  getRefereeChangeLogs: require('./handlers/admin/getRefereeChangeLogs'),
  getUserRefereeInfo: require('./handlers/admin/getUserRefereeInfo'),
  createUser: require('./handlers/admin/createUser'),
  addPerformanceScore: require('./handlers/admin/addPerformanceScore'),
  deductPerformanceScore: require('./handlers/admin/deductPerformanceScore'),
  getEvaluationList: require('./handlers/admin/getEvaluationList'),
  setBlacklist: require('./handlers/admin/setBlacklist'),
  removeBlacklist: require('./handlers/admin/removeBlacklist'),
  updateBlacklistConfig: require('./handlers/admin/updateBlacklistConfig'),
  getUserCourseList: require('./handlers/admin/getUserCourseList'),
  adminAddUserCourse: require('./handlers/admin/adminAddUserCourse'),
  adminExtendUserCourse: require('./handlers/admin/adminExtendUserCourse'),
  getUserListForReferee: require('./handlers/admin/getUserListForReferee'),
  getUserRefereeTree: require('./handlers/admin/getUserRefereeTree')
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
  
  // 获取用户标识：wx.cloud.callFunction() 调用时，通过 wx-server-sdk 获取微信真实 openid
  let OPENID = test_openid || cloud.getWXContext().OPENID;

  console.log(`[${action}] 收到请求:`, { 
    openid_last6: OPENID?.slice(-6) || 'undefined',
    test_mode: !!test_openid
  });

  try {

    let result;

    // 客户端接口（需用户登录）
    if (ROUTES.client.includes(action)) {
      // login 接口特殊处理：不需要提前验证，直接传递 OPENID
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
