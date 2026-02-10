/**
 * 云函数工具函数
 */

const crypto = require('crypto');

/**
 * 验证必填参数
 * @param {Object} data - 数据对象
 * @param {Array<string>} requiredFields - 必填字段数组
 * @returns {string|null} 错误消息，如果验证通过返回 null
 */
function validateRequired(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0) {
      return `缺少必填参数: ${field}`;
    }
  }
  return null;
}

/**
 * 分页参数处理
 * @param {number} page - 页码（从 1 开始）
 * @param {number} pageSize - 每页数量
 * @returns {Object} { offset, limit, page, pageSize }
 */
function getPagination(page = 1, pageSize = 20) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  
  return {
    offset: (p - 1) * ps,
    limit: ps,
    page: p,
    pageSize: ps
  };
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期对象或时间戳
 * @returns {string} YYYY-MM-DD HH:mm:ss
 */
function formatDateTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @returns {string}
 */
function randomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 手机号脱敏
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 格式是否正确
 */
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 生成唯一的订单号
 * @param {string} prefix - 前缀，默认 'ORD'
 * @returns {string} 唯一订单号，格式 {prefix}{YYYYMMDD}{随机数}
 */
function generateOrderNo(prefix = 'ORD') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}${month}${day}`;
  const random = String(Math.floor(Math.random() * 10000000000)).padStart(10, '0');
  return `${prefix}${date}${random}`;
}

/**
 * 生成随机字母数字混合码
 * @param {number} length - 长度，默认 6
 * @returns {string} 随机码（大写字母 + 数字）
 */
function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的字符
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 密码加密（使用 PBKDF2 + 随机盐）
 * @param {string} password - 明文密码
 * @param {number} iterations - 迭代次数（默认10000）
 * @returns {string} 加密后的密码（格式：hash:salt:iterations）
 */
function hashPassword(password, iterations = 10000) {
  if (!password || password.length < 6) {
    throw new Error('密码长度至少6位');
  }

  // 生成16字节随机盐
  const salt = crypto.randomBytes(16).toString('hex');

  // 使用 PBKDF2 派生密钥
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    iterations,    // 迭代次数
    64,           // 输出长度（字节）
    'sha512'      // 哈希算法
  ).toString('hex');

  // 返回格式：哈希值:盐值:迭代次数
  return `${hash}:${salt}:${iterations}`;
}

/**
 * 验证密码
 * @param {string} password - 待验证的明文密码
 * @param {string} hashedPassword - 存储的加密密码（格式：hash:salt:iterations）
 * @returns {boolean} 密码是否匹配
 */
function verifyPassword(password, hashedPassword) {
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    // 解析存储的密码
    const [hash, salt, iterations] = hashedPassword.split(':');
    const iterationCount = parseInt(iterations) || 10000;

    // 使用相同的盐和迭代次数重新计算哈希
    const verifyHash = crypto.pbkdf2Sync(
      password,
      salt,
      iterationCount,
      64,
      'sha512'
    ).toString('hex');

    // 使用时间安全的比较函数（防止时序攻击）
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(verifyHash)
    );
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}

/**
 * 生成随机密码
 * @param {number} length - 密码长度（默认12）
 * @returns {string} 随机密码
 */
function generateRandomPassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

module.exports = {
  validateRequired,
  getPagination,
  formatDateTime,
  randomString,
  maskPhone,
  validatePhone,
  generateOrderNo,
  generateCode,
  hashPassword,
  verifyPassword,
  generateRandomPassword
};




