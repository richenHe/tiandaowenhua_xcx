/**
 * 获取课程列表（公开接口）
 * 支持课程类型筛选和关键词搜索
 * 使用 Supabase 风格查询
 */
const { db, findOne } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

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

    const { data: courses, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 如果已登录，查询用户购买记录
    let userCourseIds = [];
    if (OPENID && courses && courses.length > 0) {
      const user = await findOne('users', { openid: OPENID });
      if (user) {
        const { data: userCourses } = await db
          .from('user_courses')
          .select('course_id')
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        userCourseIds = (userCourses || []).map(uc => uc.course_id);
      }
    }

    // 格式化数据
    const getTypeName = (type) => {
      switch (type) {
        case 1: return '初探班';
        case 2: return '密训班';
        case 3: return '咨询服务';
        default: return '未知';
      }
    };

    const list = (courses || []).map(course => ({
      id: course.id,
      name: course.name,
      type: course.type,
      type_name: getTypeName(course.type),
      cover_image: course.cover_image,
      description: course.description,
      current_price: course.current_price,
      original_price: course.original_price,
      status: course.status,
      sort_order: course.sort_order,
      is_purchased: userCourseIds.includes(course.id) ? 1 : 0
    }));

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
