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
    code: 0,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * 失败响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误码
 * @param {any} data - 附加数据
 * @returns {Object}
 */
function error(message = '操作失败', code = -1, data = null) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * 参数错误响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function paramError(message = '参数错误') {
  return error(message, 400);
}

/**
 * 未授权响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function unauthorized(message = '未授权访问') {
  return error(message, 401);
}

/**
 * 禁止访问响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function forbidden(message = '禁止访问') {
  return error(message, 403);
}

/**
 * 资源不存在响应
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function notFound(message = '资源不存在') {
  return error(message, 404);
}

module.exports = {
  success,
  error,
  paramError,
  unauthorized,
  forbidden,
  notFound
};


