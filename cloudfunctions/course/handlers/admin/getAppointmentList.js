/**
 * 获取预约列表（管理端接口）
 *
 * 支持按课程、排期、状态、关键词、日期筛选
 * 状态名根据课程类型区分：非沙龙 0→进行中/1→已结课；沙龙 0→待上课/1→已签到/2→已结课
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, date, page = 1, page_size = 10, pageSize } = event;

  console.log('[getAppointmentList] 接收参数:', JSON.stringify({ course_id, class_record_id, status, keyword, date, page }));

  try {
    const finalPageSize = pageSize || page_size || 10;

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
          class_end_date,
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
    if (keyword) {
      queryBuilder = queryBuilder.like('course_name', `%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 状态名映射：根据课程类型区分
    const getNonSalonStatusName = (s) => ({ 0: '进行中', 1: '已结课', 3: '已取消', 4: '缺席' }[s] || '未知');
    const getSalonStatusName = (s) => ({ 0: '待上课', 1: '已签到', 2: '已结课', 3: '已取消' }[s] || '未知');

    let list = (result.list || []).map((apt) => {
      const courseType = apt.course?.type;
      const isSalon = courseType === 4;
      const statusName = isSalon ? getSalonStatusName(apt.status) : getNonSalonStatusName(apt.status);

      return {
        id: apt.id,
        appointment_no: `APT${String(apt.id).padStart(6, '0')}`,
        user_name: apt.user?.real_name || '-',
        user_phone: apt.user?.phone || '-',
        course_id: apt.course_id,
        course_name: apt.course?.name || '-',
        course_type: courseType,
        class_record_id: apt.class_record_id,
        class_date: apt.class_record?.class_date || '-',
        class_end_date: apt.class_record?.class_end_date || apt.class_record?.class_date || '-',
        class_time: apt.class_record?.class_time || '-',
        location: apt.class_record?.class_location || '-',
        teacher: apt.class_record?.teacher || '-',
        status: apt.status,
        status_name: statusName,
        is_salon: isSalon,
        checkin_code: apt.checkin_code,
        checkin_at: apt.checkin_time,
        cancel_reason: apt.cancel_reason,
        cancel_at: apt.cancel_time,
        created_at: apt.created_at
      };
    });

    // 日期筛选（按排期开始日期过滤）
    if (date) {
      list = list.filter(item => item.class_date === date);
    }

    console.log('[getAppointmentList] 查询成功:', { total: result.total, count: list.length });

    return response.success({ ...result, list, total: date ? list.length : result.total });

  } catch (error) {
    console.error('[getAppointmentList] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
