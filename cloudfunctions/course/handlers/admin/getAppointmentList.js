/**
 * 获取预约列表（管理端接口）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, page = 1, page_size = 10, pageSize } = event;

  console.log('[getAppointmentList] 开始执行');
  console.log('[getAppointmentList] 接收参数:', JSON.stringify({ course_id, class_record_id, status, keyword, page, page_size }));

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询
    let queryBuilder = db
      .from('appointments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 添加课程过滤
    if (course_id) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(course_id));
    }

    // 添加排期过滤
    if (class_record_id) {
      queryBuilder = queryBuilder.eq('class_record_id', parseInt(class_record_id));
    }

    // 添加状态过滤
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    console.log('[getAppointmentList] 执行分页查询...');

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    console.log('[getAppointmentList] 查询成功:', { total: result.total, count: result.list?.length });

    // 格式化数据
    const getStatusName = (status) => {
      const map = {
        0: '待上课',
        1: '待上课',
        2: '已签到',
        3: '已取消'
      };
      return map[status] || '未知';
    };

    const list = (result.list || []).map(apt => ({
      ...apt,
      status_name: getStatusName(apt.status)
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getAppointmentList] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
