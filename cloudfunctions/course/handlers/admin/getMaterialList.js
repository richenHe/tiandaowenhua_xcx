/**
 * 获取资料列表（管理端接口）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { category, status, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询
    let queryBuilder = db
      .from('academy_materials')
      .select(`
        id,
        title,
        category,
        image_url,
        images,
        video_url,
        content,
        tags,
        view_count,
        download_count,
        share_count,
        sort_order,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('id', { ascending: false });

    // 添加分类过滤
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加状态过滤
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,content.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 管理端保留 cloud:// fileID，便于编辑回写；前台展示由后台页用 cloudFileIDToURL 自行转换
    const list = result.list || [];

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
