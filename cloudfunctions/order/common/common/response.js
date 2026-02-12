/**
 * 云函数统一响应格式
 */

/**
 * 成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {Object}
 */
function success(data = null, message = '操作成功') {
  return {
    success: true,
    code: 0,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * 失败响应
 * @param {string} message - 错误消息
 * @param {any} error - 原始错误对象
 * @param {number} code - 错误码
 * @returns {Object}
 */
function error(message = '操作失败', error = null, code = -1) {
  return {
    success: false,
    code,
    message,
    error: error ? (error.message || String(error)) : null,
    timestamp: Date.now()
  };
}

/**
 * 参数错误响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function paramError(message = '参数错误') {
  return error(message, null, 400);
}

/**
 * 未授权响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function unauthorized(message = '未授权访问') {
  return error(message, null, 401);
}

/**
 * 禁止访问响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function forbidden(message = '禁止访问') {
  return error(message, null, 403);
}

/**
 * 资源不存在响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function notFound(message = '资源不存在') {
  return error(message, null, 404);
}

// 别名：兼容 common-utils 规范
const successResponse = success;
const errorResponse = error;

module.exports = {
  success,
  error,
  paramError,
  unauthorized,
  forbidden,
  notFound,
  // 别名导出
  successResponse,
  errorResponse
};




