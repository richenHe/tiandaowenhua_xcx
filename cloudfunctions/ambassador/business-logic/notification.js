/**
 * 消息通知封装模块
 * 基于 wx-server-sdk 的 cloud.openapi.subscribeMessage.send 实现订阅消息发送
 * 
 * 注意事项：
 *   1. 用户需要在小程序端授权订阅消息后才能接收
 *   2. 一次性订阅消息仅可发送一次，需要用户每次重新授权
 *   3. 模板 ID 需在微信公众平台配置
 *   4. 数据字段的 key 须与模板配置一致（如 thing1, time2 等）
 */

// cloud 实例由初始化时注入
let _cloud = null;

/**
 * 初始化消息通知模块（需在层加载时调用）
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例
 */
function initNotification(cloud) {
  _cloud = cloud;
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
 * // 发送上课提醒
 * await sendSubscribeMessage(
 *   user.openid,
 *   'TEMPLATE_ID_001',
 *   {
 *     thing1: { value: '初探班第10期' },       // 课程名称
 *     time2: { value: '2024-01-20 09:00' },    // 上课时间
 *     thing3: { value: '深圳市南山区xxx' },     // 上课地点
 *     thing4: { value: '请准时参加' }           // 备注
 *   },
 *   'pages/appointment/detail/index?id=123'
 * );
 */
async function sendSubscribeMessage(openid, templateId, data, page = '') {
  if (!_cloud) {
    throw new Error('消息通知模块未初始化，请先调用 initNotification(cloud)');
  }

  if (!openid || !templateId || !data) {
    throw new Error('缺少必要的消息参数：openid, templateId, data');
  }

  try {
    const params = {
      touser: openid,
      templateId: templateId,
      data: data
    };

    // 仅在有页面路径时添加 page 参数
    if (page) {
      params.page = page;
    }

    const result = await _cloud.openapi.subscribeMessage.send(params);

    if (result.errCode !== 0 && result.errcode !== 0) {
      console.warn('订阅消息发送失败:', {
        openid,
        templateId,
        errCode: result.errCode || result.errcode,
        errMsg: result.errMsg || result.errmsg
      });
    }

    return {
      errcode: result.errCode || result.errcode || 0,
      errmsg: result.errMsg || result.errmsg || 'ok'
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

