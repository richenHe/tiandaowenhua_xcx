/**
 * 获取课程列表（管理端接口）
 *
 * 使用 CloudBase Query Builder（不使用 mysql2，避免连接问题）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { type, status, keyword, page = 1, page_size = 10, pageSize } = event;

  console.log('[getCourseList] 开始执行');
  console.log('[getCourseList] 接收参数:', JSON.stringify({ type, status, keyword, page, page_size }));

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 使用 Query Builder 查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

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

    console.log('[getCourseList] 执行分页查询...');

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    console.log('[getCourseList] 查询成功:', { total: result.total, count: result.list?.length });

    // 格式化数据（添加 type_name）
    const getTypeName = (type) => {
      switch (type) {
        case 1: return '初探班';
        case 2: return '密训班';
        case 3: return '咨询服务';
        default: return '未知';
      }
    };

    const list = (result.list || []).map(course => ({
      ...course,
      type_name: getTypeName(course.type)
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getCourseList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
