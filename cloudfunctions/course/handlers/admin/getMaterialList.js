/**
 * 获取资料列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');
const { getTempFileURL } = require('../../common/storage');

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

    // 🔥 转换云存储 fileID 为临时 URL（管理端也需要显示）
    if (list && list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(item => {
        if (item.image_url) fileIDs.push(item.image_url);
        if (item.video_url) fileIDs.push(item.video_url);
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(item => {
        if (item.image_url && urlMap[item.image_url]) {
          item.image_url = urlMap[item.image_url];
        }
        if (item.video_url && urlMap[item.video_url]) {
          item.video_url = urlMap[item.video_url];
        }
      });
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
