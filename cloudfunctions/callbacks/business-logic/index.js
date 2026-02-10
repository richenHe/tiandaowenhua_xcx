/**
 * business-logic 业务逻辑层入口
 * 
 * 用途：跨模块业务逻辑封装
 *   - 配置读取（大使等级配置缓存）
 *   - 积分计算（功德分、可提现积分）
 *   - 大使升级（条件检查、升级执行）
 *   - 微信支付（统一下单、回调验签、退款）
 *   - 消息通知（订阅消息发送）
 *   - 订单处理（过期检查、课程记录生成）
 * 
 * 引入方式：
 *   const business = require('business-logic');
 *   // 或解构引入
 *   const { createWechatPayment, sendSubscribeMessage } = require('business-logic');
 * 
 * 依赖：
 *   - common 层（db, response, utils）
 *   - wx-server-sdk（微信支付和订阅消息）
 * 
 * 初始化（在云函数入口调用）：
 *   const cloud = require('wx-server-sdk');
 *   cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
 *   const business = require('business-logic');
 *   business.init(cloud);
 */

// 子模块引入
const config = require('./config');
const points = require('./points');
const ambassador = require('./ambassador');
const payment = require('./payment');
const notification = require('./notification');
const order = require('./order');
const qrcode = require('./qrcode');

/**
 * 初始化 business-logic 层
 * 传入 wx-server-sdk 的 cloud 实例，用于微信支付和消息通知
 * 
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例（已调用 cloud.init）
 * 
 * @example
 * const cloud = require('wx-server-sdk');
 * cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
 * const business = require('business-logic');
 * business.init(cloud);
 */
function init(cloud) {
  if (!cloud) {
    console.warn('business-logic 层初始化：未传入 cloud 实例，微信支付、消息通知和小程序码功能将不可用');
    return;
  }
  payment.initPayment(cloud);
  notification.initNotification(cloud);
  qrcode.initQRCode(cloud);
}

module.exports = {
  // 初始化
  init,

  // 配置读取
  getLevelConfig: config.getLevelConfig,
  getAllLevelConfigs: config.getAllLevelConfigs,
  refreshLevelConfigCache: config.refreshLevelConfigCache,
  getLevelName: config.getLevelName,

  // 积分计算
  calculateMeritPoints: points.calculateMeritPoints,
  calculateCashPoints: points.calculateCashPoints,
  processReferralReward: points.processReferralReward,
  grantActivityMeritPoints: points.grantActivityMeritPoints,
  revokeActivityMeritPoints: points.revokeActivityMeritPoints,

  // 大使升级
  checkUpgradeEligibility: ambassador.checkUpgradeEligibility,
  processAmbassadorUpgrade: ambassador.processAmbassadorUpgrade,

  // 微信支付
  createWechatPayment: payment.createWechatPayment,
  verifyPaymentCallback: payment.verifyPaymentCallback,
  verifyPaymentCallbackV3: payment.verifyPaymentCallbackV3,
  processRefund: payment.processRefund,
  yuanToFen: payment.yuanToFen,
  fenToYuan: payment.fenToYuan,

  // 消息通知
  sendSubscribeMessage: notification.sendSubscribeMessage,
  batchSendSubscribeMessage: notification.batchSendSubscribeMessage,
  sendPaymentSuccessNotice: notification.sendPaymentSuccessNotice,
  sendUpgradeSuccessNotice: notification.sendUpgradeSuccessNotice,

  // 订单处理
  checkOrderExpiry: order.checkOrderExpiry,
  generateUserCourseRecord: order.generateUserCourseRecord,
  generateOrderNo: order.generateOrderNo,

  // 小程序码（分享码）
  generateShareQRCode: qrcode.generateShareQRCode,
  generateAmbassadorQRCode: qrcode.generateAmbassadorQRCode,
  decodeScene: qrcode.decodeScene
};

