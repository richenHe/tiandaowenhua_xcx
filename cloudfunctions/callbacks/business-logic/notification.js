/**
 * 消息通知封装模块
 *
 * 实现方式：通过 HTTP API 直接调用微信接口，避免 wx-server-sdk openapi
 * 权限配置问题（-501001 invalid wx openapi access_token）。
 * 
 * 注意事项：
 *   1. 用户需要在小程序端授权订阅消息后才能接收
 *   2. 一次性订阅消息仅可发送一次，需要用户每次重新授权
 *   3. 模板 ID 需在微信公众平台配置
 *   4. 数据字段的 key 须与模板配置一致（如 thing1, time2 等）
 */

const https = require('https');

// cloud 实例由初始化时注入（保留兼容性，实际不再使用）
let _cloud = null;

/**
 * 初始化消息通知模块（需在层加载时调用）
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例
 */
function initNotification(cloud) {
  _cloud = cloud;
}

/**
 * 发送 HTTPS GET/POST 请求（Promise 封装）
 */
function httpsRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyBuffer = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: bodyBuffer ? {
        'Content-Type': 'application/json',
        'Content-Length': bodyBuffer.length
      } : {}
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (!data) {
          reject(new Error(`HTTP ${res.statusCode} 响应为空，url=${url.split('?')[0]}`));
          return;
        }
        try { resolve(JSON.parse(data)); } catch (e) {
          reject(new Error(`JSON解析失败(${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', (err) => reject(new Error(`HTTP请求失败: ${err.message}`)));
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

/**
 * 获取微信 access_token（使用 APPID + AppSecret）
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    throw new Error('未配置 WECHAT_APPID 或 WECHAT_APP_SECRET 环境变量');
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  const result = await httpsRequest(url);
  if (!result.access_token) {
    throw new Error(`获取 access_token 失败: ${JSON.stringify(result)}`);
  }
  return result.access_token;
}

/**
 * 发送微信订阅消息
 * 
 * @param {string} openid - 接收者 openid
 * @param {string} templateId - 消息模板 ID
 * @param {Object} data - 模板数据（key-value 格式，value 为 { value: '...' } 形式）
 * @param {string} page - 点击消息跳转的页面路径（可选）
 * @returns {Promise<Object>} 发送结果 { errcode, errmsg }
 * 
 * @example
 * await sendSubscribeMessage(
 *   user.openid,
 *   'TEMPLATE_ID_001',
 *   {
 *     thing1: { value: '初探班第10期' },
 *     time2: { value: '2024-01-20 09:00' },
 *     thing3: { value: '深圳市南山区xxx' },
 *     thing4: { value: '请准时参加' }
 *   },
 *   'pages/appointment/detail/index?id=123'
 * );
 */
async function sendSubscribeMessage(openid, templateId, data, page = '') {
  if (!openid || !templateId || !data) {
    throw new Error('缺少必要的消息参数：openid, templateId, data');
  }

  try {
    const accessToken = await getAccessToken();

    const body = {
      touser: openid,
      template_id: templateId,
      data: data
    };

    if (page) {
      body.page = page;
    }

    // miniprogram_state: developer=开发版 / trial=体验版 / formal=正式版（默认）
    // 通过环境变量 MINIPROGRAM_STATE 控制，未配置时默认 formal
    const mpState = process.env.MINIPROGRAM_STATE || 'formal';
    if (mpState !== 'formal') {
      body.miniprogram_state = mpState;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    const result = await httpsRequest(url, 'POST', body);

    if (result.errcode !== 0) {
      console.warn('订阅消息发送失败:', { openid, templateId, errcode: result.errcode, errmsg: result.errmsg });
    }

    return {
      errcode: result.errcode || 0,
      errmsg: result.errmsg || 'ok'
    };
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    // 消息发送失败不应影响主业务流程，返回错误信息但不抛出异常
    return {
      errcode: -1,
      errmsg: error.message
    };
  }
}

/**
 * 批量发送订阅消息（用于通知多个用户）
 * 
 * @param {Array<Object>} messages - 消息数组
 * @param {string} messages[].openid - 接收者 openid
 * @param {string} messages[].templateId - 消息模板 ID
 * @param {Object} messages[].data - 模板数据
 * @param {string} messages[].page - 跳转页面路径（可选）
 * @returns {Promise<Object>} 批量发送结果 { total, success, failed, results }
 */
async function batchSendSubscribeMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  const results = [];
  let success = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      const result = await sendSubscribeMessage(
        msg.openid,
        msg.templateId,
        msg.data,
        msg.page || ''
      );

      const isSuccess = result.errcode === 0;
      if (isSuccess) {
        success++;
      } else {
        failed++;
      }

      results.push({
        openid: msg.openid,
        success: isSuccess,
        errcode: result.errcode,
        errmsg: result.errmsg
      });
    } catch (error) {
      failed++;
      results.push({
        openid: msg.openid,
        success: false,
        errcode: -1,
        errmsg: error.message
      });
    }
  }

  return {
    total: messages.length,
    success,
    failed,
    results
  };
}

/**
 * 发送支付成功通知
 * 
 * @param {string} openid - 接收者 openid
 * @param {Object} orderInfo - 订单信息
 * @param {string} orderInfo.orderNo - 订单号
 * @param {number} orderInfo.amount - 支付金额
 * @param {string} orderInfo.courseName - 课程名称
 * @param {string} templateId - 模板 ID（从配置中获取）
 * @returns {Promise<Object>} 发送结果
 */
async function sendPaymentSuccessNotice(openid, orderInfo, templateId) {
  const { formatDateTime } = require('common');

  return sendSubscribeMessage(
    openid,
    templateId,
    {
      character_string1: { value: orderInfo.orderNo },           // 订单号
      amount2: { value: `${orderInfo.amount}元` },               // 支付金额
      thing3: { value: truncateValue(orderInfo.courseName, 20) }, // 商品名称
      time4: { value: formatDateTime(new Date()) },              // 支付时间
      thing5: { value: '支付成功，感谢您的购买' }                  // 备注
    },
    `pages/order/detail/index?orderNo=${orderInfo.orderNo}`
  );
}

/**
 * 发送升级成功通知
 * 
 * @param {string} openid - 接收者 openid
 * @param {string} levelName - 升级后等级名称
 * @param {string} templateId - 模板 ID
 * @returns {Promise<Object>} 发送结果
 */
async function sendUpgradeSuccessNotice(openid, levelName, templateId) {
  const { formatDateTime } = require('common');

  return sendSubscribeMessage(
    openid,
    templateId,
    {
      thing1: { value: '大使等级升级成功' },
      time2: { value: formatDateTime(new Date()) },
      thing3: { value: `恭喜您成为${levelName}` }
    },
    'pages/ambassador/center/index'
  );
}

/**
 * 截断字符串值（微信订阅消息字段有长度限制）
 * @param {string} value - 原始值
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
function truncateValue(value, maxLength = 20) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength - 1) + '…';
}

module.exports = {
  initNotification,
  sendSubscribeMessage,
  batchSendSubscribeMessage,
  sendPaymentSuccessNotice,
  sendUpgradeSuccessNotice
};

