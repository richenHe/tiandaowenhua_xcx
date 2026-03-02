/**
 * 错误处理工具
 * 统一处理支付回调中的各种异常情况
 */

/**
 * 记录错误日志到数据库
 * @param {Object} errorInfo - 错误信息
 * @param {string} errorInfo.type - 错误类型
 * @param {string} errorInfo.order_no - 订单号
 * @param {string} errorInfo.message - 错误消息
 * @param {Object} errorInfo.details - 错误详情
 */
async function logError(errorInfo) {
  try {
    const { getDb } = require('../common/db');
    const db = getDb();

    await db.from('payment_error_logs').insert({
      error_type: errorInfo.type,
      order_no: errorInfo.order_no,
      error_message: errorInfo.message,
      error_details: JSON.stringify(errorInfo.details || {}),
      created_at: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ')
    });

    console.log('[ErrorHandler] 错误日志已记录:', errorInfo.type);
  } catch (logError) {
    // 记录日志失败不影响主流程
    console.error('[ErrorHandler] 记录错误日志失败:', logError);
  }
}

/**
 * 处理订单不存在错误
 * @param {string} orderNo - 订单号
 */
async function handleOrderNotFound(orderNo) {
  console.error('[ErrorHandler] 订单不存在:', orderNo);

  await logError({
    type: 'ORDER_NOT_FOUND',
    order_no: orderNo,
    message: '订单不存在',
    details: { orderNo }
  });
}

/**
 * 处理推荐人不存在错误
 * @param {string} orderNo - 订单号
 * @param {number} refereeId - 推荐人ID
 */
async function handleRefereeNotFound(orderNo, refereeId) {
  console.warn('[ErrorHandler] 推荐人不存在:', refereeId);

  await logError({
    type: 'REFEREE_NOT_FOUND',
    order_no: orderNo,
    message: '推荐人不存在',
    details: { refereeId }
  });

  // 更新订单标记
  try {
    const { getDb } = require('../common/db');
    const db = getDb();

    await db.from('orders').update({
      is_reward_granted: false,
      reward_granted_at: null,
      remark: '推荐人不存在，未发放奖励'
    }).eq('order_no', orderNo);
  } catch (updateError) {
    console.error('[ErrorHandler] 更新订单标记失败:', updateError);
  }
}

/**
 * 处理配置缺失错误
 * @param {string} orderNo - 订单号
 * @param {number} level - 等级
 */
async function handleConfigNotFound(orderNo, level) {
  console.error('[ErrorHandler] 等级配置不存在:', level);

  await logError({
    type: 'CONFIG_NOT_FOUND',
    order_no: orderNo,
    message: '等级配置不存在',
    details: { level }
  });
}

/**
 * 处理课程不存在错误
 * @param {string} orderNo - 订单号
 * @param {number} courseId - 课程ID
 */
async function handleCourseNotFound(orderNo, courseId) {
  console.error('[ErrorHandler] 课程不存在:', courseId);

  await logError({
    type: 'COURSE_NOT_FOUND',
    order_no: orderNo,
    message: '课程不存在',
    details: { courseId }
  });
}

/**
 * 处理数据库操作失败
 * @param {string} orderNo - 订单号
 * @param {string} operation - 操作名称
 * @param {Error} error - 错误对象
 */
async function handleDatabaseError(orderNo, operation, error) {
  console.error(`[ErrorHandler] 数据库操作失败 [${operation}]:`, error);

  await logError({
    type: 'DATABASE_ERROR',
    order_no: orderNo,
    message: `数据库操作失败: ${operation}`,
    details: {
      operation,
      error: error.message,
      stack: error.stack
    }
  });
}

/**
 * 处理业务逻辑错误
 * @param {string} orderNo - 订单号
 * @param {string} businessType - 业务类型
 * @param {Error} error - 错误对象
 */
async function handleBusinessError(orderNo, businessType, error) {
  console.error(`[ErrorHandler] 业务逻辑错误 [${businessType}]:`, error);

  await logError({
    type: 'BUSINESS_ERROR',
    order_no: orderNo,
    message: `业务逻辑错误: ${businessType}`,
    details: {
      businessType,
      error: error.message,
      stack: error.stack
    }
  });
}

/**
 * 包装异步函数，自动捕获错误
 * @param {Function} fn - 异步函数
 * @param {string} orderNo - 订单号
 * @param {string} operation - 操作名称
 * @returns {Function} 包装后的函数
 */
function wrapAsync(fn, orderNo, operation) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleBusinessError(orderNo, operation, error);
      throw error;
    }
  };
}

/**
 * 重试机制
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise<any>} 函数执行结果
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[ErrorHandler] 重试 ${i + 1}/${maxRetries}:`, error.message);

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * 检查订单状态是否允许处理
 * @param {Object} order - 订单对象
 * @returns {Object} { valid: boolean, message: string }
 */
function validateOrderStatus(order) {
  if (!order) {
    return { valid: false, message: '订单不存在' };
  }

  if (order.pay_status === 1) {
    return { valid: false, message: '订单已支付，避免重复处理' };
  }

  if (order.pay_status === 2) {
    return { valid: false, message: '订单已取消' };
  }

  if (order.pay_status === 3) {
    return { valid: false, message: '订单已关闭' };
  }

  if (order.pay_status === 4) {
    return { valid: false, message: '订单已退款' };
  }

  return { valid: true, message: 'OK' };
}

/**
 * 发送错误通知（可选：发送给管理员）
 * @param {Object} errorInfo - 错误信息
 */
async function notifyError(errorInfo) {
  // TODO: 实现错误通知功能
  // 可以通过企业微信、邮件等方式通知管理员
  console.log('[ErrorHandler] 错误通知:', errorInfo);
}

module.exports = {
  logError,
  handleOrderNotFound,
  handleRefereeNotFound,
  handleConfigNotFound,
  handleCourseNotFound,
  handleDatabaseError,
  handleBusinessError,
  wrapAsync,
  retry,
  validateOrderStatus,
  notifyError
};
