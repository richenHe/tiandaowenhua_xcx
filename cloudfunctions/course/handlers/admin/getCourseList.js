/**
 * 获取课程列表（管理端接口）
 * 
 * 使用 CloudBase Query Builder（不使用 mysql2，避免连接问题）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { type, status, keyword, page = 1, page_size = 10 } = event;

  console.log('[getCourseList] 开始执行');
  console.log('[getCourseList] 接收参数:', JSON.stringify({ type, status, keyword, page, page_size }));

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 使用 Query Builder 查询（设置 ADMINONLY 权限后应该可用）
    let queryBuilder = db
      .from('courses')  // 数据库名已在 db.js 中配置
      .select('*', { count: 'exact' });

    // 添加类型过滤
    if (type) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 添加状态过滤
    if (status !== undefined && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('[getCourseList] 执行 Query Builder 查询...');
    
    // 执行查询
    const result = await queryBuilder;
    
    console.log('[getCourseList] Query Builder 原始结果:', JSON.stringify(result));
    
    const { data: courses, error, count: total } = result;

    if (error) {
      console.error('[getCourseList] Query Builder 错误:', error);
      throw new Error(error.message || '数据库查询失败');
    }

    console.log('[getCourseList] 查询成功:', { total, count: courses?.length });

    // 格式化数据（添加 type_name）
    const getTypeName = (type) => {
      switch (type) {
        case 1: return '初探班';
        case 2: return '密训班';
        case 3: return '咨询服务';
        default: return '未知';
      }
    };

    const list = (courses || []).map(course => ({
      ...course,
      type_name: getTypeName(course.type)
    }));

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getCourseList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
