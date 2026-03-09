/**
 * 微信支付 V3 回调处理器
 * 接收微信支付异步通知，解密后处理订单状态更新、课程开通、推荐人奖励发放
 *
 * 回调数据格式（V3）：JSON + AEAD_AES_256_GCM 加密
 * 环境变量依赖：MCH_API_V3_KEY（32位 APIv3 密钥，用于解密）
 */
const crypto = require('crypto');
const { formatDateTime, parseBeijingDateStr } = require('../common/utils');

module.exports = async (event, context) => {
  try {
    console.log('[Payment] 收到支付回调');

    const rawBody = event.body;
    const headers = event.headers || {};

    if (!rawBody) {
      console.error('[Payment] 请求体为空，可能是 Event 模式测试调用');
      return {
        success: true,
        code: 0,
        message: '支付回调接口就绪（需通过 HTTP POST 接收微信通知）'
      };
    }

    // 解析回调 JSON
    let notification;
    try {
      notification = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch (e) {
      console.error('[Payment] 解析请求体失败:', e.message);
      return buildJsonResponse(500, 'PARSE_ERROR', '请求体解析失败');
    }

    console.log('[Payment] 通知类型:', notification.event_type, '资源类型:', notification.resource_type);

    if (notification.event_type !== 'TRANSACTION.SUCCESS') {
      console.warn('[Payment] 非支付成功事件:', notification.event_type);
      return buildJsonResponse(200, 'SUCCESS', '');
    }

    // 解密资源数据
    const resource = notification.resource;
    if (!resource || !resource.ciphertext || !resource.nonce || !resource.associated_data) {
      console.error('[Payment] 缺少加密资源字段');
      return buildJsonResponse(500, 'RESOURCE_ERROR', '缺少加密资源字段');
    }

    let paymentData;
    try {
      paymentData = decryptV3Resource(resource);
    } catch (decryptError) {
      console.error('[Payment] 解密失败:', decryptError.message);
      return buildJsonResponse(500, 'DECRYPT_ERROR', '解密失败');
    }

    console.log('[Payment] 解密成功:', {
      out_trade_no: paymentData.out_trade_no,
      trade_state: paymentData.trade_state,
      transaction_id: paymentData.transaction_id,
      total: paymentData.amount?.total
    });

    if (paymentData.trade_state !== 'SUCCESS') {
      console.warn('[Payment] 交易状态非 SUCCESS:', paymentData.trade_state);
      return buildJsonResponse(200, 'SUCCESS', '');
    }

    // 处理支付成功逻辑
    await handlePaymentSuccess(paymentData);

    return buildJsonResponse(200, 'SUCCESS', '');

  } catch (error) {
    console.error('[Payment] 处理失败:', error);
    return buildJsonResponse(500, 'FAIL', error.message);
  }
};

/**
 * 解密 V3 回调资源（AEAD_AES_256_GCM）
 * 密文结构：base64(ciphertext + auth_tag_16bytes)
 */
function decryptV3Resource(resource) {
  const { ciphertext, nonce, associated_data } = resource;

  const apiV3Key = process.env.MCH_API_V3_KEY;
  if (!apiV3Key || apiV3Key.length !== 32) {
    throw new Error('MCH_API_V3_KEY 未配置或长度不是32位');
  }

  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  const authTag = ciphertextBuffer.slice(ciphertextBuffer.length - 16);
  const encryptedData = ciphertextBuffer.slice(0, ciphertextBuffer.length - 16);

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(apiV3Key, 'utf8'),
    Buffer.from(nonce, 'utf8')
  );
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associated_data, 'utf8'));

  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * 处理支付成功
 * @param {Object} data - 解密后的支付结果
 */
async function handlePaymentSuccess(data) {
  const {
    out_trade_no,
    transaction_id,
    success_time,
    amount,
    payer
  } = data;

  console.log('[Payment] 处理支付成功:', {
    orderNo: out_trade_no,
    transactionId: transaction_id,
    amount: amount?.total,
    openid: payer?.openid,
    successTime: success_time
  });

  const { db } = require('../common/db');

  // 查询订单
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

  if (order.pay_status === 1) {
    console.warn('[Payment] 订单已支付，跳过:', out_trade_no);
    return;
  }

  // 格式化支付时间
  let payTime;
  try {
    payTime = success_time
      ? formatDateTime(new Date(success_time))
      : formatDateTime(new Date());
  } catch (e) {
    payTime = formatDateTime(new Date());
  }

  // 更新订单状态
  const { error: updateError } = await db.from('orders').update({
    pay_status: 1,
    pay_time: payTime,
    transaction_id: transaction_id,
    updated_at: formatDateTime(new Date())
  }).eq('id', order.id);

  if (updateError) {
    console.error('[Payment] 更新订单失败:', updateError);
    throw updateError;
  }

  console.log('[Payment] 订单状态已更新为已支付');

  // 处理业务逻辑（同步执行，确保在函数退出前完成）
  try {
    await processOrderBusiness(order, db);
  } catch (businessError) {
    console.error('[Payment] 业务处理失败（订单已标记为已支付）:', businessError);
  }
}

/**
 * 处理订单业务逻辑
 */
async function processOrderBusiness(order, db) {
  console.log('[Payment] 开始处理业务逻辑:', order.order_no, 'order_type:', order.order_type);

  switch (order.order_type) {
    case 1:
      await handleCoursePurchase(order, db);
      break;
    case 2:
      await handleRetrainPayment(order, db);
      break;
    case 4:
      await handleAmbassadorUpgrade(order, db);
      break;
    default:
      console.warn('[Payment] 未知订单类型:', order.order_type);
  }

  console.log('[Payment] 业务逻辑处理完成:', order.order_no);
}

/**
 * 处理课程购买（order_type=1）
 * 1. 创建 user_courses 记录
 * 2. 密训班赠送初探班（is_gift=1）
 * 3. 首购锁定推荐人
 * 4. 发放推荐人奖励
 */
async function handleCoursePurchase(order, db) {
  console.log('[Payment] 处理课程购买:', order.order_no);

  const { data: course } = await db
    .from('courses')
    .select('*')
    .eq('id', order.related_id)
    .single();

  if (!course) {
    throw new Error('课程不存在: ' + order.related_id);
  }

  // 查询用户 uid
  const { data: orderUser } = await db
    .from('users')
    .select('uid')
    .eq('id', order.user_id)
    .single();

  const userUid = orderUser?.uid || '';

  // 检查是否已创建过该课程记录（防止微信重试导致重复）
  const { data: existingUc } = await db
    .from('user_courses')
    .select('id')
    .eq('user_id', order.user_id)
    .eq('course_id', course.id)
    .eq('is_gift', 0)
    .eq('status', 1)
    .limit(1);

  if (existingUc && existingUc.length > 0) {
    console.log('[Payment] 用户已有生效的课程记录，跳过创建:', course.id);
    return;
  }

  const buyTime = new Date();

  // 插入主课程：有效期从签合同起算，购买时 expire_at=NULL，pending_days 记录待签天数
  await db.from('user_courses').insert({
    user_id: order.user_id,
    _openid: order._openid || '',
    course_id: course.id,
    course_type: course.type,
    course_name: course.name,
    order_no: order.order_no,
    source_order_id: order.id,
    buy_price: order.final_amount,
    buy_time: formatDateTime(buyTime),
    expire_at: null,
    pending_days: course.validity_days || 365,
    is_gift: 0,
    attend_count: 0,
    status: 1,
    created_at: formatDateTime(buyTime),
    updated_at: formatDateTime(buyTime)
  });

  console.log('[Payment] 主课程记录已创建，待签合同天数:', course.validity_days || 365);

  // 密训班赠送课程（included_course_ids 为 JSON 字符串或数组）
  let giftCourseIds = course.included_course_ids;
  if (typeof giftCourseIds === 'string') {
    try { giftCourseIds = JSON.parse(giftCourseIds); } catch (e) { giftCourseIds = []; }
  }
  if (giftCourseIds && giftCourseIds.length > 0) {
    for (const giftCourseId of giftCourseIds) {
      const { data: giftCourse } = await db
        .from('courses')
        .select('name, type, validity_days')
        .eq('id', giftCourseId)
        .single();

      if (!giftCourse) {
        console.warn('[Payment] 赠送课程不存在:', giftCourseId);
        continue;
      }

      const validityDays = giftCourse.validity_days || 365;
      const giftNowStr = formatDateTime(buyTime);

      // 统一叠加逻辑：查 status=1 的最新记录
      const { data: existingList } = await db
        .from('user_courses')
        .select('id, contract_signed, pending_days, expire_at')
        .eq('user_id', order.user_id)
        .eq('course_id', giftCourseId)
        .eq('status', 1)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!existingList || existingList.length === 0) {
        // A. 无记录 → 新建（待签合同状态）
        await db.from('user_courses').insert({
          user_id: order.user_id,
          _openid: order._openid || '',
          course_id: giftCourseId,
          course_type: giftCourse.type,
          course_name: giftCourse.name,
          order_no: order.order_no,
          source_order_id: order.id,
          source_course_id: course.id,
          buy_price: 0,
          buy_time: giftNowStr,
          expire_at: null,
          pending_days: validityDays,
          is_gift: 1,
          gift_source: `购买${course.name}赠送`,
          attend_count: 0,
          status: 1,
          created_at: giftNowStr,
          updated_at: giftNowStr
        });
        console.log('[Payment] 赠送课程已创建:', giftCourse.name, '待签合同天数:', validityDays);
      } else {
        const existing = existingList[0];
        if (existing.contract_signed === 0) {
          // B. 未签合同 → 叠加 pending_days
          const newPendingDays = (existing.pending_days || 0) + validityDays;
          await db.from('user_courses').update({
            pending_days: newPendingDays,
            updated_at: giftNowStr
          }).eq('id', existing.id);
          console.log('[Payment] 赠送课程叠加待签天数:', giftCourse.name, 'pending_days:', newPendingDays);
        } else {
          // C. 已签合同且未过期（status=1） → 双向延长有效期
          const days = validityDays;
          const currentExpire = parseBeijingDateStr(existing.expire_at);
          const newExpire = formatDateTime(new Date(currentExpire.getTime() + days * 86400000));
          await db.from('user_courses').update({
            expire_at: newExpire,
            updated_at: giftNowStr
          }).eq('id', existing.id);
          // 同步延长合同有效期
          await db.from('contract_signatures').update({
            contract_end: newExpire.split(' ')[0],
            updated_at: giftNowStr
          }).eq('user_id', order.user_id).eq('course_id', giftCourseId).eq('status', 1);
          console.log('[Payment] 赠送课程叠加有效期:', giftCourse.name, '新截止:', newExpire);
        }
      }
    }
  }

  // 首次购买锁定推荐人
  const { data: userCourseCount } = await db
    .from('user_courses')
    .select('id')
    .eq('user_id', order.user_id)
    .eq('is_gift', 0);

  const isFirstPurchase = userCourseCount && userCourseCount.length === 1;

  if (isFirstPurchase && order.referee_id) {
    await db.from('users').update({
      referee_confirmed_at: formatDateTime(new Date())
    }).eq('id', order.user_id);
    console.log('[Payment] 首购锁定推荐人');
  }

  // 推荐人奖励延迟至用户签署课程学习合同后发放（signCourseContract 触发）
  if (order.referee_id) {
    console.log('[Payment] 推荐人奖励暂不发放，将在用户签署课程学习合同后触发, referee_id:', order.referee_id);
  }
}

/**
 * 处理复训费支付（order_type=2）
 */
async function handleRetrainPayment(order, db) {
  console.log('[Payment] 处理复训费支付:', order.order_no);

  const { data: user } = await db
    .from('users')
    .select('real_name, phone')
    .eq('id', order.user_id)
    .single();

  if (order.class_record_id) {
    // related_id 在复训订单中存储的是 user_course_id
    const userCourseId = order.related_id;

    // 从 class_records 获取正确的 course_id
    const { data: classRecord } = await db
      .from('class_records')
      .select('course_id, booked_quota')
      .eq('id', order.class_record_id)
      .single();

    if (!classRecord) {
      console.error('[Payment] 复训：找不到 class_record:', order.class_record_id);
      return;
    }

    await db.from('appointments').insert({
      user_id: order.user_id,
      _openid: order._openid || '',
      user_name: user?.real_name || '',
      user_phone: user?.phone || '',
      class_record_id: order.class_record_id,
      user_course_id: userCourseId,
      course_id: classRecord.course_id,
      is_retrain: 1,
      order_no: order.order_no,
      status: 0,
      created_at: formatDateTime(new Date()),
      updated_at: formatDateTime(new Date())
    });

    await db.from('class_records').update({
      booked_quota: (classRecord.booked_quota || 0) + 1
    }).eq('id', order.class_record_id);

    console.log('[Payment] 复训预约已创建, course_id:', classRecord.course_id);
  }
}

/**
 * 处理大使升级支付（order_type=4）
 */
async function handleAmbassadorUpgrade(order, db) {
  console.log('[Payment] 处理大使升级:', order.order_no);

  const targetLevel = order.related_id;

  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('*')
    .eq('level', targetLevel)
    .single();

  if (!config) {
    throw new Error('等级配置不存在: level=' + targetLevel);
  }

  await db.from('users').update({
    ambassador_level: targetLevel,
    updated_at: formatDateTime(new Date())
  }).eq('id', order.user_id);

  console.log('[Payment] 用户等级已更新为:', targetLevel);

  // 查询用户 uid
  const { data: levelUser } = await db
    .from('users')
    .select('uid, _openid')
    .eq('id', order.user_id)
    .single();

  const uid = levelUser?.uid || '';
  const openid = levelUser?._openid || '';

  // 发放名额
  if (config.gift_quota_basic > 0) {
    await db.from('ambassador_quotas').insert({
      user_id: order.user_id,
      _openid: openid,
      ambassador_level: targetLevel,
      quota_type: 1,
      source_type: 1,
      source_remark: `升级为${config.level_name}`,
      total_quantity: config.gift_quota_basic,
      used_quantity: 0,
      remaining_quantity: config.gift_quota_basic,
      expire_date: formatDateTime(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      status: 1,
      created_at: formatDateTime(new Date())
    });
    console.log('[Payment] 初探班名额已发放:', config.gift_quota_basic);
  }

  if (config.gift_quota_advanced > 0) {
    await db.from('ambassador_quotas').insert({
      user_id: order.user_id,
      _openid: openid,
      ambassador_level: targetLevel,
      quota_type: 2,
      source_type: 1,
      source_remark: `升级为${config.level_name}`,
      total_quantity: config.gift_quota_advanced,
      used_quantity: 0,
      remaining_quantity: config.gift_quota_advanced,
      expire_date: formatDateTime(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      status: 1,
      created_at: formatDateTime(new Date())
    });
    console.log('[Payment] 密训班名额已发放:', config.gift_quota_advanced);
  }

  // 冻结积分在用户完成全部升级步骤（签署大使协议）后统一发放，此处不发放
  console.log('[Payment] 大使升级支付处理完成，冻结积分将在签约完成后发放');
}

/**
 * 计算并发放推荐人奖励
 *
 * 核心规则（所有数值从 ambassador_level_configs 动态读取）：
 * 1. can_earn_reward=0 → 无奖励（准青鸾）
 * 2. 初探班(type=1) + frozen>0 → 解冻 unfreeze_per_referral 到 available，本次结束
 * 3. 功德分率和积分率互斥（后台配置保证同课程类型只填一个）：
 *    merit_rate>0 → 发功德分；cash_rate>0 → 发积分到 available
 */
async function calculateAndGrantReward(order, course, db) {
  console.log('[Payment] 计算推荐人奖励, referee_id:', order.referee_id);

  const { data: referee } = await db
    .from('users')
    .select('*')
    .eq('id', order.referee_id)
    .single();

  if (!referee) {
    console.log('[Payment] 推荐人不存在，跳过');
    return;
  }

  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('*')
    .eq('level', referee.ambassador_level)
    .single();

  if (!config || !config.can_earn_reward) {
    console.log('[Payment] 推荐人等级不可获得奖励, level:', referee.ambassador_level);
    await markRewardGranted(db, order.order_no);
    return;
  }

  const { data: buyer } = await db
    .from('users')
    .select('real_name')
    .eq('id', order.user_id)
    .single();

  const buyerName = buyer?.real_name || '';
  const baseAmount = parseFloat(order.final_amount);
  const frozenBalance = parseFloat(referee.cash_points_frozen) || 0;
  const unfreezeAmount = parseFloat(config.unfreeze_per_referral) || 0;

  // --- 优先级1：初探班 + 有冻结积分 → 解冻 ---
  if (course.type === 1 && unfreezeAmount > 0 && frozenBalance >= unfreezeAmount) {
    const newFrozen = frozenBalance - unfreezeAmount;
    const newAvailable = (parseFloat(referee.cash_points_available) || 0) + unfreezeAmount;

    await db.from('users').update({
      cash_points_frozen: newFrozen,
      cash_points_available: newAvailable
    }).eq('id', referee.id);

    await db.from('cash_points_records').insert({
      user_id: referee.id,
      _openid: referee._openid || '',
      type: 2,
      amount: unfreezeAmount,
      frozen_after: newFrozen,
      available_after: newAvailable,
      order_no: order.order_no,
      referee_user_id: order.user_id,
      referee_user_name: buyerName,
      remark: `推荐学员购买${course.name}，解冻积分`,
      created_at: formatDateTime(new Date())
    });

    console.log('[Payment] 解冻积分:', unfreezeAmount, 'frozen:', newFrozen, 'available:', newAvailable);
    await markRewardGranted(db, order.order_no);
    return;
  }

  // --- 优先级2：按比例发放（功德分和积分互斥） ---
  const meritRate = course.type === 1
    ? (parseFloat(config.merit_rate_basic) || 0)
    : (parseFloat(config.merit_rate_advanced) || 0);
  const cashRate = course.type === 1
    ? (parseFloat(config.cash_rate_basic) || 0)
    : (parseFloat(config.cash_rate_advanced) || 0);

  if (meritRate > 0) {
    const meritPoints = Math.round(baseAmount * meritRate * 100) / 100;
    if (meritPoints > 0) {
      const { data: currentRef } = await db
        .from('users').select('merit_points').eq('id', referee.id).single();
      const newBalance = (parseFloat(currentRef?.merit_points) || 0) + meritPoints;

      await db.from('users').update({ merit_points: newBalance }).eq('id', referee.id);
      await db.from('merit_points_records').insert({
        user_id: referee.id,
        _openid: referee._openid || '',
        type: 1,
        source: course.type === 1 ? 1 : 2,
        amount: meritPoints,
        balance_after: newBalance,
        order_no: order.order_no,
        referee_user_id: order.user_id,
        referee_user_name: buyerName,
        remark: `推荐学员购买${course.name}，${(meritRate * 100).toFixed(0)}%功德分`,
        created_at: formatDateTime(new Date())
      });
      console.log('[Payment] 功德分已发放:', meritPoints, '余额:', newBalance);
    }
  } else if (cashRate > 0) {
    const cashPoints = Math.round(baseAmount * cashRate * 100) / 100;
    if (cashPoints > 0) {
      const { data: currentRef } = await db
        .from('users').select('cash_points_available').eq('id', referee.id).single();
      const newAvailable = (parseFloat(currentRef?.cash_points_available) || 0) + cashPoints;

      await db.from('users').update({ cash_points_available: newAvailable }).eq('id', referee.id);
      await db.from('cash_points_records').insert({
        user_id: referee.id,
        _openid: referee._openid || '',
        type: 3,
        amount: cashPoints,
        available_after: newAvailable,
        order_no: order.order_no,
        referee_user_id: order.user_id,
        referee_user_name: buyerName,
        remark: `推荐学员购买${course.name}，${(cashRate * 100).toFixed(0)}%可提现积分`,
        created_at: formatDateTime(new Date())
      });
      console.log('[Payment] 可提现积分已发放:', cashPoints, 'available:', newAvailable);
    }
  } else {
    console.log('[Payment] 该等级未配置奖励比例，跳过');
  }

  await markRewardGranted(db, order.order_no);
}

/**
 * 标记订单奖励已发放
 */
async function markRewardGranted(db, orderNo) {
  await db.from('orders').update({
    is_reward_granted: 1,
    reward_granted_at: formatDateTime(new Date())
  }).eq('order_no', orderNo);
  console.log('[Payment] 订单已标记 is_reward_granted=1');
}

/**
 * 构建 V3 回调 JSON 响应
 */
function buildJsonResponse(statusCode, code, message) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, message })
  };
}
