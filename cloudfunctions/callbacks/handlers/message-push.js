/**
 * 微信消息推送回调处理器
 * 处理微信服务器推送的订阅消息事件
 */
const crypto = require('crypto');

/**
 * 微信消息推送回调处理（支持 Event 和 HTTP 模式）
 * @param {Object} event - 请求事件对象
 * @param {Object} context - 上下文对象
 * @returns {Object} 响应
 */
module.exports = async (event, context) => {
  const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'tiandao_wechat_2026';
  
  // 判断 HTTP 模式：支持 context.httpContext 或 event.path
  const isHTTP = (context && context.httpContext) || (event && event.path);
  
  // 获取 HTTP 方法
  let httpMethod = 'GET';
  if (context && context.httpContext) {
    httpMethod = context.httpContext.httpMethod || 'GET';
  } else if (event && event.path) {
    httpMethod = event.httpMethod || event.method || 'GET';
  }

  try {
    if (isHTTP) {
      // HTTP 模式
      // GET 请求：接入验证
      if (httpMethod === 'GET') {
        // 从 event.queryStringParameters 或 event.query 获取参数
        const query = event.queryStringParameters || event.query || {};
        return handleVerification(query, WECHAT_TOKEN);
      }

      // POST 请求：接收消息推送
      if (httpMethod === 'POST') {
        return await handleMessage(event, context);
      }

      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          code: 405,
          message: 'Method Not Allowed'
        })
      };
    } else {
      // Event 模式（用于测试）
      console.log('[MessagePush] Event 模式测试');
      
      // 模拟 GET 请求验证
      if (event.signature && event.echostr) {
        const result = handleVerification(event, WECHAT_TOKEN);
        return {
          success: true,
          code: 0,
          message: '接入验证测试',
          data: result
        };
      }

      // 模拟 POST 请求
      return {
        success: true,
        code: 0,
        message: '消息推送接口测试成功',
        data: {
          note: '实际使用时需通过 HTTP 访问'
        }
      };
    }

  } catch (error) {
    console.error('[MessagePush] 处理失败:', error);
    
    if (isHTTP) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'success'
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

/**
 * 处理微信接入验证（GET 请求）
 * @param {Object} event - 请求事件对象
 * @param {string} token - 微信 Token
 * @returns {Object} HTTP 响应
 */
function handleVerification(event, token) {
  const { signature, timestamp, nonce, echostr } = event;

  console.log('[MessagePush] 接入验证:', { signature, timestamp, nonce, echostr });

  // 验证签名
  if (!signature || !timestamp || !nonce || !echostr) {
    console.error('[MessagePush] 缺少必要参数');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Bad Request'
    };
  }

  // 计算签名
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');

  // 验证签名
  if (sha1 === signature) {
    console.log('[MessagePush] 验证成功');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: echostr
    };
  } else {
    console.error('[MessagePush] 签名验证失败');
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Forbidden'
    };
  }
}

/**
 * 处理微信消息推送（POST 请求）
 * @param {Object} event - 请求事件对象
 * @param {Object} context - 上下文对象
 * @returns {Object} HTTP 响应
 */
async function handleMessage(event, context) {
  try {
    console.log('[MessagePush] 收到消息:', JSON.stringify(event));

    // 解析消息内容
    const message = event;

    // 处理不同类型的消息
    if (message.MsgType === 'event') {
      await handleEvent(message);
    }

    // 微信要求必须返回 "success" 字符串
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'success'
    };

  } catch (error) {
    console.error('[MessagePush] 消息处理失败:', error);
    // 即使出错也返回 success，避免微信重复推送
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'success'
    };
  }
}

/**
 * 处理事件消息
 * @param {Object} message - 消息对象
 */
async function handleEvent(message) {
  const { Event } = message;

  console.log('[MessagePush] 处理事件:', Event);

  switch (Event) {
    case 'subscribe_msg_sent_event':
      // 订阅消息发送成功
      await handleSubscribeMsgSent(message);
      break;

    case 'subscribe_msg_popup_event':
      // 用户拒绝订阅
      await handleSubscribeMsgPopup(message);
      break;

    default:
      console.log('[MessagePush] 未处理的事件类型:', Event);
  }
}

/**
 * 处理订阅消息发送事件
 * @param {Object} message - 消息对象
 */
async function handleSubscribeMsgSent(message) {
  const { SubscribeMsgSentEvent } = message;

  if (!SubscribeMsgSentEvent || !SubscribeMsgSentEvent.List) {
    return;
  }

  for (const item of SubscribeMsgSentEvent.List) {
    const { TemplateId, MsgId, ErrorCode, ErrorStatus } = item;

    console.log('[MessagePush] 订阅消息发送结果:', {
      templateId: TemplateId,
      msgId: MsgId,
      errorCode: ErrorCode,
      errorStatus: ErrorStatus
    });

    // TODO: 更新数据库中的消息发送状态
    // 可以在 notification_logs 表中记录发送结果
  }
}

/**
 * 处理用户拒绝订阅事件
 * @param {Object} message - 消息对象
 */
async function handleSubscribeMsgPopup(message) {
  const { SubscribeMsgPopupEvent } = message;

  if (!SubscribeMsgPopupEvent || !SubscribeMsgPopupEvent.List) {
    return;
  }

  for (const item of SubscribeMsgPopupEvent.List) {
    const { TemplateId, SubscribeStatusString, PopupScene } = item;

    console.log('[MessagePush] 用户订阅状态:', {
      templateId: TemplateId,
      status: SubscribeStatusString,
      scene: PopupScene
    });

    // TODO: 记录用户的订阅偏好
    // 可以在 notification_configs 表中更新用户的订阅状态
  }
}
