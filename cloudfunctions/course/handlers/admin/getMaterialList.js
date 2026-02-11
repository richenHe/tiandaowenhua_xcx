/**
 * 获取资料列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（注意：academy_materials 表没有 deleted_at、type、description、file_url 等字段）
    let queryBuilder = db
      .from('academy_materials')
      .select(`
        id,
        title,
        category,
        image_url,
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
      `, { count: 'exact' });

    // 添加分类过滤
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: list, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
