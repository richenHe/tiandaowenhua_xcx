/**
 * 管理端接口：用户课程列表查询
 * Action: getUserCourseList
 *
 * 支持按用户姓名/手机号关键词、课程ID、状态筛选，分页返回
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { page = 1, pageSize = 20, keyword, courseId, status } = event;

  try {
    console.log('[admin:getUserCourseList] 查询用户课程列表');

    // 关联查询 user_courses + users + courses
    let queryBuilder = db.from('user_courses')
      .select(`
        id, user_id, course_id, course_type, course_name, order_no,
        buy_price, buy_time, is_gift, attend_count, expire_at,
        contract_signed, pending_days, status, created_at,
        user:users!fk_user_courses_user(id, real_name, phone, ambassador_level),
        course:courses!fk_user_courses_course(id, name, type, need_contract)
      `, { count: 'exact' })
      .order('id', { ascending: false });

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 课程筛选
    if (courseId) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(courseId));
    }

    // 关键词搜索（用户姓名或手机号）— 需要用 user_id IN 子查询
    if (keyword) {
      const { data: matchedUsers } = await db.from('users')
        .select('id')
        .or(`real_name.like.%${keyword}%,phone.like.%${keyword}%`);

      if (matchedUsers && matchedUsers.length > 0) {
        const userIds = matchedUsers.map(u => u.id);
        queryBuilder = queryBuilder.in('user_id', userIds);
      } else {
        return response.success({
          list: [], total: 0, page: parseInt(page),
          pageSize: parseInt(pageSize), totalPages: 0,
          hasMore: false, hasPrev: false
        });
      }
    }

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    // 课程类型映射
    const courseTypeMap = { 1: '初探班', 2: '密训班', 3: '咨询服务', 4: '沙龙' };
    const statusMap = { 0: '无效', 1: '有效', 2: '已退款', 3: '已过期' };

    const list = (result.list || []).map(item => ({
      ...item,
      user_name: item.user?.real_name || '-',
      user_phone: item.user?.phone || '-',
      course_type_text: courseTypeMap[item.course_type] || '未知',
      status_text: statusMap[item.status] || '未知',
      contract_signed_text: item.contract_signed ? '已签' : '未签',
      user: undefined
    }));

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[admin:getUserCourseList] 查询失败:', error);
    return response.error('获取用户课程列表失败', error);
  }
};
