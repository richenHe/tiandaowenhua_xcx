/**
 * 获取课程详情（公开接口）
 * 包括购买状态和上课次数
 */
const { db, findOne } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;
  const { OPENID } = context;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    // 查询课程基本信息（courses 表没有 deleted_at 字段）
    const { data: course, error } = await db
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (error || !course) {
      return response.notFound('课程不存在或已下架');
    }

    // 添加类型名称
    const typeNames = { 1: '初探班', 2: '密训班', 3: '咨询服务' };
    course.type_name = typeNames[course.type] || '未知';

    // 初始化购买状态
    course.is_purchased = false;
    course.user_course_id = null;
    course.attend_count = 0;

    // 如果已登录，查询购买状态
    if (OPENID) {
      const user = await findOne('users', { openid: OPENID });
      if (user) {
        const { data: userCourse } = await db
          .from('user_courses')
          .select('id, attend_count, created_at')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .is('deleted_at', null)
          .single();

        if (userCourse) {
          course.is_purchased = true;
          course.user_course_id = userCourse.id;
          course.attend_count = userCourse.attend_count;
          course.purchase_date = userCourse.created_at;
        }
      }
    }

    return response.success(course);

  } catch (error) {
    console.error('[Course/getDetail] 查询失败:', error);
    return response.error('查询课程详情失败', error);
  }
};
