/**
 * System 云函数入口
 * 系统管理模块：管理员登录、系统配置、统计、反馈、通知、公告
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response, checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');
const business = require('./business-logic');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

// 初始化 business-logic (传入 app 而不是 cloud)
business.init(app);

// 导入公开接口处理器（无需登录）
const publicHandlers = {
  getAnnouncementList: require('./handlers/client/getAnnouncementList'),
  getBannerList: require('./handlers/public/getBannerList')
};

// 导入客户端处理器
const clientHandlers = {
  getFeedbackCourses: require('./handlers/client/getFeedbackCourses'),
  getFeedbackTypes: require('./handlers/client/getFeedbackTypes'),
  submitFeedback: require('./handlers/client/submitFeedback'),
  getMyFeedback: require('./handlers/client/getMyFeedback'),
  getNotificationConfigs: require('./handlers/client/getNotificationConfigs'),
  subscribeNotification: require('./handlers/client/subscribeNotification'),
  getUserPoints: require('./handlers/client/getUserPoints'),
  getSystemConfig: require('./handlers/client/getSystemConfig'),
  getAnnouncementDetail: require('./handlers/client/getAnnouncementDetail'),
  uploadFile: require('./handlers/client/uploadFile')
};

// 导入管理端处理器
const adminHandlers = {
  login: require('./handlers/admin/login'),
  getConfig: require('./handlers/admin/getConfig'),
  updateConfig: require('./handlers/admin/updateConfig'),
  getAmbassadorLevelConfigs: require('./handlers/admin/getAmbassadorLevelConfigs'),
  updateAmbassadorLevelConfig: require('./handlers/admin/updateAmbassadorLevelConfig'),
  initAmbassadorLevelConfigs: require('./handlers/admin/initAmbassadorLevelConfigs'),
  getStatistics: require('./handlers/admin/getStatistics'),
  getFeedbackList: require('./handlers/admin/getFeedbackList'),
  replyFeedback: require('./handlers/admin/replyFeedback'),
  createNotificationConfig: require('./handlers/admin/createNotificationConfig'),
  updateNotificationConfig: require('./handlers/admin/updateNotificationConfig'),
  getNotificationConfigList: require('./handlers/admin/getNotificationConfigList'),
  getNotificationLogs: require('./handlers/admin/getNotificationLogs'),
  sendNotification: require('./handlers/admin/sendNotification'),
  createAnnouncement: require('./handlers/admin/createAnnouncement'),
  updateAnnouncement: require('./handlers/admin/updateAnnouncement'),
  deleteAnnouncement: require('./handlers/admin/deleteAnnouncement'),
  getAnnouncementList: require('./handlers/admin/getAnnouncementList'),
  createAdminUser: require('./handlers/admin/createAdminUser'),
  updateAdminUser: require('./handlers/admin/updateAdminUser'),
  deleteAdminUser: require('./handlers/admin/deleteAdminUser'),
  getAdminUserList: require('./handlers/admin/getAdminUserList')
};

// 路由配置
const ROUTES = {
  public: Object.keys(publicHandlers),
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
  // 检测是否是 HTTP 请求（检测多种可能的方式）
  const isHttpRequest = 
    (context && context.SOURCE === 'wx_http') || 
    event.httpMethod || 
    event.method ||
    event.body; // 如果有 body 字段，很可能是 HTTP 请求
  
  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS' || event.method === 'OPTIONS') {
    return wrapHttpResponse({ message: 'OK' });
  }

  // 解析 HTTP 请求 body（如果 body 是字符串）
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
  
  // 使用 CloudBase Node SDK 的标准方式获取当前调用者身份
  if (!OPENID) {
    const userInfo = auth.getUserInfo();  // 同步方法，直接返回结果
    if (userInfo && userInfo.openId) {
      OPENID = userInfo.openId;
    } else if (userInfo && userInfo.uid) {
      OPENID = userInfo.uid;
    } else if (userInfo && userInfo.customUserId) {
      OPENID = userInfo.customUserId;
    }
  }


  try {
    let result;

    // 公开接口（无需登录）
    if (ROUTES.public.includes(action)) {
      result = await publicHandlers[action](requestData, { OPENID });
    }
    // 客户端接口（需用户鉴权）
    else if (ROUTES.client.includes(action)) {
      const user = await checkClientAuth(OPENID);
      result = await clientHandlers[action](requestData, { OPENID, user });
    }
    // 管理端接口（需管理员鉴权）
    else if (ROUTES.admin.includes(action)) {
      // login 接口特殊处理，不需要提前验证
      if (action === 'login') {
        result = await adminHandlers[action](requestData, { OPENID });
      } else {
        // 支持两种鉴权方式：
        // 1. Web端：通过 jwtToken 鉴权（推荐）
        // 2. 小程序端：通过 OPENID 鉴权（保留兼容）
        let admin;
        if (requestData.jwtToken) {
          // Web管理后台：JWT Token 鉴权
          admin = checkAdminAuthByToken(requestData.jwtToken);
        } else {
          // 小程序管理端：OPENID 鉴权
          admin = await checkAdminAuth(OPENID);
        }
        
        result = await adminHandlers[action](requestData, { OPENID, admin });
      }
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
