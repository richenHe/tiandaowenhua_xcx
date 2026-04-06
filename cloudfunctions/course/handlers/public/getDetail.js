/**
 * 获取课程详情（公开接口）
 * 包括购买状态和上课次数
 */
const { db, findOne, response, validateRequired, cloudFileIDToURL } = require('common');
const { enrichCourseRichFieldsForClient } = require('../../common/courseRichBlocks');

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
      .eq('is_deleted', 0)
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
        // 查询是否已购买（status=1 有效记录优先，其次看 status=3 过期记录）
        const { data: userCourseList } = await db
          .from('user_courses')
          .select('id, status, attend_count')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .in('status', [1, 3])
          .order('status', { ascending: true })
          .limit(1);

        const userCourse = userCourseList && userCourseList[0];
        course.is_purchased = !!userCourse;

        if (userCourse) {
          course.user_course_id = userCourse.id;
          // 返回课程状态：1=有效，3=已过期
          course.user_course_status = userCourse.status;
          // 查询上课次数
          const { count: classCount } = await db
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_id', id)
            .eq('checkin_status', 1);

          course.class_count = classCount || 0;
        } else {
          course.user_course_status = null;
          course.class_count = 0;
        }
      }
    } else {
      course.is_purchased = false;
      course.class_count = 0;
    }

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL
    if (course.cover_image) {
      course.cover_image = cloudFileIDToURL(course.cover_image);
    }

    // 课程简介 / 大纲图文块（含图片 CDN URL）+ outline 纯文字数组兼容
    enrichCourseRichFieldsForClient(course);

    // 密训班赠送课程信息：查询 included_course_ids 对应课程的基本信息
    course.gift_courses = [];
    let giftIds = course.included_course_ids;
    if (typeof giftIds === 'string') {
      try { giftIds = JSON.parse(giftIds); } catch (e) { giftIds = []; }
    }
    if (giftIds && giftIds.length > 0) {
      for (const giftId of giftIds) {
        const { data: gc } = await db
          .from('courses')
          .select('id, name, type, cover_image, validity_days, description, description_blocks, content, outline, outline_blocks, teacher')
          .eq('id', giftId)
          .eq('is_deleted', 0)
          .single();
        if (gc) {
          const typeNames2 = { 1: '初探班', 2: '密训班', 3: '咨询服务', 4: '沙龙' };
          gc.type_name = typeNames2[gc.type] || '未知';
          if (gc.cover_image) gc.cover_image = cloudFileIDToURL(gc.cover_image);
          enrichCourseRichFieldsForClient(gc);
          course.gift_courses.push(gc);
        }
      }
    }

    return response.success(course);

  } catch (error) {
    console.error('[getDetail] 执行失败:', error);
    return response.error('获取课程详情失败', error);
  }
};
