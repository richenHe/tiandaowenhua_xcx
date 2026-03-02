/**
 * 获取课程列表（管理端接口）
 *
 * 使用 CloudBase Query Builder（不使用 mysql2，避免连接问题）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { type, status, keyword, page = 1, page_size = 10, pageSize } = event;

  console.log('[getCourseList] 开始执行');
  console.log('[getCourseList] 接收参数:', JSON.stringify({ type, status, keyword, page, page_size }));

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 使用 Query Builder 查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true });

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
      queryBuilder = queryBuilder.or(`name.like.%${keyword}%,description.like.%${keyword}%`);
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

    // 🔥 同时转换封面图 cloud:// fileID 为 CDN HTTPS URL
    const list = (result.list || []).map(course => ({
      ...course,
      cover_image: cloudFileIDToURL(course.cover_image || ''),
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
