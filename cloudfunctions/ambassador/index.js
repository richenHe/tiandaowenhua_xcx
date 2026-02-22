/**
 * 大使模块云函数入口
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response, checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');
const business = require('./business-logic');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

// ⚠️ 必须初始化 business-logic
business.init(app);

// 导入处理器
const clientHandlers = {
  apply: require('./handlers/client/apply'),
  getApplicationStatus: require('./handlers/client/getApplicationStatus'),
  upgrade: require('./handlers/client/upgrade'),
  getUpgradeGuide: require('./handlers/client/getUpgradeGuide'),
  generateQRCode: require('./handlers/client/generateQRCode'),
  getMyQuotas: require('./handlers/client/getMyQuotas'),
  giftQuota: require('./handlers/client/giftQuota'),
  getContractTemplate: require('./handlers/client/getContractTemplate'),
  signContract: require('./handlers/client/signContract'),
  getMyContracts: require('./handlers/client/getMyContracts'),
  getContractDetail: require('./handlers/client/getContractDetail'),
  getActivityRecords: require('./handlers/client/getActivityRecords'),
  getActivityStats: require('./handlers/client/getActivityStats'),
  getLevelSystem: require('./handlers/client/getLevelSystem')
};

const adminHandlers = {
  getApplicationList: require('./handlers/admin/getApplicationList'),
  auditApplication: require('./handlers/admin/auditApplication'),
  getApplicationDetail: require('./handlers/admin/getApplicationDetail'),
  getAmbassadorList: require('./handlers/admin/getAmbassadorList'),
  getAmbassadorDetail: require('./handlers/admin/getAmbassadorDetail'),
  updateAmbassadorLevel: require('./handlers/admin/updateAmbassadorLevel'),
  adjustPoints: require('./handlers/admin/adjustPoints'),
  createActivity: require('./handlers/admin/createActivity'),
  getActivityList: require('./handlers/admin/getActivityList'),
  getActivityDetail: require('./handlers/admin/getActivityDetail'),
  updateActivity: require('./handlers/admin/updateActivity'),
  deleteActivity: require('./handlers/admin/deleteActivity'),
  auditActivity: require('./handlers/admin/auditActivity'),
  createContractTemplate: require('./handlers/admin/createContractTemplate'),
  updateContractTemplate: require('./handlers/admin/updateContractTemplate'),
  deleteContractTemplate: require('./handlers/admin/deleteContractTemplate'),
  getContractTemplateList: require('./handlers/admin/getContractTemplateList'),
  getContractList: require('./handlers/admin/getContractList'),
  getContractVersions: require('./handlers/admin/getContractVersions'),
  getSignatureList: require('./handlers/admin/getSignatureList'),
  getExpiringContracts: require('./handlers/admin/getExpiringContracts')
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
  let OPENID = test_openid;
  
  // 使用 CloudBase Node SDK 的标准方式获取当前调用者身份
  if (!OPENID) {
    const userInfo = auth.getUserInfo();
    if (userInfo && userInfo.openId) {
      OPENID = userInfo.openId;
    } else if (userInfo && userInfo.uid) {
      OPENID = userInfo.uid;
    } else if (userInfo && userInfo.customUserId) {
      OPENID = userInfo.customUserId;
    }
  }

  console.log(`[${action}] 收到请求:`, { openid: OPENID?.slice(-6) || 'undefined' });

  try {
    let result;

    // 客户端接口（需用户鉴权）
    if (ROUTES.client.includes(action)) {
      const user = await checkClientAuth(OPENID);
      result = await clientHandlers[action](requestData, { OPENID, user });
    }
    // 管理端接口（需管理员鉴权）
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
