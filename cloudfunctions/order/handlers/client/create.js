/**
 * 客户端接口：创建订单
 * Action: create
 *
 * 统一订单创建接口，仅用于涉及真实金钱的交易场景
 * - order_type=1: 课程购买
 * - order_type=2: 复训费支付
 * - order_type=4: 需支付的大使升级
 */
const { findOne, insert, query, db } = require('../../common/db');
const { response, formatDateTime, utils } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_type, item_id, class_record_id } = event;

  try {
    console.log(`[create] 创建订单:`, { user_id: user.id, order_type, item_id });

    // 1. 权限验证 - 检查资料是否完善
    if (!user.profile_completed) {
      return response.forbidden('请先完善资料', {
        action: 'complete_profile',
        redirect_url: '/pages/auth/complete-profile/index'
      });
    }

    // 2. 参数验证
    if (!order_type) {
      return response.paramError('缺少订单类型');
    }
    
    // item_id 必须是大于 0 的整数
    if (!item_id || item_id <= 0) {
      return response.paramError('item_id 必须是大于 0 的整数');
    }

    // 3. 防重复下单：查是否已有同类型的未支付订单（未过期）
    const duplicateCheck = await checkExistingPendingOrder(user.id, order_type, item_id, class_record_id);
    if (duplicateCheck) {
      console.log(`[create] 命中待支付订单，返回原订单:`, duplicateCheck.order_no);
      return response.success({
        order_no: duplicateCheck.order_no,
        order_type: duplicateCheck.order_type,
        order_name: duplicateCheck.order_name,
        amount: parseFloat(duplicateCheck.final_amount),
        referee_id: duplicateCheck.referee_id,
        referee_uid: duplicateCheck.referee_uid,
        referee_name: duplicateCheck.referee_name,
        referee_level: duplicateCheck.referee_level,
        status: 0,
        expire_at: duplicateCheck.expire_at,
        is_existing: true // 标记为已有订单，前端可感知
      }, '已有待支付订单');
    }

    // 4. 根据 order_type 处理不同业务逻辑
    let orderData = {};

    switch (order_type) {
      case 1: // 课程购买
        orderData = await handleCourseOrder(user, item_id);
        break;

      case 2: // 复训费
        if (!class_record_id) {
          return response.paramError('复训订单需要提供 class_record_id');
        }
        orderData = await handleRetrainOrder(user, item_id, class_record_id);
        break;

      case 4: // 大使升级
        orderData = await handleUpgradeOrder(user, item_id);
        break;

      default:
        return response.paramError('不支持的订单类型');
    }

    // 5. 生成订单号
    const order_no = business.generateOrderNo('ORD');

    // 6. 插入订单记录
    const expire_at = formatDateTime(new Date(Date.now() + 30 * 60 * 1000));
    
    const order = await insert('orders', {
      user_id: user.id,
      user_name: user.real_name || null,
      user_phone: user.phone || null,
      order_no,
      order_type,
      order_name: orderData.order_name,
      related_id: item_id,
      class_record_id: class_record_id || null,
      original_amount: orderData.amount,
      final_amount: orderData.amount,
      referee_id: orderData.referee_id || null,
      referee_uid: orderData.referee_uid || null,
      referee_name: orderData.referee_name || null,
      referee_level: orderData.referee_level != null ? orderData.referee_level : null,
      pay_status: 0, // 待支付
      order_metadata: orderData.metadata ? JSON.stringify(orderData.metadata) : null,
      expire_at: expire_at
    });

    console.log(`[create] 订单创建成功:`, order_no);

    // 7. 返回订单信息
    return response.success({
      order_no,
      order_type,
      order_name: orderData.order_name,
      amount: parseFloat(orderData.amount),
      referee_id: orderData.referee_id,
      referee_uid: orderData.referee_uid,
      referee_name: orderData.referee_name,
      referee_level: orderData.referee_level,
      status: 0,
      expire_at: expire_at
    }, '订单创建成功');

  } catch (error) {
    console.error(`[create] 失败:`, error);
    return response.error('创建订单失败', error);
  }
};

/**
 * 处理课程购买订单
 * 推荐人直接从用户表读取，不接受前端传参
 */
async function handleCourseOrder(user, course_id) {
  // 1. 验证课程存在且上架
  const course = await findOne('courses', { id: course_id });
  if (!course) {
    throw new Error('课程不存在');
  }
  if (course.status !== 1) {
    throw new Error('课程已下架');
  }

  // 2. 检查重复购买（用 select+limit 代替 findOne，防止多行报错）
  const { data: existingCourses } = await db
    .from('user_courses')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .eq('status', 1)
    .limit(1);
  if (existingCourses && existingCourses.length > 0) {
    throw new Error('您已购买过该课程');
  }

  // 3. 处理推荐人（仅从用户表读取，由扫码绑定决定）
  let refereeData = {};
  const refereeId = user.referee_id;

  if (refereeId) {
    const referee = await findOne('users', { id: refereeId });
    if (referee) {
      if (course.type === 2 && referee.ambassador_level < 2) {
        throw new Error('密训班需要青鸾及以上等级的推荐人');
      }

      refereeData = {
        referee_id: referee.id,
        referee_uid: referee.uid,
        referee_name: referee.real_name,
        referee_level: referee.ambassador_level
      };
    }
  }

  // 4. 检查是否是密训班（需要赠送初探班）
  const metadata = {};
  if (course.type === 2 && course.included_course_ids) {
    metadata.gift_courses = JSON.parse(course.included_course_ids);
  }

  return {
    order_name: course.name,
    amount: parseFloat(course.current_price),
    ...refereeData,
    metadata
  };
}

/**
 * 处理复训订单
 */
async function handleRetrainOrder(user, user_course_id, class_record_id) {
  // 1. 验证用户已购买该课程
  const userCourse = await findOne('user_courses', {
    id: user_course_id,
    user_id: user.id
  });
  if (!userCourse) {
    throw new Error('您未购买该课程');
  }

  // 2. 验证上课记录存在
  const classRecord = await findOne('class_records', { id: class_record_id });
  if (!classRecord) {
    throw new Error('上课记录不存在');
  }

  // 3. 检查排期状态：只有"未开始(1)"才允许预约复训
  // status: 0=已取消 / 1=未开始 / 2=进行中 / 3=已结束
  if (classRecord.status !== 1) {
    const statusMsg = { 0: '已取消', 2: '进行中', 3: '已结束' };
    throw new Error(`该排期${statusMsg[classRecord.status] || '状态异常'}，无法预约复训`);
  }

  // 4. 检查是否已预约
  const existingAppointment = await findOne('appointments', {
    user_id: user.id,
    class_record_id: class_record_id,
    status: 0 // 待签到
  });
  if (existingAppointment) {
    throw new Error('您已预约该课程');
  }

  // 5. 复训费以排期 class_records.retrain_price 为准；0 元不应走本接口（请用户直接预约）
  const amount = parseFloat(classRecord.retrain_price);
  const finalAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  if (finalAmount <= 0) {
    throw new Error('该排期复训费为 0，请返回课程页直接预约，无需创建复训订单');
  }

  const course = await findOne('courses', { id: classRecord.course_id });

  return {
    order_name: `${course.name} - 复训费`,
    amount: finalAmount,
    referee_id: null, // 复训不涉及推荐人
    referee_uid: null
  };
}

/**
 * 处理大使升级订单
 */
async function handleUpgradeOrder(user, target_level) {
  // 1. 验证当前等级
  if (user.ambassador_level >= target_level) {
    throw new Error('您的等级已达到或超过目标等级');
  }

  // 2. 验证升级条件（从配置表读取）
  const levelConfig = await findOne('ambassador_level_configs', { level: target_level });
  if (!levelConfig) {
    throw new Error('目标等级配置不存在');
  }

  // 3. 检查是否需要支付
  if (!levelConfig.upgrade_payment_amount || levelConfig.upgrade_payment_amount <= 0) {
    throw new Error('该等级升级无需支付，请使用升级接口');
  }

  // 4. 验证协议是否签署（如果需要）
  if (levelConfig.requires_contract) {
    const contract = await findOne('contract_signatures', {
      user_id: user.id,
      contract_level: target_level,
      status: 1
    });
    if (!contract) {
      throw new Error('请先签署大使协议');
    }
  }

  return {
    order_name: `升级至${levelConfig.level_name}`,
    amount: levelConfig.upgrade_payment_amount,
    referee_id: null,
    referee_uid: null
  };
}

/**
 * 防重复下单：查找同类型的待支付订单（未过期）
 * - type=1: user + order_type + related_id(course_id)
 * - type=2: user + order_type + class_record_id
 * - type=4: user + order_type + related_id(target_level)
 */
async function checkExistingPendingOrder(user_id, order_type, item_id, class_record_id) {
  let query = db
    .from('orders')
    .select('order_no, order_type, order_name, final_amount, referee_id, referee_uid, referee_name, referee_level, expire_at')
    .eq('user_id', user_id)
    .eq('order_type', order_type)
    .eq('pay_status', 0)
    .gt('expire_at', formatDateTime(new Date())); // 未过期

  if (order_type === 2) {
    // 复训费：按 class_record_id 去重
    query = query.eq('class_record_id', class_record_id);
  } else {
    // 课程购买(1) / 大使升级(4)：按 related_id 去重
    query = query.eq('related_id', item_id);
  }

  const { data } = await query.limit(1);
  return data && data.length > 0 ? data[0] : null;
}
