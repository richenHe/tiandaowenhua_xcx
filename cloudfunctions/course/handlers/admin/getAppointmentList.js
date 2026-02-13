/**
 * 获取预约列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, page = 1, page_size = 10 } = event;

  console.log('[getAppointmentList] 开始执行');
  console.log('[getAppointmentList] 接收参数:', JSON.stringify({ course_id, class_record_id, status, keyword, page, page_size }));

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（暂时去掉 JOIN，测试权限）
    console.log('[getAppointmentList] 准备查询 appointments 表...');
    
    let queryBuilder = db
      .from('appointments')
      .select('*', { count: 'exact' });

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

    // 添加关键词搜索（注意：Query Builder 不支持 JOIN 表字段搜索，需要在客户端过滤或使用 user_name/user_phone）
    if (keyword) {
      queryBuilder = queryBuilder.or(`user_name.ilike.%${keyword}%,user_phone.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('[getAppointmentList] 执行 Query Builder 查询...');
    
    // 执行查询
    const result = await queryBuilder;
    
    console.log('[getAppointmentList] Query Builder 原始结果:', JSON.stringify(result));
    
    const { data: appointments, error, count: total } = result;

    if (error) {
      console.error('[getAppointmentList] Query Builder 错误:', error);
      throw error;
    }
    
    console.log('[getAppointmentList] 查询成功:', { total, count: appointments?.length });

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

    // 简化数据格式（暂时不做复杂处理，直接返回原始数据）
    const list = (appointments || []).map(apt => ({
      ...apt,
      status_name: getStatusName(apt.status)
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
