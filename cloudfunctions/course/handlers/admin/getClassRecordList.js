/**
 * 获取上课排期列表（管理端接口）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { course_id, status, start_date, end_date, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询（使用外键 JOIN）
    let queryBuilder = db
      .from('class_records')
      .select(`
        id,
        course_id,
        course_name,
        course_type,
        period,
        class_date,
        class_time,
        class_location,
        teacher,
        total_quota,
        booked_quota,
        booking_deadline,
        retrain_deadline,
        status,
        remark,
        created_at,
        updated_at,
        course:courses!fk_class_records_course(
          name,
          type
        )
      `, { count: 'exact' })
      .order('class_date', { ascending: false });

    // 添加课程过滤
    if (course_id) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(course_id));
    }

    // 添加状态过滤
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加日期过滤
    if (start_date) {
      queryBuilder = queryBuilder.gte('class_date', start_date);
    }

    if (end_date) {
      queryBuilder = queryBuilder.lte('class_date', end_date);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化数据（扁平化嵌套字段，计算可用名额）
    const list = (result.list || []).map(record => ({
      id: record.id,
      course_id: record.course_id,
      course_name: record.course?.name || record.course_name || '',
      course_type: record.course?.type || record.course_type || 0,
      period: record.period,
      class_date: record.class_date,
      class_time: record.class_time,
      class_location: record.class_location,
      teacher: record.teacher,
      total_quota: record.total_quota,
      booked_quota: record.booked_quota,
      available_quota: record.total_quota - record.booked_quota,
      booking_deadline: record.booking_deadline,
      retrain_deadline: record.retrain_deadline,
      status: record.status,
      remark: record.remark,
      created_at: record.created_at,
      updated_at: record.updated_at
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getClassRecordList] 查询失败:', error);
    return response.error('查询上课排期列表失败', error);
  }
};
