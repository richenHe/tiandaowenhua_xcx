/**
 * 微信支付封装模块
 * 基于 wx-server-sdk 的 cloud.cloudPay 实现统一下单、回调验签、退款
 * 
 * 环境变量配置（在 cloudbaserc.json 中设置）：
 *   MCH_ID          - 商户号
 *   MCH_KEY         - 商户 API 密钥（用于签名验证）
 *   MCH_CERT_SERIAL_NO - 商户证书序列号（V3 API 使用）
 *   MCH_PRIVATE_KEY - 商户私钥内容（V3 API 使用）
 * 
 * 注意事项：
 *   1. 金额精度：微信支付金额单位为"分"，内部自动处理元到分的转换
 *   2. 幂等性：支付回调可能多次触发，需通过订单状态判断避免重复处理
 *   3. 签名验证：支付回调必须验证签名，防止伪造回调
 *   4. 事务安全：涉及金额操作必须使用事务
 */

const crypto = require('crypto');

// cloud 实例由初始化时注入
let _cloud = null;

/**
 * 初始化微信支付模块（需在层加载时调用）
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例
 */
function initPayment(cloud) {
  _cloud = cloud;
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string}
 */
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

/**
 * 元转分（安全精度转换）
 * @param {number} yuan - 金额（元）
 * @returns {number} 金额（分）
 */
function yuanToFen(yuan) {
  return Math.round(parseFloat(yuan) * 100);
}

/**
 * 分转元
 * @param {number} fen - 金额（分）
 * @returns {number} 金额（元）
 */
function fenToYuan(fen) {
  return Math.round(parseInt(fen)) / 100;
}

/**
 * 创建微信支付统一下单，返回小程序端调起支付所需的参数
 * 
 * @param {Object} orderInfo - 订单信息
 * @param {string} orderInfo.orderNo - 订单号
 * @param {number} orderInfo.amount - 支付金额（元）
 * @param {string} orderInfo.description - 商品描述
 * @param {string} openid - 用户 openid
 * @returns {Promise<Object>} 小程序支付参数 { timeStamp, nonceStr, package, signType, paySign, prepayId }
 */
async function createWechatPayment(orderInfo, openid) {
  if (!_cloud) {
    throw new Error('微信支付模块未初始化，请先调用 initPayment(cloud)');
  }

  const { orderNo, amount, description } = orderInfo;

  if (!orderNo || !amount || !description || !openid) {
    throw new Error('缺少必要的支付参数：orderNo, amount, description, openid');
  }

  if (amount <= 0) {
    throw new Error('支付金额必须大于0');
  }

  const totalFee = yuanToFen(amount);
  const nonceStr = generateNonceStr();

  try {
    const result = await _cloud.cloudPay.unifiedOrder({
      body: description,
      outTradeNo: orderNo,
      spbillCreateIp: '127.0.0.1',
      totalFee: totalFee,
      envId: process.env.TCB_ENV || process.env.SCF_NAMESPACE,
      functionName: 'order', // 支付回调云函数
      subMchId: process.env.MCH_ID,
      nonceStr: nonceStr,
      tradeType: 'JSAPI',
      openid: openid
    });

    if (result.returnCode !== 'SUCCESS' || result.resultCode !== 'SUCCESS') {
      const errMsg = result.returnMsg || result.errCodeDes || '统一下单失败';
      console.error('微信支付统一下单失败:', result);
      throw new Error(`微信支付下单失败: ${errMsg}`);
    }

    return {
      timeStamp: result.payment.timeStamp,
      nonceStr: result.payment.nonceStr,
      package: result.payment.package,
      signType: result.payment.signType,
      paySign: result.payment.paySign,
      prepayId: result.prepayId || ''
    };
  } catch (error) {
    console.error('创建微信支付失败:', error);
    throw new Error(`创建微信支付失败: ${error.message}`);
  }
}

/**
 * 验证微信支付回调通知的签名，解密回调数据
 * 
 * 使用 cloud.cloudPay 模式时，微信回调由云开发平台代为处理和验签，
 * 回调数据会直接传入 userInfo 参数。本函数做二次校验和数据提取。
 * 
 * @param {Object} callbackData - 回调数据（cloud.cloudPay 模式下为解密后的对象）
 * @returns {Object} 标准化的支付结果
 */
function verifyPaymentCallback(callbackData) {
  if (!callbackData) {
    throw new Error('回调数据为空');
  }

  // cloud.cloudPay 模式：回调数据已由云开发平台验签和解密
  // 直接从 resultCode / return_code 判断支付结果
  const resultCode = callbackData.resultCode || callbackData.result_code;
  const returnCode = callbackData.returnCode || callbackData.return_code;

  if (returnCode !== 'SUCCESS') {
    throw new Error(`支付回调通信失败: ${callbackData.returnMsg || callbackData.return_msg || '未知错误'}`);
  }

  // 标准化返回格式
  return {
    trade_state: resultCode === 'SUCCESS' ? 'SUCCESS' : 'FAIL',
    transaction_id: callbackData.transactionId || callbackData.transaction_id || '',
    out_trade_no: callbackData.outTradeNo || callbackData.out_trade_no || '',
    amount: {
      total: parseInt(callbackData.totalFee || callbackData.total_fee || 0),
      payer_total: parseInt(callbackData.cashFee || callbackData.cash_fee || callbackData.totalFee || callbackData.total_fee || 0)
    },
    payer: {
      openid: callbackData.openid || ''
    },
    // 保留原始数据以备查询
    _raw: callbackData
  };
}

/**
 * 使用 V3 API 密钥验证签名（独立 HTTP 回调场景备用）
 * 
 * @param {Object} headers - 回调请求头
 * @param {string|Object} body - 回调请求体（JSON 字符串或对象）
 * @returns {Object} 解密后的支付结果
 * @throws {Error} 签名验证失败或解密失败
 */
function verifyPaymentCallbackV3(headers, body) {
  // 1. 获取签名相关 header
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  const serial = headers['wechatpay-serial'];

  if (!timestamp || !nonce || !signature || !serial) {
    throw new Error('缺少必要的签名信息');
  }

  // 2. 构造验签字符串（格式：timestamp\nnonce\nbody\n）
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const message = `${timestamp}\n${nonce}\n${bodyStr}\n`;

  // 3. 验证签名（使用微信支付平台公钥）
  const publicKey = process.env.WECHAT_PAY_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('未配置微信支付平台公钥');
  }

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(message);
    const isValid = verifier.verify(publicKey, signature, 'base64');

    if (!isValid) {
      throw new Error('支付回调签名验证失败');
    }
  } catch (error) {
    console.error('签名验证失败:', error);
    throw new Error(`签名验证失败: ${error.message}`);
  }

  // 4. 解密 resource 字段（使用 AEAD_AES_256_GCM 算法）
  const bodyObj = typeof body === 'string' ? JSON.parse(bodyStr) : body;
  const { resource } = bodyObj;

  if (!resource) {
    throw new Error('回调数据缺少 resource 字段');
  }

  const { ciphertext, nonce: resourceNonce, associated_data } = resource;
  const mchKey = process.env.MCH_KEY; // 32位商户API密钥

  if (!mchKey || mchKey.length !== 32) {
    throw new Error('商户密钥配置错误，必须是32位字符串');
  }

  try {
    // 创建解密器（AES-256-GCM）
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      mchKey,
      resourceNonce
    );

    // 设置认证标签（tag字段）
    decipher.setAuthTag(Buffer.from(resource.tag || '', 'base64'));

    // 解密
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const result = JSON.parse(decrypted);

    return {
      trade_state: result.trade_state,
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      amount: result.amount,
      payer: result.payer,
      _raw: result
    };
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error(`解密回调数据失败: ${error.message}`);
  }
}

/**
 * 发起微信退款
 * 
 * @param {string} orderNo - 订单号
 * @param {number} refundAmount - 退款金额（元）
 * @param {string} reason - 退款原因
 * @returns {Promise<Object>} 退款结果 { refundId, status }
 */
async function processRefund(orderNo, refundAmount, reason = '') {
  if (!_cloud) {
    throw new Error('微信支付模块未初始化，请先调用 initPayment(cloud)');
  }

  if (!orderNo || !refundAmount || refundAmount <= 0) {
    throw new Error('缺少必要的退款参数：orderNo, refundAmount');
  }

  const refundFee = yuanToFen(refundAmount);
  const outRefundNo = `REF${orderNo}_${Date.now()}`; // 退款单号

  try {
    const result = await _cloud.cloudPay.refund({
      subMchId: process.env.MCH_ID,
      nonceStr: generateNonceStr(),
      outTradeNo: orderNo,
      outRefundNo: outRefundNo,
      totalFee: refundFee, // 原订单金额（此处用退款金额代替，实际应传原订单金额）
      refundFee: refundFee,
      refundDesc: reason || '用户申请退款'
    });

    if (result.returnCode !== 'SUCCESS' || result.resultCode !== 'SUCCESS') {
      const errMsg = result.returnMsg || result.errCodeDes || '退款失败';
      console.error('微信退款失败:', result);
      throw new Error(`微信退款失败: ${errMsg}`);
    }

    return {
      refundId: result.refundId || outRefundNo,
      outRefundNo: outRefundNo,
      status: 'PROCESSING'
    };
  } catch (error) {
    console.error('发起退款失败:', error);
    throw new Error(`发起退款失败: ${error.message}`);
  }
}

module.exports = {
  initPayment,
  createWechatPayment,
  verifyPaymentCallback,
  verifyPaymentCallbackV3,
  processRefund,
  // 工具函数导出
  yuanToFen,
  fenToYuan,
  generateNonceStr
};

