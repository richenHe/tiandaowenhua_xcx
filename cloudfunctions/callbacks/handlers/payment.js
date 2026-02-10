/**
 * 微信支付回调处理器
 * 处理微信支付结果通知
 */
const crypto = require('crypto');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

/**
 * 微信支付回调处理（支持 Event 和 HTTP 模式）
 * @param {Object} event - 请求事件对象
 * @param {Object} context - 上下文对象
 * @returns {Object} 响应
 */
module.exports = async (event, context) => {
  const isHTTP = context && context.httpContext;

  try {
    console.log('[Payment] 收到支付回调');

    // Event 模式测试
    if (!isHTTP) {
      return {
        success: true,
        code: 0,
        message: '支付回调接口测试成功',
        data: {
          note: '实际使用时需通过 HTTP 访问，接收微信支付的 XML 数据'
        }
      };
    }

    // 解析 XML 数据
    const xmlData = typeof event === 'string' ? event : JSON.stringify(event);
    const result = await parseXML(xmlData, { explicitArray: false });
    const data = result.xml;

    console.log('[Payment] 解析数据:', {
      return_code: data.return_code,
      result_code: data.result_code,
      out_trade_no: data.out_trade_no
    });

    // 验证签名
    const MCH_KEY = process.env.MCH_KEY || '';
    if (!verifySign(data, MCH_KEY)) {
      console.error('[Payment] 签名验证失败');
      return buildXMLResponse('FAIL', '签名验证失败');
    }

    // 检查通信标识
    if (data.return_code !== 'SUCCESS') {
      console.error('[Payment] 通信失败:', data.return_msg);
      return buildXMLResponse('FAIL', '通信失败');
    }

    // 检查业务结果
    if (data.result_code !== 'SUCCESS') {
      console.error('[Payment] 支付失败:', data.err_code, data.err_code_des);
      return buildXMLResponse('SUCCESS', 'OK'); // 通信成功，但业务失败
    }

    // 处理支付成功逻辑
    await handlePaymentSuccess(data);

    // 返回成功响应
    return buildXMLResponse('SUCCESS', 'OK');

  } catch (error) {
    console.error('[Payment] 处理失败:', error);
    return buildXMLResponse('FAIL', '处理失败');
  }
};

/**
 * 验证微信支付签名
 * @param {Object} data - 支付数据
 * @param {string} mchKey - 商户密钥
 * @returns {boolean} 验证结果
 */
function verifySign(data, mchKey) {
  if (!mchKey) {
    console.warn('[Payment] 未配置商户密钥，跳过签名验证');
    return true; // 开发阶段可以跳过验证
  }

  const sign = data.sign;
  delete data.sign;

  // 按 key 排序并拼接参数
  const keys = Object.keys(data).sort();
  const stringA = keys.map(key => `${key}=${data[key]}`).join('&');
  const stringSignTemp = `${stringA}&key=${mchKey}`;

  // MD5 加密并转大写
  const calculatedSign = crypto
    .createHash('md5')
    .update(stringSignTemp, 'utf8')
    .digest('hex')
    .toUpperCase();

  return calculatedSign === sign;
}

/**
 * 处理支付成功逻辑
 * @param {Object} data - 支付数据
 */
async function handlePaymentSuccess(data) {
  const {
    out_trade_no,    // 商户订单号
    transaction_id,  // 微信支付订单号
    total_fee,       // 订单金额（分）
    openid,          // 用户标识
    time_end         // 支付完成时间
  } = data;

  console.log('[Payment] 处理支付成功:', {
    orderNo: out_trade_no,
    transactionId: transaction_id,
    amount: total_fee,
    openid,
    timeEnd: time_end
  });

  try {
    // 引入公共模块和业务逻辑
    const { findOne, update } = require('../common/db');
    const business = require('../business-logic');

    // 1. 查询订单
    const order = await findOne('orders', { order_no: out_trade_no });

    if (!order) {
      console.error('[Payment] 订单不存在:', out_trade_no);
      return;
    }

    // 检查订单是否已支付
    if (order.pay_status === 1) {
      console.warn('[Payment] 订单已支付，避免重复处理:', out_trade_no);
      return;
    }

    // 2. 更新订单状态
    await update('orders', {
      pay_status: 1,
      pay_time: new Date(formatWechatTime(time_end)),
      transaction_id: transaction_id,
      updated_at: new Date()
    }, { id: order.id });

    console.log('[Payment] 订单状态已更新');

    // 3. 生成用户课程记录（如果是课程订单）
    if (order.order_type === 1) {
      await business.generateUserCourseRecord({
        user_id: order.user_id,
        order_id: order.id,
        course_id: order.related_id
      });
      console.log('[Payment] 课程记录已生成');
    }

    // 4. 处理推荐人奖励
    if (order.referee_id) {
      await business.processReferralReward({
        order_id: order.id,
        user_id: order.user_id,
        referee_id: order.referee_id,
        order_amount: order.final_amount
      });
      console.log('[Payment] 推荐人奖励已发放');
    }

    // 5. 发送支付成功通知
    try {
      await business.sendSubscribeMessage({
        touser: openid,
        template_id: 'payment_success_template',
        data: {
          order_no: out_trade_no,
          amount: (total_fee / 100).toFixed(2),
          time: new Date().toLocaleString('zh-CN')
        }
      });
      console.log('[Payment] 支付成功通知已发送');
    } catch (notifyError) {
      console.error('[Payment] 发送通知失败:', notifyError);
      // 通知失败不影响主流程
    }

  } catch (error) {
    console.error('[Payment] 业务处理失败:', error);
    throw error;
  }
}

/**
 * 格式化微信时间
 * @param {string} wechatTime - 微信时间格式（yyyyMMddHHmmss）
 * @returns {string} ISO 时间格式
 */
function formatWechatTime(wechatTime) {
  // 20260210143025 -> 2026-02-10T14:30:25
  const year = wechatTime.substr(0, 4);
  const month = wechatTime.substr(4, 2);
  const day = wechatTime.substr(6, 2);
  const hour = wechatTime.substr(8, 2);
  const minute = wechatTime.substr(10, 2);
  const second = wechatTime.substr(12, 2);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * 构建 XML 响应
 * @param {string} returnCode - 返回状态码
 * @param {string} returnMsg - 返回信息
 * @returns {Object} HTTP 响应
 */
function buildXMLResponse(returnCode, returnMsg) {
  const xml = `<xml>
  <return_code><![CDATA[${returnCode}]]></return_code>
  <return_msg><![CDATA[${returnMsg}]]></return_msg>
</xml>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: xml
  };
}
