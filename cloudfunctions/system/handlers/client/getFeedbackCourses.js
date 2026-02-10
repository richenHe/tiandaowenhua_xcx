/**
 * 客户端接口：获取可反馈的课程列表
 * Action: getFeedbackCourses
 *
 * 功能：获取用户已购买的课程列表，用于提交反馈
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log(`[getFeedbackCourses] 用户 ${user.id} 获取可反馈课程`);

    // 查询用户已购买的课程
    const userCourses = await query('user_courses', {
      where: { user_id: user.id },
      columns: 'course_id'
    });

    if (!userCourses || userCourses.length === 0) {
      return response.success([], '暂无已购买的课程');
    }

    const courseIds = userCourses.map(uc => uc.course_id);

    // 查询课程详情
    const courses = await query('courses', {
      where: { status: 1 },
      columns: 'id, name, cover_image, type'
    });

    // 过滤出用户已购买的课程
    const purchasedCourses = courses.filter(c => courseIds.includes(c.id));

    return response.success(purchasedCourses, '获取成功');

  } catch (error) {
    console.error('[getFeedbackCourses] 失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
