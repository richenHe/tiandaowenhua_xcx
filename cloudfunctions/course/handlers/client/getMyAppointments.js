/**
 * 获取我的预约列表（客户端接口）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { status, page = 1, page_size = 10, pageSize } = event;
  const { user } = context;

  try {
    console.log(`[Course/getMyAppointments] 收到请求:`, { user_id: user.id, status, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建基础查询 - 使用外键 JOIN
    let queryBuilder = db
      .from('appointments')
      .select(`
        id,
        course_id,
        class_record_id,
        status,
        checkin_code,
        checkin_time,
        created_at,
        cancel_reason,
        cancel_time,
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 添加状态过滤
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化数据
    const getStatusName = (status) => {
      const statusMap = {
        0: '待上课',
        1: '已签到',
        2: '缺席',
        3: '已取消'
      };
      return statusMap[status] || '未知';
    };

    const list = (result.list || []).map(a => ({
      id: a.id,
      course_id: a.course_id,
      course_name: a.course?.name,
      course_type: a.course?.type,
      class_record_id: a.class_record_id,
      class_date: a.class_record?.class_date,
      class_time: a.class_record?.class_time,
      location: a.class_record?.class_location,
      teacher: a.class_record?.teacher,
      status: a.status,
      status_name: getStatusName(a.status),
      checkin_code: a.checkin_code,
      checkin_at: a.checkin_time,
      appointed_at: a.created_at,
      cancelled_at: a.cancel_time
    }));

    console.log(`[Course/getMyAppointments] 查询成功，共 ${result.total} 条预约`);

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getMyAppointments] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
