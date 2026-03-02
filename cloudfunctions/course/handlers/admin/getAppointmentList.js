/**
 * 获取预约列表（管理端接口）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, page = 1, page_size = 10, pageSize } = event;

  console.log('[getAppointmentList] 接收参数:', JSON.stringify({ course_id, class_record_id, status, keyword, page }));

  try {
    const finalPageSize = pageSize || page_size || 10;

    // 联表查询：JOIN users、courses、class_records
    let queryBuilder = db
      .from('appointments')
      .select(`
        id,
        course_id,
        class_record_id,
        status,
        checkin_code,
        checkin_time,
        cancel_reason,
        cancel_time,
        created_at,
        user:users!fk_appointments_user(
          id,
          real_name,
          phone
        ),
        course:courses!fk_appointments_course(
          name,
          type
        ),
        class_record:class_records!fk_appointments_class_record(
          class_date,
          class_time,
          class_location,
          teacher
        )
      `, { count: 'exact' })
      .order('id', { ascending: false });

    if (course_id) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(course_id));
    }
    if (class_record_id) {
      queryBuilder = queryBuilder.eq('class_record_id', parseInt(class_record_id));
    }
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }
    // 关键词搜索：按姓名或手机号（需要先查出 user_id 列表再过滤，这里简单支持 course_name 冗余字段搜索）
    if (keyword) {
      queryBuilder = queryBuilder.like('course_name', `%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const statusNameMap = {
      0: '待上课',
      1: '已签到',
      2: '缺席',
      3: '已取消'
    };

    const list = (result.list || []).map((apt, idx) => ({
      id: apt.id,
      // 生成预约编号（无独立字段，用 id 格式化展示）
      appointment_no: `APT${String(apt.id).padStart(6, '0')}`,
      user_name: apt.user?.real_name || '-',
      user_phone: apt.user?.phone || '-',
      course_id: apt.course_id,
      course_name: apt.course?.name || '-',
      course_type: apt.course?.type,
      class_record_id: apt.class_record_id,
      class_date: apt.class_record?.class_date || '-',
      class_time: apt.class_record?.class_time || '-',
      location: apt.class_record?.class_location || '-',
      teacher: apt.class_record?.teacher || '-',
      status: apt.status,
      status_name: statusNameMap[apt.status] ?? '未知',
      checkin_code: apt.checkin_code,
      checkin_at: apt.checkin_time,
      cancel_reason: apt.cancel_reason,
      cancel_at: apt.cancel_time,
      created_at: apt.created_at
    }));

    console.log('[getAppointmentList] 查询成功:', { total: result.total, count: list.length });

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[Course/getAppointmentList] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
