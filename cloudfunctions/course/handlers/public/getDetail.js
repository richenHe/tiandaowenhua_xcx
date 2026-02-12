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

    // 如果用户已登录，查询购买状态和上课次数
    if (OPENID) {
      const user = await findOne('users', { _openid: OPENID });
      if (user) {
        // 查询是否已购买
        const { data: userCourse } = await db
          .from('user_courses')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single();

        course.is_purchased = !!userCourse;

        if (userCourse) {
          // 查询上课次数
          const { count: classCount } = await db
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_id', id)
            .eq('checkin_status', 1);

          course.class_count = classCount || 0;
        } else {
          course.class_count = 0;
        }
      }
    } else {
      course.is_purchased = false;
      course.class_count = 0;
    }

    return response.success(course);

  } catch (error) {
    console.error('[getDetail] 执行失败:', error);
    return response.error('获取课程详情失败', error);
  }
};
