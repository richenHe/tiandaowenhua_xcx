/**
 * Course 云函数入口
 * 课程模块 - 39个action + 1个定时任务
 *
 * 认证方式：前端使用 wx.cloud.callFunction()，通过 cloud.getWXContext().OPENID 获取真实 openid
 * 定时任务：每日 0 点自动更新过期排期状态（通过 cloudfunction.json timer trigger 触发）
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const cloudbase = require('@cloudbase/node-sdk');
const { response, checkClientAuth, checkAdminAuth, checkAdminAuthByToken } = require('./common');
const business = require('./business-logic');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });

// 初始化 business-logic（传 wx-server-sdk cloud 实例，wxacode/uploadFile/cloudPay 均需要它）
business.init(cloud);

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

// 导入处理器 - 客户端接口（8个）
const clientHandlers = {
  getClassRecords: require('./handlers/client/getClassRecords'),
  createAppointment: require('./handlers/client/createAppointment'),
  cancelAppointment: require('./handlers/client/cancelAppointment'),
  getMyAppointments: require('./handlers/client/getMyAppointments'),
  checkin: require('./handlers/client/checkin'),
  scanCheckin: require('./handlers/client/scanCheckin'),
  recordAcademyProgress: require('./handlers/client/recordAcademyProgress'),
  getAcademyProgress: require('./handlers/client/getAcademyProgress')
};

// 导入处理器 - 定时任务（由 cloudfunction.json timer trigger 触发）
const autoUpdateScheduleStatus = require('./handlers/admin/autoUpdateScheduleStatus');

// 导入处理器 - 管理端接口（23个）
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
  generateCheckinQRCode: require('./handlers/admin/generateCheckinQRCode'),
  getCheckinQRCodeList: require('./handlers/admin/getCheckinQRCodeList'),
  deleteCheckinQRCode: require('./handlers/admin/deleteCheckinQRCode'),
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
  // 检测是否是定时触发（timer trigger：event 含 Time 字段，且无 action）
  if (event.Time && !event.action) {
    console.log('[Course] 定时触发：自动更新过期排期状态', event.Time);
    return autoUpdateScheduleStatus(event, context);
  }

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
