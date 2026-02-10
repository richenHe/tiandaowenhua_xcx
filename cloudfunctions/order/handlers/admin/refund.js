/**
 * 管理端接口：订单退款
 * Action: refund
 */
const { findOne, update, insert, query, db } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { order_no, refund_reason } = event;

  try {
    console.log(`[refund] 管理员退款:`, { admin_id: admin.id, order_no });

    // 1. 参数验证
    if (!order_no) {
      return response.paramError('缺少订单号');
    }
    if (!refund_reason) {
      return response.paramError('缺少退款原因');
    }

    // 2. 查询订单信息
    const order = await findOne('orders', { order_no });
    if (!order) {
      return response.notFound('订单不存在');
    }

    // 3. 验证订单状态
    if (order.pay_status !== 1) {
      return response.error('只能退款已支付订单');
    }

    // 4. 调用 business-logic 层处理退款
    const refundResult = await business.processRefund(
      order.order_no,
      order.final_amount,
      order.final_amount,
      refund_reason
    );

    // 5. 更新订单状态
    await update('orders', {
      pay_status: 4, // 已退款
      refund_reason,
      refund_time: new Date()
    }, { order_no });

    // 6. 回退业务逻辑
    await rollbackOrderBusiness(order);

    console.log(`[refund] 退款成功:`, { order_no, refund_id: refundResult.refundId });

    return response.success({
      refund_id: refundResult.refundId,
      refund_no: refundResult.outRefundNo,
      refund_amount: order.final_amount,
      status: refundResult.status
    }, '退款成功');

  } catch (error) {
    console.error(`[refund] 失败:`, error);
    return response.error('退款失败', error);
  }
};

/**
 * 回退订单业务逻辑
 */
async function rollbackOrderBusiness(order) {
  try {
    switch (order.order_type) {
      case 1: // 课程购买退款
        await rollbackCoursePurchase(order);
        break;
      case 2: // 复训费退款
        await rollbackRetrain(order);
        break;
      case 4: // 大使升级退款
        await rollbackUpgrade(order);
        break;
    }

    console.log(`[rollbackOrderBusiness] 业务回退完成:`, order.order_no);

  } catch (error) {
    console.error(`[rollbackOrderBusiness] 失败:`, error);
    throw error;
  }
}

/**
 * 回退课程购买
 */
async function rollbackCoursePurchase(order) {
  // 1. 标记用户课程失效
  await update('user_courses', {
    status: 0,
    refund_time: new Date()
  }, {
    user_id: order.user_id,
    course_id: order.related_id
  });

  // 2. 回退推荐人奖励（如果已发放）
  if (order.is_reward_granted && order.referee_id) {
    await rollbackRefereeReward(order);
  }

  console.log(`[rollbackCoursePurchase] 课程购买回退完成`);
}

/**
 * 回退复训预约
 */
async function rollbackRetrain(order) {
  // 1. 取消预约记录
  await update('appointments', {
    status: 3, // 已取消
    cancel_reason: '订单退款'
  }, {
    order_no: order.order_no
  });

  // 2. 恢复课程名额
  const appointment = await findOne('appointments', { order_no: order.order_no });
  if (appointment) {
    await update('class_records', {
      booked_quota: db.raw('booked_quota - 1')
    }, {
      id: appointment.class_record_id
    });
  }

  console.log(`[rollbackRetrain] 复训预约回退完成`);
}

/**
 * 回退大使升级
 */
async function rollbackUpgrade(order) {
  // 1. 降级用户等级
  const user = await findOne('users', { id: order.user_id });
  if (user) {
    // 查询上一个等级
    const previousLevel = user.ambassador_level - 1;
    await update('users', {
      ambassador_level: previousLevel >= 0 ? previousLevel : 0
    }, {
      id: user.id
    });
  }

  console.log(`[rollbackUpgrade] 大使升级回退完成`);
}

/**
 * 回退推荐人奖励
 */
async function rollbackRefereeReward(order) {
  try {
    // 1. 查询已发放的奖励记录
    const rewardRecords = await query(
      `SELECT * FROM cash_points_records
       WHERE user_id = ? AND source_type = 'referral' AND source_id = ?`,
      [order.referee_id, order.id]
    );

    // 2. 扣除推荐人的积分
    for (const record of rewardRecords) {
      await insert('cash_points_records', {
        user_id: order.referee_id,
        points_change: -record.points_change,
        balance_after: 0, // 会在触发器中计算
        source_type: 'refund',
        source_id: order.id,
        description: `订单退款回退奖励 - ${order.order_no}`
      });
    }

    console.log(`[rollbackRefereeReward] 推荐人奖励回退完成`);

  } catch (error) {
    console.error(`[rollbackRefereeReward] 失败:`, error);
    throw error;
  }
}