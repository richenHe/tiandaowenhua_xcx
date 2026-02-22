/**
 * 客户端接口：发起支付（直接调用微信支付 V3 API）
 * Action: createPayment
 */
const cloud = require('wx-server-sdk');
const { db } = require('../../common/db');
const { response } = require('../../common');
const crypto = require('crypto');
const axios = require('axios');

// 生成随机字符串
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 构建签名串
function buildSignString(method, urlPath, timestamp, nonceStr, body) {
  const bodyStr = body ? JSON.stringify(body) : '';
  return `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
}

// 生成签名
function sign(signString, privateKey) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  return signer.sign(privateKey, 'base64');
}

// 构建 Authorization 头
function buildAuthorization(mchId, serialNo, nonceStr, timestamp, signature) {
  return `mchid="${mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;
}

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_no } = event;

  try {
    console.log(`[createPayment] 发起支付:`, { user_id: user.id, order_no });

    // 1. 参数验证
    if (!order_no) {
      return response.paramError('缺少订单号');
    }

    // 2. 查询订单信息
    const { data: orders, error: queryError } = await db
      .from('orders')
      .select('*')
      .eq('order_no', order_no)
      .eq('user_id', user.id)
      .single();

    if (queryError || !orders) {
      return response.error('订单不存在');
    }

    const order = orders;

    // 3. 验证订单状态
    if (order.pay_status !== 0) {
      return response.error('订单状态异常，无法支付');
    }

    // 4. 验证订单是否过期
    const now = new Date();
    const expiresAt = new Date(order.expire_at);
    if (now > expiresAt) {
      await db
        .from('orders')
        .update({ pay_status: 3 })
        .eq('order_no', order_no);
      return response.error('订单已超时，请重新下单');
    }

    // 5. 验证订单金额
    if (order.final_amount <= 0) {
      return response.error('订单金额异常');
    }

    // 6. 准备微信支付 V3 API 参数
    const totalFee = Math.round(parseFloat(order.final_amount) * 100); // 元转分
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // 回调地址（使用固定环境ID）
    const notifyUrl = 'https://cloud1-0gnn3mn17b581124.service.tcloudbase.com/callbacks/payment';

    // 请求体
    const requestBody = {
      appid: process.env.WECHAT_APPID,
      mchid: process.env.MCH_ID,
      description: order.order_name || '道天文化课程',
      out_trade_no: order_no,
      notify_url: notifyUrl,
      amount: {
        total: totalFee,
        currency: 'CNY'
      },
      payer: {
        openid: user.openid // 使用真实微信 openid
      }
    };

    console.log(`[createPayment] 调用微信支付 V3 API:`, {
      orderNo: order_no,
      totalFee,
      openid: user.openid,
      notifyUrl
    });

    // 7. 构建签名
    const urlPath = '/v3/pay/transactions/jsapi';
    const signString = buildSignString('POST', urlPath, timestamp, nonceStr, requestBody);
    
    // 商户私钥（从环境变量或硬编码获取）
    const privateKey = process.env.WECHAT_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQDUehp+rATxZXmy
0MrzP5JWzxevQkjYlhVheRXAAExG0CWu4vsXFPI766muODiN0lkAlx+FsbZSffTB
zd6T/gD09fuTaNAovzRF46o7G7GjgOZlXbP5RFGDj3oEPei2x5WelWwajx6Le4fW
eC8sYXjCeOvIYxmvRI4aNhR8rPKErHtjn1pqVrw1cGFnJOx4fsM3moXCrYT3UbCk
hlThj3lo2BEab9jtq4VRa3gDuFCeUoERm+A952MFC2NwJ/oOmSm8DQju2B818kC0
yTc6Jszrfzd17tf35lKnuf781ohvIBFiHongQ6ON1MtAD7V6X4ri8gJfafvfwUAU
UcSSoxAHAgMBAAECggEBAImYKOAu9WR9mjm6DDNJz7J3mZbdDd90EZR1nSghCUQy
NrTyODfSUKuNCOzRa44r0YcYVkl1s+PnvUBj2OdtbaE0Sh5DmclJSMiZjfuJC5ge
ORUbgRjCrSbNGu70SGdVCAcSLFdmpxkcffLdEW9kD5egRtAVnORrOLqwmsPCG6rd
+F9IvjOa7jy/VHRoPVTqj01lsnSK1VIlSuqswLoPtjb+jKSlrYQtvQYo2gJQd6MW
ehyxrcdMcnNVTHfcuWpok2cNawNj2F/nIvbPCFWXIPRuORwR3+VC/K/ppHiwvUrP
G5MvO7cP/FrYX2sUwFc8Ri4J/2+NET/FHMDQmh/gQcECgYEA/LrdpjmeDRuAf2kS
Z0LIJojHNSAhP/OdiFHJMJLZ9EJ/3s8H8UDPIK57mexvHJJBB4CwYyPmBr7xZbKs
XC/V9LcNs0Jj4x0Tf6aMkpckeQYUo9sbI/ixGzkpxhBJyXvh8ZPU6m6BZf3ziejo
UeysMs7mktOgLxub5U4vaZq//rMCgYEA1znnsmDsNe55BSYYyH8QS5BxKZUBFkWz
4rzbSBKUOLgx2+V5dQ4gSFWw/Q1tPTHEkjS6NDqERPejYNPd2+KDtwY/Qwq0omDG
amZK7qJWNL/UXo6l+vy6uum5QxeQItHGQ+NDHWdcftX3xv1fM2r59W2n2Y5RlqRC
IufVRa8y010CgYEA+hagR2E0uZvBaFM9VtmK3jbzieqlfHdCKCdmg56N91vm1UDh
hyau0JRY01RYD1na5+W8ph5b/cjtb8mDLiZX/rU15XGJDrEzHlpdOKJAAVK3Ef47
uTjbaSkD4W801SC10SyMwP9hJOBMIuhLHOaq8Aw1to2cMYGMnzjjSglMfGkCgYEA
vkszYdMyZojgNb42YWd/J+ChPWvCV0fvwcTLeRD8Pp4Vb2CYn/eKcYpaf5NUh6uu
Krs1+6HVewkdSippWdYQMU3ztzoK9hrss/yXuiCMaf1GLwifFqhIDaVDKV/3D+I8
E6AnoiLWdEqI1kcF2nd2ZBq9Mq0T1EaNN0GVnxRFsv0CgYEAm+WopA7nQrn9A0KS
Umzrrs/V24aW4uF/PYZN1l/MFur3c4Irlu0G1gnR5XuxNBn0AUuUxn7ylOmdvFWc
JtBHh+L7EBhY4ks5ZQs4g77JhOzbNVAFEqGUlNzeyjU/7Dycw22fV4q/j6aoJ5PK
qSpRYi6GIlotuiCm+P4AGFw2NS8=
-----END PRIVATE KEY-----`;
    const signature = sign(signString, privateKey);
    
    // 证书序列号（从环境变量或硬编码获取）
    const certSerialNo = process.env.WECHAT_CERT_SERIAL_NO || '6D4BEDC9337BD2C074748CCF667311E0A5BD9C7E';
    
    const authorization = buildAuthorization(
      process.env.MCH_ID,
      certSerialNo,
      nonceStr,
      timestamp,
      signature
    );

    // 8. 调用微信支付统一下单 API
    const apiUrl = `https://api.mch.weixin.qq.com${urlPath}`;
    const payResult = await axios({
      method: 'POST',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `WECHATPAY2-SHA256-RSA2048 ${authorization}`,
        'User-Agent': 'CloudBase-CloudFunction'
      },
      data: requestBody
    });

    console.log('[createPayment] 微信支付返回:', {
      status: payResult.status,
      prepay_id: payResult.data?.prepay_id
    });

    if (payResult.status !== 200 || !payResult.data?.prepay_id) {
      console.error('[createPayment] 微信支付下单失败:', payResult.data);
      throw new Error('微信支付下单失败');
    }

    const prepayId = payResult.data.prepay_id;

    // 9. 更新订单 prepay_id
    await db
      .from('orders')
      .update({ prepay_id: prepayId })
      .eq('order_no', order_no);

    // 10. 生成小程序支付参数
    const payTimestamp = Math.floor(Date.now() / 1000).toString();
    const payNonceStr = generateNonceStr();
    const payPackage = `prepay_id=${prepayId}`;

    // 构建支付签名
    const paySignString = `${process.env.WECHAT_APPID}\n${payTimestamp}\n${payNonceStr}\n${payPackage}\n`;
    const paySign = sign(paySignString, privateKey);

    const paymentData = {
      timeStamp: payTimestamp,
      nonceStr: payNonceStr,
      package: payPackage,
      signType: 'RSA',
      paySign: paySign
    };

    console.log(`[createPayment] 支付参数生成成功:`, {
      order_no: order_no,
      prepay_id: prepayId
    });

    return response.success(paymentData, '发起支付成功');

  } catch (error) {
    console.error('[createPayment] 失败:', error);
    
    // 详细错误信息
    if (error.response) {
      console.error('[createPayment] 微信支付 API 错误:', {
        status: error.response.status,
        data: error.response.data
      });
      return response.error('微信支付下单失败', error.response.data);
    }
    
    return response.error('发起支付失败', error.message);
  }
};
