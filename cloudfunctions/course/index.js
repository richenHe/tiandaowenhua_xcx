/**
 * Course 云函数入口
 * 课程模块 - 35个action
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response, checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');
const business = require('./business-logic');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const auth = app.auth();

// 初始化 business-logic
business.init(app);

// 导入处理器 - 公开接口（8个）
const publicHandlers = {
  getList: require('./handlers/public/getList'),
  getDetail: require('./handlers/public/getDetail'),
  getCaseList: require('./handlers/public/getCaseList'),
  getCaseDetail: require('./handlers/public/getCaseDetail'),
  getMaterialList: require('./handlers/public/getMaterialList'),
  getAcademyList: require('./handlers/public/getAcademyList'),
  getAcademyDetail: require('./handlers/public/getAcademyDetail'),
  getCalendarSchedule: require('./handlers/public/getCalendarSchedule')
};

// 导入处理器 - 客户端接口（7个）
const clientHandlers = {
  getClassRecords: require('./handlers/client/getClassRecords'),
  createAppointment: require('./handlers/client/createAppointment'),
  cancelAppointment: require('./handlers/client/cancelAppointment'),
  getMyAppointments: require('./handlers/client/getMyAppointments'),
  checkin: require('./handlers/client/checkin'),
  recordAcademyProgress: require('./handlers/client/recordAcademyProgress'),
  getAcademyProgress: require('./handlers/client/getAcademyProgress')
};

// 导入处理器 - 管理端接口（20个）
const adminHandlers = {
  createCourse: require('./handlers/admin/createCourse'),
  updateCourse: require('./handlers/admin/updateCourse'),
  deleteCourse: require('./handlers/admin/deleteCourse'),
  getCourseList: require('./handlers/admin/getCourseList'),
  createClassRecord: require('./handlers/admin/createClassRecord'),
  updateClassRecord: require('./handlers/admin/updateClassRecord'),
  deleteClassRecord: require('./handlers/admin/deleteClassRecord'),
  getClassRecordList: require('./handlers/admin/getClassRecordList'),
  getAppointmentList: require('./handlers/admin/getAppointmentList'),
  updateAppointmentStatus: require('./handlers/admin/updateAppointmentStatus'),
  batchCheckin: require('./handlers/admin/batchCheckin'),
  createCase: require('./handlers/admin/createCase'),
  updateCase: require('./handlers/admin/updateCase'),
  deleteCase: require('./handlers/admin/deleteCase'),
  getCaseList: require('./handlers/admin/getCaseList'),
  createMaterial: require('./handlers/admin/createMaterial'),
  updateMaterial: require('./handlers/admin/updateMaterial'),
  deleteMaterial: require('./handlers/admin/deleteMaterial'),
  getMaterialList: require('./handlers/admin/getMaterialList'),
  manageAcademyContent: require('./handlers/admin/manageAcademyContent')
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

  console.log(`[Course/${action}] 收到请求:`, { openid: OPENID?.slice(-6) || 'undefined' });

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
    console.error(`[Course/${action}] 执行失败:`, error);
    const errorResult = response.error(error.message, error, error.code || 500);
    return isHttpRequest ? wrapHttpResponse(errorResult) : errorResult;
  }
};
