/**
 * 订单处理模块
 * 订单过期检查、用户课程记录生成
 */

const { getDb } = require('../common/db');

/**
 * 检查订单是否已过期（创建后 30 分钟未支付自动关闭）
 * @param {string} orderNo - 订单号
 * @returns {Promise<boolean>} 是否已过期
 */
async function checkOrderExpiry(orderNo) {
  const db = getDb();

  const { data: orders } = await db
    .from('orders')
    .select('*')
    .eq('order_no', orderNo)
    .eq('pay_status', 0)
    .eq('is_deleted', 0);

  const order = orders?.[0];
  if (!order) return true; // 订单不存在视为过期

  // 订单时效固定 30 分钟
  const expireTime = new Date(order.created_at).getTime() + 30 * 60 * 1000;
  const isExpired = Date.now() > expireTime;

  // 如果已过期，自动关闭订单
  if (isExpired) {
    await db.from('orders').update({
      pay_status: 3,
      remark: '超时自动关闭'
    }).eq('order_no', orderNo).eq('pay_status', 0);
  }

  return isExpired;
}

/**
 * 支付成功后生成用户课程记录（已废弃，逻辑已迁移到 payment.js）
 * @deprecated 使用 payment.js 中的 handleCoursePurchase 替代
 * @param {Object} conn - 事务连接对象
 * @param {Object} order - 订单信息
 * @returns {Promise<void>}
 */
async function generateUserCourseRecord(conn, order) {
  console.warn('[Order] generateUserCourseRecord 已废弃，请使用 payment.js 中的业务逻辑');
  throw new Error('此方法已废弃，业务逻辑已迁移到 payment.js');
}

/**
 * 生成订单号
 * 格式：ORD + 年月日时分秒 + 4位随机数
 * @param {string} prefix - 订单号前缀（默认 'ORD'）
 * @returns {string} 订单号
 */
function generateOrderNo(prefix = 'ORD') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

  return `${prefix}${year}${month}${day}${hour}${minute}${second}${random}`;
}

module.exports = {
  checkOrderExpiry,
  generateUserCourseRecord,
  generateOrderNo
};

