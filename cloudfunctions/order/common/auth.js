/**
 * 权限验证模块
 * 用于客户端用户身份验证和管理员权限验证
 */

const { findOne } = require('./db');
const jwt = require('jsonwebtoken');

/**
 * 验证客户端用户身份
 * 查询 users 表确认用户存在
 * 
 * @param {string} openid - 用户的 openid（从 cloud.getWXContext() 获取）
 * @returns {Promise<Object>} 用户信息对象
 * @throws {Error} 用户不存在时抛出错误 { code: 401, message: '用户未注册' }
 * 
 * @example
 * const user = await checkClientAuth(OPENID);
 * console.log('当前用户:', user.real_name, '等级:', user.ambassador_level);
 * 
 * // 检查资料是否完善（预览模式限制）
 * if (!user.profile_completed) {
 *   return errorResponse('请先完善个人资料', null, 403);
 * }
 */
async function checkClientAuth(identifier) {
  if (!identifier) {
    const err = new Error('未登录');
    err.code = 401;
    throw err;
  }
  
  // 优先使用 _openid 字段查找 (CloudBase uid)
  let user = await findOne('users', { _openid: identifier });
  
  // 如果找不到，尝试使用 openid 字段查找 (真实微信 openid)
  if (!user) {
    user = await findOne('users', { openid: identifier });
    if (user) {
      console.log(`[checkClientAuth] 用户查找成功（通过 openid 字段）`);
    }
  } else {
    console.log(`[checkClientAuth] 用户查找成功（通过 _openid 字段）`);
  }
  
  if (!user) {
    const err = new Error('用户未注册');
    err.code = 401;
    throw err;
  }
  
  return user;
}

/**
 * 验证管理员权限
 * 查询 admin_users 表确认管理员身份和权限等级
 * 
 * @param {string} openid - 管理员的 openid
 * @param {string} role - 要求的最低角色等级，默认 'admin'。可选值：'admin'、'super_admin'
 * @returns {Promise<Object>} 管理员信息对象
 * @throws {Error} 非管理员或权限不足时抛出错误 { code: 403, message: '权限不足' }
 * 
 * @example
 * // 普通管理员即可
 * const admin = await checkAdminAuth(OPENID);
 * 
 * // 需要超级管理员
 * const superAdmin = await checkAdminAuth(OPENID, 'super_admin');
 */
async function checkAdminAuth(openid, role = 'admin') {
  if (!openid) {
    const err = new Error('未登录');
    err.code = 401;
    throw err;
  }
  
  const admin = await findOne('admin_users', { _openid: openid, status: 1 });
  
  if (!admin) {
    const err = new Error('权限不足');
    err.code = 403;
    throw err;
  }
  
  // 检查角色权限
  if (role === 'super_admin' && admin.role !== 'super_admin') {
    const err = new Error('需要超级管理员权限');
    err.code = 403;
    throw err;
  }
  
  return admin;
}

/**
 * 生成管理员 JWT Token
 * @param {Object} adminInfo - 管理员信息
 * @param {number} adminInfo.id - 管理员ID
 * @param {string} adminInfo.username - 用户名
 * @param {string} adminInfo.role - 角色（superadmin/admin）
 * @returns {string} JWT token
 */
function generateAdminToken(adminInfo) {
  if (!adminInfo || !adminInfo.id || !adminInfo.username) {
    throw new Error('管理员信息不完整');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT密钥未配置或长度不足32位');
  }

  return jwt.sign(
    {
      id: adminInfo.id,
      username: adminInfo.username,
      role: adminInfo.role || 'admin',
      type: 'admin'  // 标识为管理员token
    },
    secret,
    {
      expiresIn: '24h',           // 24小时过期
      issuer: 'tiandao-admin',    // 签发者
      audience: 'admin-panel'     // 接收者
    }
  );
}

/**
 * 验证管理员 JWT Token
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的管理员信息，验证失败返回 null
 */
function verifyAdminToken(token) {
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT密钥未配置');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'tiandao-admin',
      audience: 'admin-panel'
    });

    // 验证token类型
    if (decoded.type !== 'admin') {
      console.error('Token类型错误');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token已过期:', error.expiredAt);
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Token无效:', error.message);
    } else {
      console.error('Token验证失败:', error);
    }
    return null;
  }
}

/**
 * 检查管理员权限（基于JWT Token）
 * @param {string} token - JWT token
 * @param {string} requiredRole - 需要的角色（可选，默认只验证登录状态）
 * @returns {Object} 管理员信息
 * @throws {Error} 验证失败时抛出错误
 */
function checkAdminAuthByToken(token, requiredRole = null) {
  const adminInfo = verifyAdminToken(token);

  if (!adminInfo) {
    const err = new Error('未登录或登录已过期');
    err.code = 401;
    throw err;
  }

  // 检查角色权限（如果指定了 requiredRole）
  if (requiredRole && adminInfo.role !== requiredRole && adminInfo.role !== 'superadmin') {
    const err = new Error('权限不足');
    err.code = 403;
    throw err;
  }

  return adminInfo;
}

module.exports = {
  checkClientAuth,
  checkAdminAuth,
  generateAdminToken,
  verifyAdminToken,
  checkAdminAuthByToken
};

