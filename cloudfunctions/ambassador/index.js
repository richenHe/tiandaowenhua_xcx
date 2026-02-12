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
  getAmbassadorList: require('./handlers/admin/getAmbassadorList'),
  getAmbassadorDetail: require('./handlers/admin/getAmbassadorDetail'),
  createActivity: require('./handlers/admin/createActivity'),
  getActivityList: require('./handlers/admin/getActivityList'),
  updateActivity: require('./handlers/admin/updateActivity'),
  deleteActivity: require('./handlers/admin/deleteActivity'),
  createContractTemplate: require('./handlers/admin/createContractTemplate'),
  updateContractTemplate: require('./handlers/admin/updateContractTemplate'),
  deleteContractTemplate: require('./handlers/admin/deleteContractTemplate'),
  getContractTemplateList: require('./handlers/admin/getContractTemplateList'),
  getContractVersions: require('./handlers/admin/getContractVersions'),
  getSignatureList: require('./handlers/admin/getSignatureList'),
  getExpiringContracts: require('./handlers/admin/getExpiringContracts')
};

// 路由配置
const ROUTES = {
  client: Object.keys(clientHandlers),
  admin: Object.keys(adminHandlers)
};

exports.main = async (event, context) => {
  const { action, test_openid } = event;
  
  // 获取用户信息
  let OPENID = test_openid; // 测试模式支持
  
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
    // 客户端接口（需用户鉴权）
    if (ROUTES.client.includes(action)) {
      const user = await checkClientAuth(OPENID);
      return await clientHandlers[action](event, { OPENID, user });
    }

    // 管理端接口（需管理员鉴权）
    if (ROUTES.admin.includes(action)) {
      // 支持两种鉴权方式：Web端JWT Token 和 小程序端OPENID
      let admin;
      if (event.jwtToken) {
        admin = checkAdminAuthByToken(event.jwtToken);
      } else {
        admin = await checkAdminAuth(OPENID);
      }
      return await adminHandlers[action](event, { OPENID, admin });
    }

    return response.paramError(`未知的操作: ${action}`);

  } catch (error) {
    console.error(`[${action}] 执行失败:`, error);
    return response.error(error.message, error, error.code || 500);
  }
};
