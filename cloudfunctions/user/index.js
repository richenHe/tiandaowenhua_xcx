/**
 * User 云函数入口
 * 用户模块 - 17个action
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('./common');
const { checkClientAuth, checkAdminAuth } = require('./common');

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

exports.main = async (event, context) => {
  const { action, test_openid } = event;
  
  // 获取用户信息
  let OPENID = test_openid; // 测试模式支持
  
  try {
    // 使用 CloudBase Node SDK 的标准方式获取当前调用者身份
    if (!OPENID) {
      const userInfo = auth.getUserInfo();  // 同步方法，直接返回结果
      if (userInfo && userInfo.openId) {
        OPENID = userInfo.openId;  // 使用 openId 作为 OPENID
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

    // 客户端接口（需用户登录）
    if (ROUTES.client.includes(action)) {
      // login 接口特殊处理，不需要提前验证
      if (action === 'login') {
        return await clientHandlers[action](event, { OPENID });
      }

      // 其他接口需要验证用户身份
      const user = await checkClientAuth(OPENID);
      return await clientHandlers[action](event, { OPENID, user });
    }

    // 管理端接口（需管理员权限）
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
