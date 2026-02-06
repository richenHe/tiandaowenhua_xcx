/**
 * 测试云函数
 * 用于验证云函数环境是否正常工作
 */

const cloudbase = require('@cloudbase/node-sdk');
const { db, response, utils } = require('common');

// 初始化 CloudBase
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

/**
 * 云函数入口
 * @param {Object} event - 触发事件
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    console.log('收到请求:', event);
    
    const { action } = event;
    
    // 获取用户 openid
    const { OPENID } = cloudbase.getCloudbaseContext(context);
    
    if (!OPENID) {
      return response.unauthorized('用户未登录');
    }
    
    // 根据 action 分发处理
    switch (action) {
      case 'ping':
        return handlePing(event, OPENID);
        
      case 'testDB':
        return await handleTestDB(event, OPENID);
        
      case 'testAuth':
        return await handleTestAuth(event, OPENID);
        
      default:
        return response.paramError(`未知的操作: ${action}`);
    }
    
  } catch (error) {
    console.error('云函数执行失败:', error);
    return response.error(error.message || '服务器内部错误');
  }
};

/**
 * Ping 测试 - 验证云函数基本功能
 */
function handlePing(event, openid) {
  return response.success({
    message: 'pong',
    openid,
    timestamp: utils.formatDateTime(new Date()),
    env: process.env.TCB_ENV || 'unknown'
  }, '云函数运行正常');
}

/**
 * 数据库连接测试
 */
async function handleTestDB(event, openid) {
  try {
    // 测试查询
    const result = await db.query('SELECT DATABASE() as current_db, NOW() as current_time');
    
    // 测试用户表查询（验证 _openid 权限）
    const userCount = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE _openid = ?',
      [openid]
    );
    
    return response.success({
      database: result[0].current_db,
      serverTime: result[0].current_time,
      userRecords: userCount[0].count,
      openid
    }, '数据库连接正常');
    
  } catch (error) {
    console.error('数据库测试失败:', error);
    return response.error(`数据库测试失败: ${error.message}`);
  }
}

/**
 * 用户认证测试
 */
async function handleTestAuth(event, openid) {
  try {
    // 查询用户信息
    const users = await db.query(
      'SELECT id, username, real_name, phone, user_type, ambassador_level FROM users WHERE _openid = ? AND is_deleted = 0',
      [openid]
    );
    
    if (users.length === 0) {
      return response.notFound('用户信息不存在');
    }
    
    const user = users[0];
    
    // 脱敏处理
    if (user.phone) {
      user.phone = utils.maskPhone(user.phone);
    }
    
    return response.success({
      user,
      openid
    }, '用户认证正常');
    
  } catch (error) {
    console.error('认证测试失败:', error);
    return response.error(`认证测试失败: ${error.message}`);
  }
}


