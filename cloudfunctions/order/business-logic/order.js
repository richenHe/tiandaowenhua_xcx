/**
 * 订单处理模块
 * 订单过期检查、用户课程记录生成
 */

const { db, findOne, insert, update } = require('common');

/**
 * 将日期加一年，返回 UTC+8 格式字符串（YYYY-MM-DD HH:mm:ss）
 * @param {string|Date|null} base - 起始时间，为空则用当前时间
 */
function addOneYear(base) {
  const d = base ? new Date(base) : new Date();
  d.setFullYear(d.getFullYear() + 1);
  const d8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${d8.getUTCFullYear()}-${pad(d8.getUTCMonth() + 1)}-${pad(d8.getUTCDate())} ${pad(d8.getUTCHours())}:${pad(d8.getUTCMinutes())}:${pad(d8.getUTCSeconds())}`;
}

/**
 * 检查订单是否已过期（创建后 30 分钟未支付自动关闭）
 * @param {string} orderNo - 订单号
 * @returns {Promise<boolean>} 是否已过期
 */
async function checkOrderExpiry(orderNo) {
  const { data: orders } = await db
    .from('orders')
    .select('*')
    .eq('order_no', orderNo)
    .eq('pay_status', 0);

  const order = orders && orders[0];
  if (!order) return true;

  const expireTime = new Date(order.created_at).getTime() + 30 * 60 * 1000;
  const isExpired = Date.now() > expireTime;

  if (isExpired) {
    await update('orders',
      { pay_status: 3, remark: '超时自动关闭' },
      { order_no: orderNo, pay_status: 0 }
    );
  }

  return isExpired;
}

/**
 * 支付成功后生成用户课程记录（有效期 1 年）
 * @param {Object} params - 参数对象
 * @param {number} params.user_id - 用户 ID
 * @param {number} params.order_id - 订单 ID
 * @param {number} params.course_id - 课程 ID
 * @param {string} [params._openid] - 用户 openid
 * @returns {Promise<void>}
 */
async function generateUserCourseRecord({ user_id, order_id, course_id, _openid }) {
  if (!user_id || !course_id) {
    throw new Error('缺少必要的参数：user_id, course_id');
  }

  // 查询课程信息
  const course = await findOne('courses', { id: course_id });
  if (!course) throw new Error(`课程不存在：${course_id}`);

  // 当前 UTC+8 时间
  const nowD8 = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${nowD8.getUTCFullYear()}-${pad(nowD8.getUTCMonth() + 1)}-${pad(nowD8.getUTCDate())} ${pad(nowD8.getUTCHours())}:${pad(nowD8.getUTCMinutes())}:${pad(nowD8.getUTCSeconds())}`;
  const expireAt = addOneYear(nowStr);

  // 写入用户课程记录，有效期 1 年
  await insert('user_courses', {
    user_id,
    _openid: _openid || '',
    course_id,
    course_type: course.type,
    course_name: course.name,
    source_order_id: order_id,
    buy_price: parseFloat(course.current_price) || 0,
    buy_time: nowStr,
    expire_at: expireAt,
    is_gift: 0,
    attend_count: 1,
    status: 1
  });

  console.log(`[generateUserCourseRecord] 课程记录生成成功，有效期至：${expireAt}`);
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

