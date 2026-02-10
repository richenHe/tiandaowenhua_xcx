/**
 * 客户端接口：创建订单
 * Action: create
 *
 * 统一订单创建接口，仅用于涉及真实金钱的交易场景
 * - order_type=1: 课程购买
 * - order_type=2: 复训费支付
 * - order_type=4: 需支付的大使升级
 */
const { findOne, insert, query } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { order_type, item_id, class_record_id, referee_id } = event;

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
    if (!order_type || !item_id) {
      return response.paramError('缺少必要参数');
    }

    // 3. 根据 order_type 处理不同业务逻辑
    let orderData = {};

    switch (order_type) {
      case 1: // 课程购买
        orderData = await handleCourseOrder(user, item_id, referee_id);
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

    // 4. 生成订单号
    const order_no = business.generateOrderNo('ORD');

    // 5. 插入订单记录
    const order = await insert('orders', {
      user_id: user.id,
      order_no,
      order_type,
      order_name: orderData.order_name,
      related_id: item_id,
      class_record_id: class_record_id || null,
      original_amount: orderData.amount,
      final_amount: orderData.amount,
      referee_id: orderData.referee_id || null,
      referee_uid: orderData.referee_uid || null,
      pay_status: 0, // 待支付
      order_metadata: orderData.metadata ? JSON.stringify(orderData.metadata) : null,
      expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
    });

    console.log(`[create] 订单创建成功:`, order_no);

    // 6. 返回订单信息
    return response.success({
      order_no,
      order_type,
      order_name: orderData.order_name,
      amount: orderData.amount,
      referee_id: orderData.referee_id,
      referee_uid: orderData.referee_uid,
      referee_name: orderData.referee_name,
      referee_level: orderData.referee_level,
      status: 0,
      expires_at: order.expires_at
    }, '订单创建成功');

  } catch (error) {
    console.error(`[create] 失败:`, error);
    return response.error('创建订单失败', error);
  }
};

/**
 * 处理课程购买订单
 */
async function handleCourseOrder(user, course_id, referee_id) {
  // 1. 验证课程存在且上架
  const course = await findOne('courses', { id: course_id });
  if (!course) {
    throw new Error('课程不存在');
  }
  if (course.status !== 1) {
    throw new Error('课程已下架');
  }

  // 2. 检查重复购买
  const existingCourse = await findOne('user_courses', {
    user_id: user.id,
    course_id: course_id,
    status: 1
  });
  if (existingCourse) {
    throw new Error('您已购买过该课程');
  }

  // 3. 处理推荐人
  let refereeData = {};
  const finalRefereeId = referee_id || user.referee_id;

  if (finalRefereeId) {
    const referee = await findOne('users', { id: finalRefereeId });
    if (referee) {
      // 验证推荐人资格（根据课程类型）
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
    order_name: course.course_name,
    amount: course.price,
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

  // 3. 检查复训截止时间（开课前3天）
  const classDate = new Date(classRecord.class_date);
  const now = new Date();
  const daysUntilClass = Math.ceil((classDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilClass < 3) {
    throw new Error('开课前3天内无法预约复训');
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

  // 5. 获取课程信息
  const course = await findOne('courses', { id: classRecord.course_id });

  return {
    order_name: `${course.course_name} - 复训费`,
    amount: course.retrain_price || 500.00,
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
