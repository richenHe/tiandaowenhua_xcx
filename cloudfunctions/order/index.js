/**
 * Order 云函数入口
 * 订单模块 - 14个action
 */
const cloudbase = require('@cloudbase/node-sdk');
const cloud = require('wx-server-sdk');
const { response, checkClientAuth, checkAdminAuth } = require('./common');
const business = require('./business-logic');

// 初始化 @cloudbase/node-sdk (用于认证)
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

// 初始化 wx-server-sdk (用于微信支付)
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 初始化 business-logic 层
business.init(cloud);

// 导入处理器
const publicHandlers = {
  paymentCallback: require('./handlers/public/paymentCallback')
};

const clientHandlers = {
  create: require('./handlers/client/create'),
  createPayment: require('./handlers/client/createPayment'),
  getDetail: require('./handlers/client/getDetail'),
  getList: require('./handlers/client/getList'),
  cancel: require('./handlers/client/cancel'),
  getMallGoods: require('./handlers/client/getMallGoods'),
  getMallCourses: require('./handlers/client/getMallCourses'),
  exchangeGoods: require('./handlers/client/exchangeGoods'),
  getExchangeRecords: require('./handlers/client/getExchangeRecords')
};

const adminHandlers = {
  getOrderList: require('./handlers/admin/getOrderList'),
  getOrderDetail: require('./handlers/admin/getOrderDetail'),
  refund: require('./handlers/admin/refund'),
  withdrawAudit: require('./handlers/admin/withdrawAudit')
};

// 路由配置
const ROUTES = {
  public: Object.keys(publicHandlers),
  client: Object.keys(clientHandlers),
  admin: Object.keys(adminHandlers)
};

exports.main = async (event, context) => {
  const { action, test_openid } = event;
  let OPENID = test_openid;

  try {
    // 获取用户身份
    if (!OPENID) {
      const userInfo = auth.getUserInfo(); // Synchronous method
      if (userInfo && userInfo.openId) {
        OPENID = userInfo.openId;
      } else if (userInfo && userInfo.uid) {
        OPENID = userInfo.uid;
      } else if (userInfo && userInfo.customUserId) {
        OPENID = userInfo.customUserId;
      }
      console.log(`[${action}] getUserInfo 返回:`, {
        openId: userInfo?.openId?.slice(-6),
        uid: userInfo?.uid?.slice(-6),
        customUserId: userInfo?.customUserId
      });
    }

    console.log(`[${action}] 收到请求:`, {
      openid: OPENID?.slice(-6) || 'undefined',
      test_mode: !!test_openid
    });

    // 公开接口（无需登录）
    if (ROUTES.public.includes(action)) {
      return await publicHandlers[action](event, { OPENID });
    }

    // 客户端接口（需用户鉴权）
    if (ROUTES.client.includes(action)) {
      const user = await checkClientAuth(OPENID);
      return await clientHandlers[action](event, { OPENID, user });
    }

    // 管理端接口（需管理员鉴权）
    if (ROUTES.admin.includes(action)) {
      const admin = await checkAdminAuth(OPENID);
      return await adminHandlers[action](event, { OPENID, admin });
    }

    return response.paramError(`未知的操作: ${action}`);

  } catch (error) {
    console.error(`[${action}] 执行失败:`, error);
    return response.error(error.message, error, error.code || 500);
  }
};
