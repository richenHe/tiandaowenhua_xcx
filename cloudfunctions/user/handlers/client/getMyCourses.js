/**
 * 客户端接口：获取我的课程列表
 * Action: client:getMyCourses
 *
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能
 */
const { db } = require('../../common/db');
const { response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 10, pageSize } = event;

  try {
    console.log('[getMyCourses] 获取我的课程:', user.id);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询（利用外键 fk_user_courses_course）
    let queryBuilder = db
      .from('user_courses')
      .select(`
        *,
        course:courses!fk_user_courses_course(
          id,
          name,
          type,
          cover_image,
          original_price,
          current_price,
          retrain_price,
          description,
          duration,
          teacher,
          outline
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化数据
    const list = (result.list || []).map(uc => ({
      id: uc.id,
      user_id: uc.user_id,
      course_id: uc.course_id,
      buy_price: uc.buy_price,
      buy_time: uc.buy_time,
      attend_count: uc.attend_count,
      status: uc.status,
      created_at: uc.created_at,
      // 课程信息
      title: uc.course?.name,
      cover_image: uc.course?.cover_image,
      type: uc.course?.type,
      original_price: uc.course?.original_price,
      current_price: uc.course?.current_price,
      retrain_price: uc.course?.retrain_price,
      description: uc.course?.description,
      duration: uc.course?.duration,
      teacher: uc.course?.teacher,
      outline: uc.course?.outline
    }));

    console.log('[getMyCourses] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getMyCourses] 查询失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
