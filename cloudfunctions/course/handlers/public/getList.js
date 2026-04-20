/**
 * 获取课程列表（公开接口）
 * 支持课程类型筛选和关键词搜索
 * 使用 Supabase 风格查询
 */
const { db, findOne, response, executePaginatedQuery, cloudFileIDToURL, formatBeijingDate } = require('common');

module.exports = async (event, context) => {
  const { type, keyword, page = 1, page_size = 10, pageSize } = event;
  const { OPENID } = context;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询：上架且未软删除（与后台列表一致，避免已删除课程仍出现在小程序）
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 1)
      .eq('is_deleted', 0)
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false });

    // 添加类型过滤
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`name.like.%${keyword}%,description.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

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

    // 本页课程各自「最近一场未开始排期」的首日 class_date（status=1 且日期≥今天，北京日历）
    const rawList = result.list || [];
    const courseIds = rawList.map(c => c.id).filter(Boolean);
    const nextDateByCourseId = {};
    if (courseIds.length > 0) {
      const today = formatBeijingDate();
      const { data: scheduleRows, error: schedErr } = await db
        .from('class_records')
        .select('course_id, class_date')
        .in('course_id', courseIds)
        .eq('status', 1)
        .gte('class_date', today);
      if (schedErr) {
        console.error('[getList] 排期日期聚合失败:', schedErr);
      } else {
        for (const row of scheduleRows || []) {
          const cid = row.course_id;
          const d = row.class_date;
          if (d == null) continue;
          const prev = nextDateByCourseId[cid];
          if (!prev || String(d) < String(prev)) {
            nextDateByCourseId[cid] = d;
          }
        }
      }
    }

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL，添加已购标识与下一排期日
    const list = rawList.map(course => ({
      ...course,
      cover_image: cloudFileIDToURL(course.cover_image || ''),
      is_purchased: userCourseIds.includes(course.id),
      next_class_date: nextDateByCourseId[course.id] || null
    }));

    console.log(`[getList] 查询成功，共 ${result.total} 条`);
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getList] 执行失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
