/**
 * 订单处理模块
 * 订单过期检查、用户课程记录生成
 */

const { db } = require('common');

/**
 * 检查订单是否已过期（创建后 30 分钟未支付自动关闭）
 * @param {string} orderNo - 订单号
 * @returns {Promise<boolean>} 是否已过期
 */
async function checkOrderExpiry(orderNo) {
  const orders = await db.query(
    'SELECT * FROM orders WHERE order_no = ? AND pay_status = 0 AND is_deleted = 0',
    [orderNo]
  );
  const order = orders[0];
  if (!order) return true; // 订单不存在视为过期

  // 订单时效固定 30 分钟
  const expireTime = new Date(order.created_at).getTime() + 30 * 60 * 1000;
  const isExpired = Date.now() > expireTime;

  // 如果已过期，自动关闭订单
  if (isExpired) {
    await db.query(
      'UPDATE orders SET pay_status = 3, remark = \'超时自动关闭\' WHERE order_no = ? AND pay_status = 0',
      [orderNo]
    );
  }

  return isExpired;
}

/**
 * 支付成功后生成用户课程记录
 * @param {Object} conn - 事务连接对象
 * @param {Object} order - 订单信息
 * @param {number} order.id - 订单 ID
 * @param {string} order._openid - 用户 openid
 * @param {number} order.user_id - 用户 ID
 * @param {number} order.course_id - 课程 ID
 * @param {string} order.course_type - 课程类型（'basic'/'advanced'）
 * @returns {Promise<void>}
 */
async function generateUserCourseRecord(conn, order) {
  if (!conn || !order) {
    throw new Error('缺少必要的参数：conn, order');
  }

  // 创建用户课程记录
  await conn.execute(
    'INSERT INTO user_courses (_openid, user_id, course_id, order_id, status) VALUES (?, ?, ?, ?, 1)',
    [order._openid, order.user_id, order.course_id, order.id]
  );

  // 密训班额外赠送初探班
  if (order.course_type === 'advanced') {
    const [rows] = await conn.execute(
      'SELECT id FROM courses WHERE type = 1 AND status = 1 LIMIT 1'
    );
    const basicCourse = rows[0] || rows;

    if (basicCourse && basicCourse.id) {
      await conn.execute(
        'INSERT INTO user_courses (_openid, user_id, course_id, order_id, is_gift, source_order_id, status) VALUES (?, ?, ?, ?, 1, ?, 1)',
        [order._openid, order.user_id, basicCourse.id, order.id, order.id]
      );
    }
  }
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

