/**
 * 云函数工具函数
 */

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
 * @returns {Object} { offset, limit }
 */
function getPagination(page = 1, pageSize = 10) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
  
  return {
    offset: (p - 1) * ps,
    limit: ps
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

module.exports = {
  validateRequired,
  getPagination,
  formatDateTime,
  randomString,
  maskPhone
};


