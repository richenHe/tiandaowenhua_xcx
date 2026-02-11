/**
 * 获取上课排期列表（客户端接口）
 */
const { db, response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, start_date, end_date, page = 1, page_size = 10 } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ course_id }, ['course_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    console.log(`[Course/getClassRecords] 收到请求:`, { course_id, start_date, end_date, page });

    // 计算分页参数
    const limit = parseInt(page_size) || 10;
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询
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
        booked_quota
      `, { count: 'exact' })
      .eq('course_id', course_id)
      .eq('status', 1);

    // 日期过滤
    if (start_date) {
      queryBuilder = queryBuilder.gte('class_date', start_date);
    }

    if (end_date) {
      queryBuilder = queryBuilder.lte('class_date', end_date);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('class_date', { ascending: true })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: classRecords, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 查询当前用户的预约记录
    const classRecordIds = (classRecords || []).map(cr => cr.id);
    let userAppointments = [];
    
    if (classRecordIds.length > 0) {
      const { data: appointments } = await db
        .from('appointments')
        .select('class_record_id')
        .eq('user_id', user.id)
        .in('class_record_id', classRecordIds)
        .in('status', [1, 2]); // 1=待上课, 2=已签到
      
      userAppointments = (appointments || []).map(a => a.class_record_id);
    }

    // 格式化数据
    const list = (classRecords || []).map(cr => ({
      id: cr.id,
      course_id: cr.course_id,
      course_name: cr.course_name,
      class_date: cr.class_date,
      class_time: cr.class_time,
      location: cr.class_location,
      teacher: cr.teacher,
      max_students: cr.total_quota,
      current_students: cr.booked_quota,
      available_quota: cr.total_quota - cr.booked_quota,
      is_appointed: userAppointments.includes(cr.id) ? 1 : 0
    }));

    console.log(`[Course/getClassRecords] 查询成功，共 ${total} 条排期`);

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getClassRecords] 查询失败:', error);
    return response.error('查询上课排期失败', error);
  }
};
