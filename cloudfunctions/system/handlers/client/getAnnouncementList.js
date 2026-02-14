/**
 * 客户端接口：获取公告列表（公开接口）
 * Action: getAnnouncementList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认10，最大50）
 */
const { db, response, executePaginatedQuery, storage } = require('common');

module.exports = async (event, context) => {
  const { page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[client:getAnnouncementList] 获取公告列表, page=${page}, page_size=${page_size}`);

    // 兼容 pageSize 参数，限制每页最大数量
    const finalPageSize = Math.min(parseInt(page_size || pageSize || 10), 50);

    // 构建查询
    let queryBuilder = db
      .from('announcements')
      .select('id, title, content, summary, cover_image, category, target_type, is_top, start_time, end_time, view_count, sort_order, published_at, created_at', { count: 'exact' })
      .eq('status', 1)
      .order('is_top', { ascending: false })
      .order('sort_order', { ascending: false })
      .order('published_at', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理数据并转换云存储 fileID 为临时 URL
    const list = await Promise.all((result.list || []).map(async a => {
      let coverImageUrl = a.cover_image || '';
      if (a.cover_image) {
        try {
          const tempResult = await storage.getTempFileURL(a.cover_image);
          if (tempResult.success && tempResult.tempFileURL) {
            coverImageUrl = tempResult.tempFileURL;
          } else {
            console.warn(`[getAnnouncementList] 转换临时URL失败，fileID: ${a.cover_image}, 错误: ${tempResult.message}`);
          }
        } catch (error) {
          console.warn('[getAnnouncementList] 转换临时URL失败:', a.cover_image, error.message);
        }
      }

      return {
        ...a,
        cover_image: coverImageUrl,
        category_text: getCategoryText(a.category),
        target_type_text: getTargetTypeText(a.target_type)
      };
    }));

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[client:getAnnouncementList] 失败:', error);
    return response.error('获取公告列表失败', error);
  }
};

// 获取类别文本
function getCategoryText(category) {
  const categoryMap = {
    'general': '普通公告',
    'important': '重要公告',
    'urgent': '紧急公告'
  };
  return categoryMap[category] || '普通公告';
}

// 获取目标用户文本
function getTargetTypeText(targetType) {
  const targetMap = {
    0: '全部用户',
    1: '学员',
    2: '大使'
  };
  return targetMap[targetType] || '全部用户';
}
