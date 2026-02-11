/**
 * 获取预约列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（使用多个外键 JOIN）- 注意：appointments 表没有 deleted_at 字段
    let queryBuilder = db
      .from('appointments')
      .select(`
        id,
        user_id,
        user_uid,
        user_name,
        user_phone,
        class_record_id,
        user_course_id,
        course_id,
        course_name,
        is_retrain,
        order_no,
        checkin_code,
        checkin_time,
        checkin_admin_id,
        status,
        cancel_reason,
        cancel_time,
        remark,
        created_at,
        updated_at,
        user:users!fk_appointments_user(
          id,
          real_name,
          phone
        ),
        course:courses!fk_appointments_course(
          name
        ),
        class_record:class_records!fk_appointments_class_record(
          class_date,
          class_time,
          class_location
        )
      `, { count: 'exact' });

    // 添加课程过滤
    if (course_id) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(course_id));
    }

    // 添加排期过滤
    if (class_record_id) {
      queryBuilder = queryBuilder.eq('class_record_id', parseInt(class_record_id));
    }

    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索（注意：Query Builder 不支持 JOIN 表字段搜索，需要在客户端过滤或使用 user_name/user_phone）
    if (keyword) {
      queryBuilder = queryBuilder.or(`user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: appointments, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 格式化数据（扁平化嵌套字段）
    const getStatusName = (status) => {
      const map = {
        0: '待上课',
        1: '待上课',
        2: '已签到',
        3: '已取消'
      };
      return map[status] || '未知';
    };

    const list = (appointments || []).map(apt => ({
      id: apt.id,
      user_id: apt.user_id,
      real_name: apt.user?.real_name || apt.user_name || '',
      phone: apt.user?.phone || apt.user_phone || '',
      course_id: apt.course_id,
      course_name: apt.course?.name || apt.course_name || '',
      class_record_id: apt.class_record_id,
      class_date: apt.class_record?.class_date || '',
      class_time: apt.class_record?.class_time || '',
      class_location: apt.class_record?.class_location || '',
      is_retrain: apt.is_retrain,
      order_no: apt.order_no,
      status: apt.status,
      status_name: getStatusName(apt.status),
      checkin_code: apt.checkin_code,
      checkin_at: apt.checkin_time,
      appointed_at: apt.created_at,
      cancelled_at: apt.cancel_time,
      cancel_reason: apt.cancel_reason,
      remark: apt.remark
    }));

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getAppointmentList] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
