/**
 * 微信支付 V3 API 封装
 * 基于微信支付官方文档实现：https://pay.weixin.qq.com/doc/v3/
 * 
 * 功能：
 * 1. JSAPI 统一下单（小程序支付）
 * 2. 生成小程序调起支付参数
 * 3. 请求签名生成（Authorization header）
 * 4. 应答签名验证（支付回调）
 * 
 * 环境变量配置：
 * - WECHAT_APPID: 小程序 AppID
 * - MCH_ID: 商户号
 * - MCH_CERT_SERIAL_NO: 商户 API 证书序列号
 * - MCH_PRIVATE_KEY: 商户 API 私钥（PEM 格式）
 */

const crypto = require('crypto');
const https = require('https');

// 微信支付 V3 API 基础地址
const WECHAT_PAY_API_BASE = 'https://api.mch.weixin.qq.com';

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
 * 生成请求签名（用于 Authorization header）
 * 签名算法：SHA256withRSA
 * 
 * @param {string} method - HTTP 方法（GET/POST/PUT）
 * @param {string} url - 请求路径（不包含域名），例如：/v3/pay/transactions/jsapi
 * @param {number} timestamp - 时间戳（秒）
 * @param {string} nonceStr - 随机字符串
 * @param {string} body - 请求体（JSON 字符串），GET 请求传空字符串
 * @returns {string} Base64 编码的签名
 */
function generateSignature(method, url, timestamp, nonceStr, body) {
  // 构造签名串格式：
  // HTTP请求方法\n
  // URL\n
  // 请求时间戳\n
  // 请求随机串\n
  // 请求报文主体\n
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  
  const privateKey = process.env.MCH_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('未配置商户私钥 MCH_PRIVATE_KEY');
  }

  // 使用 SHA256withRSA 签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const signature = sign.sign(privateKey, 'base64');
  
  return signature;
}

/**
 * 生成 Authorization header
 * 格式：WECHATPAY2-SHA256-RSA2048 mchid="xxx",nonce_str="xxx",signature="xxx",timestamp="xxx",serial_no="xxx"
 * 
 * @param {string} method - HTTP 方法
 * @param {string} url - 请求路径
 * @param {string} body - 请求体（JSON 字符串）
 * @returns {string} Authorization header 值
 */
function buildAuthorizationHeader(method, url, body) {
  const mchid = process.env.MCH_ID;
  const serialNo = process.env.MCH_CERT_SERIAL_NO;
  
  if (!mchid || !serialNo) {
    throw new Error('未配置商户号或证书序列号');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = generateNonceStr(32);
  const signature = generateSignature(method, url, timestamp, nonceStr, body);

  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
}

/**
 * 发送微信支付 V3 API 请求
 * 
 * @param {string} method - HTTP 方法
 * @param {string} url - 请求路径（不包含域名）
 * @param {Object} data - 请求数据（会转为 JSON）
 * @returns {Promise<Object>} 响应数据
 */
function sendWechatPayRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const authorization = buildAuthorizationHeader(method, url, body);

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
        'User-Agent': 'CloudBase-WechatPay/1.0'
      }
    };

    const req = https.request(`${WECHAT_PAY_API_BASE}${url}`, options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            // 微信支付错误响应
            reject(new Error(`微信支付API错误: ${result.code || 'UNKNOWN'} - ${result.message || responseBody}`));
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}, 响应内容: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * JSAPI 统一下单（小程序支付）
 * API 文档：https://pay.weixin.qq.com/doc/v3/merchant/4012791856
 * 
 * @param {Object} orderInfo - 订单信息
 * @param {string} orderInfo.orderNo - 商户订单号
 * @param {number} orderInfo.amount - 支付金额（元）
 * @param {string} orderInfo.description - 商品描述
 * @param {string} orderInfo.notifyUrl - 支付回调地址
 * @param {string} orderInfo.openid - 用户 openid
 * @returns {Promise<string>} prepay_id（预支付交易会话标识）
 */
async function createJsapiOrder(orderInfo) {
  const { orderNo, amount, description, notifyUrl, openid } = orderInfo;

  if (!orderNo || !amount || !description || !openid) {
    throw new Error('缺少必要的支付参数：orderNo, amount, description, openid');
  }

  if (amount <= 0) {
    throw new Error('支付金额必须大于0');
  }

  const appid = process.env.WECHAT_APPID;
  const mchid = process.env.MCH_ID;

  if (!appid || !mchid) {
    throw new Error('未配置小程序 AppID 或商户号');
  }

  // 构造请求参数
  const requestData = {
    appid: appid,
    mchid: mchid,
    description: description,
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    amount: {
      total: yuanToFen(amount),
      currency: 'CNY'
    },
    payer: {
      openid: openid
    },
    scene_info: {
      payer_client_ip: '127.0.0.1'
    }
  };

  console.log('[微信支付V3] 统一下单请求:', {
    orderNo,
    amount: `${amount}元 (${yuanToFen(amount)}分)`,
    openid,
    description
  });

  try {
    // 调用微信支付统一下单 API
    const result = await sendWechatPayRequest('POST', '/v3/pay/transactions/jsapi', requestData);
    
    if (!result.prepay_id) {
      throw new Error('统一下单成功但未返回 prepay_id');
    }

    console.log('[微信支付V3] 统一下单成功:', { prepay_id: result.prepay_id });
    return result.prepay_id;
    
  } catch (error) {
    console.error('[微信支付V3] 统一下单失败:', error);
    throw error;
  }
}

/**
 * 生成小程序调起支付参数
 * 文档：https://pay.weixin.qq.com/doc/v3/merchant/4012791898
 * 
 * @param {string} prepayId - 预支付交易会话标识
 * @returns {Object} 小程序支付参数 { timeStamp, nonceStr, package, signType, paySign }
 */
function generateMiniProgramPaymentParams(prepayId) {
  const appid = process.env.WECHAT_APPID;
  if (!appid) {
    throw new Error('未配置小程序 AppID');
  }

  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr(32);
  const packageStr = `prepay_id=${prepayId}`;
  const signType = 'RSA';

  // 构造签名串格式：
  // 应用ID\n
  // 时间戳\n
  // 随机字符串\n
  // 扩展字符串（package）\n
  const message = `${appid}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;

  const privateKey = process.env.MCH_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('未配置商户私钥 MCH_PRIVATE_KEY');
  }

  // 使用 SHA256withRSA 签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const paySign = sign.sign(privateKey, 'base64');

  console.log('[微信支付V3] 生成小程序支付参数成功');

  return {
    timeStamp: timeStamp,
    nonceStr: nonceStr,
    package: packageStr,
    signType: signType,
    paySign: paySign
  };
}

/**
 * 创建微信支付（完整流程）
 * 1. 调用统一下单接口获取 prepay_id
 * 2. 生成小程序调起支付参数
 * 
 * @param {Object} orderInfo - 订单信息
 * @param {string} orderInfo.orderNo - 商户订单号
 * @param {number} orderInfo.amount - 支付金额（元）
 * @param {string} orderInfo.description - 商品描述
 * @param {string} orderInfo.notifyUrl - 支付回调地址
 * @param {string} orderInfo.openid - 用户 openid
 * @returns {Promise<Object>} 小程序支付参数
 */
async function createWechatPayment(orderInfo) {
  try {
    // 1. 统一下单
    const prepayId = await createJsapiOrder(orderInfo);

    // 2. 生成小程序支付参数
    const paymentParams = generateMiniProgramPaymentParams(prepayId);

    return {
      ...paymentParams,
      prepay_id: prepayId
    };
  } catch (error) {
    console.error('[微信支付V3] 创建支付失败:', error);
    throw new Error(`创建微信支付失败: ${error.message}`);
  }
}

/**
 * 验证支付回调签名
 * 文档：https://pay.weixin.qq.com/doc/v3/merchant/4012365352
 * 
 * @param {Object} headers - 回调请求头
 * @param {string} body - 回调请求体（原始字符串）
 * @param {string} platformPublicKey - 微信支付平台证书公钥（PEM 格式）
 * @returns {boolean} 签名是否有效
 */
function verifyPaymentCallbackSignature(headers, body, platformPublicKey) {
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  const serial = headers['wechatpay-serial'];

  if (!timestamp || !nonce || !signature || !serial) {
    throw new Error('缺少必要的签名信息');
  }

  // 构造验签字符串格式：
  // 应答时间戳\n
  // 应答随机串\n
  // 应答报文主体\n
  const message = `${timestamp}\n${nonce}\n${body}\n`;

  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    const isValid = verify.verify(platformPublicKey, signature, 'base64');

    return isValid;
  } catch (error) {
    console.error('签名验证失败:', error);
    throw new Error(`签名验证失败: ${error.message}`);
  }
}

/**
 * 解密支付回调数据
 * 算法：AEAD_AES_256_GCM
 * 
 * @param {Object} resource - 回调数据中的 resource 字段
 * @returns {Object} 解密后的支付结果
 */
function decryptPaymentCallback(resource) {
  const { ciphertext, nonce, associated_data } = resource;
  const mchKey = process.env.MCH_KEY; // V2 商户密钥（32位）

  if (!mchKey || mchKey.length !== 32) {
    throw new Error('商户密钥配置错误，必须是32位字符串');
  }

  try {
    // 创建解密器（AES-256-GCM）
    const decipher = crypto.createDecipheriv('aes-256-gcm', mchKey, nonce);
    
    // 设置附加数据（AAD）
    decipher.setAAD(Buffer.from(associated_data));
    
    // 设置认证标签
    decipher.setAuthTag(Buffer.from(resource.tag || '', 'base64'));

    // 解密
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error(`解密回调数据失败: ${error.message}`);
  }
}

module.exports = {
  // 主要功能
  createWechatPayment,
  createJsapiOrder,
  generateMiniProgramPaymentParams,
  
  // 回调处理
  verifyPaymentCallbackSignature,
  decryptPaymentCallback,
  
  // 工具函数
  yuanToFen,
  fenToYuan,
  generateNonceStr,
  generateSignature,
  buildAuthorizationHeader
};

