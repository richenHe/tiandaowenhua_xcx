/**
 * 获取课程列表（公开接口）
 * 支持课程类型筛选和关键词搜索
 * 使用 Supabase 风格查询
 */
const { db, findOne, response, getPagination, getTempFileURL } = require('common');

module.exports = async (event, context) => {
  const { type, keyword, page = 1, page_size = 10 } = event;
  const { OPENID } = context;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（courses 表没有 deleted_at 字段）
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加类型过滤
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data: courses, error, count } = await queryBuilder;

    if (error) {
      console.error('[getList] 查询课程失败:', error);
      return response.error('获取课程列表失败', error);
    }

    // 如果用户已登录，查询已购课程
    let userCourseIds = [];
    if (OPENID) {
      const user = await findOne('users', { _openid: OPENID });
      if (user) {
        const { data: userCourses } = await db
          .from('user_courses')
          .select('course_id')
          .eq('user_id', user.id);

        if (userCourses && userCourses.length > 0) {
          userCourseIds = userCourses.map(uc => uc.course_id);
        }
      }
    }

    // 添加已购标识并转换云存储 fileID 为临时 URL
    const list = await Promise.all((courses || []).map(async course => {
      let coverImageUrl = course.cover_image || '';
      if (course.cover_image) {
        try {
          const result = await getTempFileURL(course.cover_image);
          coverImageUrl = result.tempFileURL || course.cover_image;
        } catch (error) {
          console.warn('[getList] 转换临时URL失败:', course.cover_image, error.message);
        }
      }
      
      return {
        ...course,
        cover_image: coverImageUrl,
        is_purchased: userCourseIds.includes(course.id)
      };
    }));

    console.log(`[getList] 查询成功，共 ${count} 条`);
    return response.success({
      list,
      total: count || 0,
      page,
      page_size
    });

  } catch (error) {
    console.error('[getList] 执行失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
