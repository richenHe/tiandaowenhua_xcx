/**
 * Callbacks HTTP 云函数入口
 * 统一处理第三方回调接口（微信消息推送、支付回调、退款回调）
 */
const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });

// 导入回调处理器
const messagePushHandler = require('./handlers/message-push');
const paymentHandler = require('./handlers/payment');
const refundHandler = require('./handlers/refund');

/**
 * 云函数主入口（支持 Event 和 HTTP 模式）
 * @param {Object} event - 请求事件对象
 * @param {Object} context - 上下文对象
 * @returns {Object} 响应
 */
exports.main = async (event, context) => {
  try {
    // 判断是 HTTP 请求还是 Event 请求
    // HTTP 访问服务可能通过 Event 模式调用，HTTP 信息在 event.path 中
    const isHTTP = (context && context.httpContext) || (event && event.path);
    
    let requestPath = '';
    let httpMethod = 'GET';

    if (context && context.httpContext) {
      // 标准 HTTP 云函数模式
      requestPath = context.httpContext.url || '';
      httpMethod = context.httpContext.httpMethod || 'GET';
    } else if (event && event.path) {
      // HTTP 访问服务通过 Event 模式调用
      requestPath = event.path || '';
      httpMethod = event.httpMethod || event.method || 'GET';
    }

    if (isHTTP && requestPath) {
      // HTTP 请求模式
      console.log('[Callbacks] 收到 HTTP 请求:', {
        path: requestPath,
        method: httpMethod,
        timestamp: new Date().toISOString()
      });

      // 路由分发：根据 URL 路径分发到不同的处理器
      if (requestPath.includes('/message-push')) {
        return await messagePushHandler(event, context);
      }

      if (requestPath.includes('/payment')) {
        return await paymentHandler(event, context);
      }

      if (requestPath.includes('/refund')) {
        return await refundHandler(event, context);
      }

      // 未匹配的路径
      console.warn('[Callbacks] 未知路径:', requestPath);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 404,
          message: 'Not Found'
        })
      };
    } else {
      // Event 模式（用于测试）
      const { action } = event;

      console.log('[Callbacks] 收到 Event 请求:', {
        action,
        timestamp: new Date().toISOString()
      });

      // 根据 action 分发
      if (action === 'message-push') {
        return await messagePushHandler(event, context);
      }

      if (action === 'payment') {
        return await paymentHandler(event, context);
      }

      if (action === 'refund') {
        return await refundHandler(event, context);
      }

      return {
        success: false,
        code: 400,
        message: `未知的操作: ${action || '未提供 action 参数'}`
      };
    }

  } catch (error) {
    console.error('[Callbacks] 处理失败:', error);
    
    // 根据模式返回不同格式
    if (context && context.httpContext) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal Server Error'
      };
    } else {
      return {
        success: false,
        code: 500,
        message: error.message
      };
    }
  }
};
