/**
 * 检查复训资格（客户端接口）
 *
 * 查询用户对指定课程是否有可抵用的复训资格（取消预约后保留的复训费）
 *
 * @param {Object} event
 * @param {number} event.courseId - 课程 ID（必填）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const courseId = event.courseId || event.course_id;
  const { user } = context;

  try {
    const validation = validateRequired({ courseId }, ['courseId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 1. 查用户对该课程的 user_course 记录
    const { data: userCourse } = await db
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', parseInt(courseId))
      .eq('status', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!userCourse) {
      return response.success({ has_credit: false });
    }

    // 2. 查是否有可抵用的复训订单（retrain_credit_status=1）
    const { data: creditOrder } = await db
      .from('orders')
      .select('id, order_no')
      .eq('user_id', user.id)
      .eq('order_type', 2)
      .eq('pay_status', 1)
      .eq('retrain_credit_status', 1)
      .eq('related_id', userCourse.id)
      .limit(1)
      .single();

    return response.success({
      has_credit: !!creditOrder
    });

  } catch (error) {
    console.error('[Course/checkRetrainCredit] 查询失败:', error);
    return response.error('查询复训资格失败', error);
  }
};
