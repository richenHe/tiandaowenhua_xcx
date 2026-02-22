/**
 * 客户端接口：发起支付
 * Action: createPayment
 */
const cloud = require('wx-server-sdk');
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { orderNo, order_no } = event;
  const finalOrderNo = orderNo || order_no; // 支持两种命名

  try {
    console.log('[createPayment] ========== 发起支付 ==========');
    console.log(`[createPayment] 用户信息:`, { 
      user_id: user.id, 
      user_openid_last6: user.openid?.slice(-6),
      context_OPENID_last6: OPENID?.slice(-6),
      order_no: finalOrderNo 
    });
    
    // ⚠️ 安全检查：确保用户有真实的微信 openid
    if (!user.openid || user.openid.length === 0) {
      console.error('[createPayment] ❌ 严重错误：用户没有有效的微信 openid');
      console.error('[createPayment] 用户数据:', { id: user.id, uid: user.uid, openid: user.openid });
      throw new Error('用户身份信息异常，请重新登录');
    }
    
    console.log('[createPayment] ✅ 用户 openid 验证通过，这是真实的微信 openid');

    // 1. 参数验证
    if (!finalOrderNo) {
      return response.paramError('缺少订单号');
    }

    // 2. 查询订单信息
    const { data: orders, error: queryError } = await db
      .from('orders')
      .select('*')
      .eq('order_no', finalOrderNo)
      .eq('user_id', user.id)
      .single();

    if (queryError || !orders) {
      console.error('[createPayment] 订单查询失败:', queryError);
      return response.notFound('订单不存在');
    }

    const order = orders;

    // 3. 验证订单状态
    if (order.pay_status === 1) {
      return response.error('订单已支付');
    }
    if (order.pay_status === 2) {
      return response.error('订单已取消');
    }
    if (order.pay_status === 3) {
      return response.error('订单已关闭');
    }

    // 4. 检查订单有效期
    const now = new Date();
    const expiresAt = new Date(order.expire_at);
    if (now > expiresAt) {
      // 更新订单状态为已关闭
      await db
        .from('orders')
        .update({ pay_status: 3 })
        .eq('order_no', finalOrderNo);

      return response.error('订单已超时，请重新下单');
    }

    // 5. 验证订单金额
    if (order.final_amount <= 0) {
      return response.error('订单金额异常');
    }

    // 6. 调用微信支付统一下单
    const totalFee = Math.round(parseFloat(order.final_amount) * 100); // 元转分
    const nonceStr = generateNonceStr();

    console.log(`[createPayment] 准备调用微信支付统一下单:`);
    console.log(`[createPayment] - 订单号: ${finalOrderNo}`);
    console.log(`[createPayment] - 金额: ${order.final_amount}元 = ${totalFee}分`);
    console.log(`[createPayment] - 使用 user.openid (真实微信 openid): ${user.openid?.slice(-6)}`);
    console.log(`[createPayment] - 完整 openid: ${user.openid}`);
    console.log(`[createPayment] - openid 长度: ${user.openid?.length}`);
    console.log(`[createPayment] ⚠️ 重要：使用数据库中的真实微信 openid，不使用 context.OPENID`);

    // ⚠️ 关键：CloudBase 微信支付使用"普通商户直连模式"
    // 不需要传递 subMchId 参数，CloudBase 会自动从环境配置中读取商户信息
    // 参考官方文档：https://docs.cloudbase.net/toolbox/datasource/weixin-pay
    const payResult = await cloud.cloudPay.unifiedOrder({
      body: order.order_name || '道天文化课程',
      outTradeNo: finalOrderNo,
      spbillCreateIp: '127.0.0.1',
      totalFee: totalFee,
      envId: process.env.TCB_ENV || cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'callbacks', // 支付回调云函数
      nonceStr: nonceStr,
      tradeType: 'JSAPI',
      openid: user.openid  // ✅ 使用数据库中的真实微信 openid
    });

    console.log('[createPayment] ✅ 微信支付统一下单返回:');
    console.log('[createPayment] - returnCode:', payResult.returnCode);
    console.log('[createPayment] - resultCode:', payResult.resultCode);
    console.log('[createPayment] - prepayId:', payResult.prepayId?.slice(-6));

    if (payResult.returnCode !== 'SUCCESS' || payResult.resultCode !== 'SUCCESS') {
      const errMsg = payResult.returnMsg || payResult.errCodeDes || '统一下单失败';
      console.error('[createPayment] ❌ 微信支付统一下单失败');
      console.error('[createPayment] 完整响应:', JSON.stringify(payResult, null, 2));
      console.error('[createPayment] 使用的 openid:', user.openid?.slice(-6));
      console.error('[createPayment] 错误信息:', errMsg);
      throw new Error(`微信支付下单失败: ${errMsg}`);
    }

    // 7. 更新订单 prepay_id
    await db
      .from('orders')
      .update({ prepay_id: payResult.prepayId || '' })
      .eq('order_no', finalOrderNo);

    console.log(`[createPayment] ✅ 支付参数生成成功`);
    console.log(`[createPayment] - 订单号: ${finalOrderNo}`);
    console.log(`[createPayment] - prepay_id: ${payResult.prepayId?.slice(-6)}`);
    console.log(`[createPayment] ========== 支付成功 ==========`);

    // 8. 返回小程序支付参数
    return response.success({
      timeStamp: payResult.payment.timeStamp,
      nonceStr: payResult.payment.nonceStr,
      package: payResult.payment.package,
      signType: payResult.payment.signType,
      paySign: payResult.payment.paySign,
      prepay_id: payResult.prepayId || ''
    }, '支付参数生成成功');

  } catch (error) {
    console.error('[createPayment] ========== 支付失败 ==========');
    console.error('[createPayment] 错误类型:', error.name);
    console.error('[createPayment] 错误消息:', error.message);
    console.error('[createPayment] 错误堆栈:', error.stack);
    console.error('[createPayment] 用户 openid:', user?.openid?.slice(-6) || 'undefined');
    console.error('[createPayment] 订单号:', finalOrderNo);
    console.error('[createPayment] ====================================');
    return response.error('发起支付失败', error);
  }
};

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
