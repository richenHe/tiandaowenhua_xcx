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
    const { getDb } = require('../common/db');
    const db = getDb();

    // 1. 查询订单
    const { data: orders, error: orderError } = await db
      .from('orders')
      .select('*')
      .eq('order_no', out_trade_no)
      .single();

    if (orderError || !orders) {
      console.error('[Payment] 订单不存在:', out_trade_no, orderError);
      return;
    }

    const order = orders;

    // 检查订单是否已支付（防止重复处理）
    if (order.pay_status === 1) {
      console.warn('[Payment] 订单已支付，避免重复处理:', out_trade_no);
      return;
    }

    // 2. 更新订单状态
    await db.from('orders').update({
      pay_status: 1,
      pay_time: new Date(formatWechatTime(time_end)),
      transaction_id: transaction_id,
      updated_at: new Date()
    }).eq('id', order.id);

    console.log('[Payment] 订单状态已更新');

    // 3. 异步处理业务逻辑（不阻塞微信回调响应）
    setImmediate(async () => {
      try {
        await processOrderBusiness(order);
      } catch (businessError) {
        console.error('[Payment] 异步业务处理失败:', businessError);
        // 记录错误但不影响支付回调响应
      }
    });

  } catch (error) {
    console.error('[Payment] 业务处理失败:', error);
    throw error;
  }
}

/**
 * 处理订单业务逻辑（异步执行）
 * @param {Object} order - 订单信息
 */
async function processOrderBusiness(order) {
  console.log('[Payment] 开始处理订单业务逻辑:', order.order_no);

  const { getDb } = require('../common/db');
  const db = getDb();

  try {
    // 根据订单类型执行不同的业务逻辑
    switch (order.order_type) {
      case 1:
        // 课程购买
        await handleCoursePurchase(order, db);
        break;
      case 2:
        // 复训费支付
        await handleRetrainPayment(order, db);
        break;
      case 4:
        // 大使升级支付
        await handleAmbassadorUpgrade(order, db);
        break;
      default:
        console.warn('[Payment] 未知的订单类型:', order.order_type);
    }

    console.log('[Payment] 订单业务逻辑处理完成:', order.order_no);
  } catch (error) {
    console.error('[Payment] 订单业务逻辑处理失败:', error);
    throw error;
  }
}

/**
 * 处理课程购买（order_type=1）
 * @param {Object} order - 订单信息
 * @param {Object} db - 数据库实例
 */
async function handleCoursePurchase(order, db) {
  console.log('[Payment] 处理课程购买:', order.order_no);

  // 1. 查询课程信息
  const { data: course } = await db
    .from('courses')
    .select('*')
    .eq('id', order.related_id)
    .single();

  if (!course) {
    throw new Error('课程不存在');
  }

  // 2. 插入主课程到 user_courses 表
  const { data: userCourse } = await db.from('user_courses').insert({
    user_id: order.user_id,
    user_uid: order.user_uid,
    course_id: course.id,
    course_type: course.type,
    course_name: course.name,
    order_no: order.order_no,
    buy_price: order.final_amount,
    buy_time: new Date().toISOString(),
    is_gift: false,
    attend_count: 1,
    status: 1,
    created_at: new Date().toISOString()
  }).select().single();

  console.log('[Payment] 主课程记录已创建');

  // 3. 如果是密训班，赠送初探班
  if (course.included_course_ids && course.included_course_ids.length > 0) {
    for (const giftCourseId of course.included_course_ids) {
      // 检查用户是否已有该课程
      const { data: existingCourse } = await db
        .from('user_courses')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('course_id', giftCourseId)
        .single();

      if (!existingCourse) {
        // 查询赠送课程信息
        const { data: giftCourse } = await db
          .from('courses')
          .select('name, type')
          .eq('id', giftCourseId)
          .single();

        if (giftCourse) {
          // 插入赠送课程
          await db.from('user_courses').insert({
            user_id: order.user_id,
            user_uid: order.user_uid,
            course_id: giftCourseId,
            course_type: giftCourse.type,
            course_name: giftCourse.name,
            order_no: order.order_no,
            buy_price: 0,
            buy_time: new Date().toISOString(),
            is_gift: true,
            gift_source: `购买${course.name}赠送`,
            source_order_id: order.id,
            source_course_id: course.id,
            attend_count: 1,
            status: 1,
            created_at: new Date().toISOString()
          });

          console.log('[Payment] 赠送课程已创建:', giftCourse.name);
        }
      }
    }
  }

  // 4. 首次购买：锁定推荐人
  const { data: userCourses } = await db
    .from('user_courses')
    .select('id')
    .eq('user_id', order.user_id)
    .eq('is_gift', false);

  const isFirstPurchase = userCourses && userCourses.length === 1;

  if (isFirstPurchase && order.referee_id) {
    await db.from('users').update({
      referee_confirmed_at: new Date().toISOString()
    }).eq('id', order.user_id);

    console.log('[Payment] 推荐人已锁定');
  }

  // 5. 计算并发放推荐人奖励
  if (order.referee_id) {
    await calculateAndGrantReward(order, course, db);
  }
}

/**
 * 处理复训费支付（order_type=2）
 * @param {Object} order - 订单信息
 * @param {Object} db - 数据库实例
 */
async function handleRetrainPayment(order, db) {
  console.log('[Payment] 处理复训费支付:', order.order_no);

  // 1. 查询用户课程信息
  const { data: userCourse } = await db
    .from('user_courses')
    .select('course_id, course_name')
    .eq('id', order.related_id)
    .single();

  if (!userCourse) {
    throw new Error('用户课程不存在');
  }

  // 2. 查询用户信息
  const { data: user } = await db
    .from('users')
    .select('real_name, phone')
    .eq('id', order.user_id)
    .single();

  // 3. 创建预约记录
  await db.from('appointments').insert({
    user_id: order.user_id,
    user_uid: order.user_uid,
    user_name: user?.real_name || '',
    user_phone: user?.phone || '',
    class_record_id: order.class_record_id,
    user_course_id: order.related_id,
    course_id: userCourse.course_id,
    course_name: userCourse.course_name,
    is_retrain: true,
    order_no: order.order_no,
    status: 0,
    created_at: new Date().toISOString()
  });

  console.log('[Payment] 预约记录已创建');

  // 4. 更新课程记录已预约人数
  const { data: classRecord } = await db
    .from('class_records')
    .select('booked_quota')
    .eq('id', order.class_record_id)
    .single();

  if (classRecord) {
    await db.from('class_records').update({
      booked_quota: (classRecord.booked_quota || 0) + 1
    }).eq('id', order.class_record_id);

    console.log('[Payment] 课程预约人数已更新');
  }
}

/**
 * 处理大使升级支付（order_type=4）
 * @param {Object} order - 订单信息
 * @param {Object} db - 数据库实例
 */
async function handleAmbassadorUpgrade(order, db) {
  console.log('[Payment] 处理大使升级:', order.order_no);

  const targetLevel = order.related_id;

  // 1. 查询目标等级配置
  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('*')
    .eq('level', targetLevel)
    .single();

  if (!config) {
    throw new Error('等级配置不存在');
  }

  // 2. 更新用户等级
  await db.from('users').update({
    ambassador_level: targetLevel,
    ambassador_start_date: new Date().toISOString()
  }).eq('id', order.user_id);

  console.log('[Payment] 用户等级已更新');

  // 3. 发放初探班名额
  if (config.gift_quota_basic > 0) {
    await db.from('ambassador_quotas').insert({
      user_id: order.user_id,
      user_uid: order.user_uid,
      ambassador_level: targetLevel,
      quota_type: 1,
      source_type: 1,
      source_remark: `升级为${config.level_name}`,
      total_quantity: config.gift_quota_basic,
      used_quantity: 0,
      remaining_quantity: config.gift_quota_basic,
      expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 1,
      created_at: new Date().toISOString()
    });

    console.log('[Payment] 初探班名额已发放:', config.gift_quota_basic);
  }

  // 4. 发放密训班名额
  if (config.gift_quota_advanced > 0) {
    await db.from('ambassador_quotas').insert({
      user_id: order.user_id,
      user_uid: order.user_uid,
      ambassador_level: targetLevel,
      quota_type: 2,
      source_type: 1,
      source_remark: `升级为${config.level_name}`,
      total_quantity: config.gift_quota_advanced,
      used_quantity: 0,
      remaining_quantity: config.gift_quota_advanced,
      expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 1,
      created_at: new Date().toISOString()
    });

    console.log('[Payment] 密训班名额已发放:', config.gift_quota_advanced);
  }

  // 5. 发放冻结积分
  if (config.frozen_points > 0) {
    const { data: currentUser } = await db
      .from('users')
      .select('cash_points_frozen')
      .eq('id', order.user_id)
      .single();

    await db.from('users').update({
      cash_points_frozen: (currentUser?.cash_points_frozen || 0) + config.frozen_points
    }).eq('id', order.user_id);

    // 插入积分明细
    await db.from('cash_points_records').insert({
      user_id: order.user_id,
      user_uid: order.user_uid,
      type: 1,
      amount: config.frozen_points,
      order_no: order.order_no,
      remark: `升级为${config.level_name}，发放冻结积分`,
      created_at: new Date().toISOString()
    });

    console.log('[Payment] 冻结积分已发放:', config.frozen_points);
  }
}

/**
 * 计算并发放推荐人奖励
 * @param {Object} order - 订单信息
 * @param {Object} course - 课程信息
 * @param {Object} db - 数据库实例
 */
async function calculateAndGrantReward(order, course, db) {
  console.log('[Payment] 计算推荐人奖励:', order.referee_id);

  // 1. 查询推荐人信息
  const { data: referee } = await db
    .from('users')
    .select('*')
    .eq('id', order.referee_id)
    .single();

  if (!referee) {
    console.log('[Payment] 推荐人不存在，跳过奖励发放');
    return;
  }

  // 2. 查询推荐人等级配置
  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('*')
    .eq('level', referee.ambassador_level)
    .single();

  if (!config || !config.can_earn_reward) {
    console.log('[Payment] 推荐人等级不可获得奖励');
    return;
  }

  // 3. 计算奖励金额
  const baseAmount = order.final_amount;
  let meritPoints = 0;
  let cashPoints = 0;

  if (course.type === 1) {
    // 初探班
    meritPoints = Math.round(baseAmount * config.merit_rate_basic * 100) / 100;
    cashPoints = Math.round(baseAmount * config.cash_rate_basic * 100) / 100;
  } else if (course.type === 2) {
    // 密训班
    meritPoints = Math.round(baseAmount * config.merit_rate_advanced * 100) / 100;
    cashPoints = Math.round(baseAmount * config.cash_rate_advanced * 100) / 100;
  }

  // 4. 查询被推荐人姓名
  const { data: refereeUser } = await db
    .from('users')
    .select('real_name')
    .eq('id', order.user_id)
    .single();

  // 5. 发放功德分
  if (meritPoints > 0) {
    const { data: currentReferee } = await db
      .from('users')
      .select('merit_points')
      .eq('id', referee.id)
      .single();

    await db.from('users').update({
      merit_points: (currentReferee?.merit_points || 0) + meritPoints
    }).eq('id', referee.id);

    // 插入功德分明细
    await db.from('merit_points_records').insert({
      user_id: referee.id,
      user_uid: referee.uid,
      type: 1,
      source: course.type === 1 ? 1 : 2,
      amount: meritPoints,
      order_no: order.order_no,
      referee_user_id: order.user_id,
      referee_user_name: refereeUser?.real_name || '',
      remark: `推荐学员购买${course.name}`,
      created_at: new Date().toISOString()
    });

    console.log('[Payment] 功德分已发放:', meritPoints);
  }

  // 6. 发放冻结积分
  if (cashPoints > 0) {
    const { data: currentReferee } = await db
      .from('users')
      .select('cash_points_frozen')
      .eq('id', referee.id)
      .single();

    await db.from('users').update({
      cash_points_frozen: (currentReferee?.cash_points_frozen || 0) + cashPoints
    }).eq('id', referee.id);

    await db.from('cash_points_records').insert({
      user_id: referee.id,
      user_uid: referee.uid,
      type: 1,
      amount: cashPoints,
      order_no: order.order_no,
      referee_user_id: order.user_id,
      referee_user_name: refereeUser?.real_name || '',
      remark: `推荐学员购买${course.name}，发放冻结积分`,
      created_at: new Date().toISOString()
    });

    console.log('[Payment] 冻结积分已发放:', cashPoints);
  }

  // 7. 更新订单奖励发放状态
  await db.from('orders').update({
    is_reward_granted: true,
    reward_granted_at: new Date().toISOString()
  }).eq('order_no', order.order_no);
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
