/**
 * 客户端接口：获取可反馈的课程列表
 * Action: getFeedbackCourses
 *
 * 功能：返回所有上架课程，供用户在提交反馈时选择（不限于已购买）
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log(`[getFeedbackCourses] 用户 ${user.id} 获取可反馈课程`);

    // 返回所有上架课程，不限于已购买
    const courses = await query('courses', {
      where: { status: 1, is_deleted: 0 },
      columns: 'id, name, type'
    });

    return response.success(courses || [], '获取成功');

  } catch (error) {
    console.error('[getFeedbackCourses] 失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
