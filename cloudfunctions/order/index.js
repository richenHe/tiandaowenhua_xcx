/**
 * Order 云函数入口
 * 订单模块 - 14个action
 *
 * 认证方式：前端使用 wx.cloud.callFunction()，微信运行时自动注入真实 openid 到 context.OPENID
 */
const cloud = require('wx-server-sdk');
const { response, checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');
const business = require('./business-logic');

// 初始化 wx-server-sdk (用于微信支付等微信 API)
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 初始化 business-logic 层
business.init(cloud);

// 导入处理器
const publicHandlers = {
  paymentCallback: require('./handlers/public/paymentCallback'),
  testSimulatePayment: require('./handlers/public/testSimulatePayment') // ⚠️ 测试专用
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
  exchangeCourse: require('./handlers/client/exchangeCourse'),
  cancelExchange: require('./handlers/client/cancelExchange'),
  getExchangeRecords: require('./handlers/client/getExchangeRecords'),
  requestRefund: require('./handlers/client/requestRefund'),
  getRefundStatus: require('./handlers/client/getRefundStatus')
};

const adminHandlers = {
  getOrderList: require('./handlers/admin/getOrderList'),
  getOrderDetail: require('./handlers/admin/getOrderDetail'),
  getRefundList: require('./handlers/admin/getRefundList'),
  refund: require('./handlers/admin/refund'),
  rejectRefund: require('./handlers/admin/rejectRefund'),
  markRefundTransferred: require('./handlers/admin/markRefundTransferred'),
  getWithdrawList: require('./handlers/admin/getWithdrawList'),
  withdrawAudit: require('./handlers/admin/withdrawAudit'),
  markWithdrawTransferred: require('./handlers/admin/markWithdrawTransferred'),
  getMallGoodsList: require('./handlers/admin/getMallGoodsList'),
  createMallGoods: require('./handlers/admin/createMallGoods'),
  updateMallGoods: require('./handlers/admin/updateMallGoods'),
  deleteMallGoods: require('./handlers/admin/deleteMallGoods'),
  getExchangeList: require('./handlers/admin/getExchangeList'),
  confirmPickup: require('./handlers/admin/confirmPickup')
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
    openid: OPENID?.slice(-6) || 'undefined',
    test_mode: !!test_openid
  });

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
