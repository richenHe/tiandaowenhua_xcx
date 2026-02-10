/**
 * 客户端接口：获取公告列表（公开接口）
 * Action: getAnnouncementList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认10，最大50）
 */
const { query, count } = require('../../common');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { page = 1, page_size = 10 } = event;

  try {
    console.log(`[client:getAnnouncementList] 获取公告列表, page=${page}, page_size=${page_size}`);

    // 限制每页最大数量
    const limitedPageSize = Math.min(parseInt(page_size), 50);
    const { limit, offset } = getPagination(page, limitedPageSize);

    // 使用 Query Builder 方式查询已发布的公告
    const queryOptions = {
      where: { status: 1 },
      columns: 'id, title, content, summary, cover_image, category, target_type, is_top, start_time, end_time, view_count, sort_order, published_at, created_at',
      limit,
      offset
    };

    const announcements = await query('announcements', queryOptions);

    // 统计总数
    const total = await count('announcements', { status: 1 });

    // 处理数据
    const processedAnnouncements = (announcements || []).map(a => ({
      ...a,
      category_text: getCategoryText(a.category),
      target_type_text: getTargetTypeText(a.target_type)
    }));

    return response.success({
      list: processedAnnouncements,
      total: total || 0,
      page: parseInt(page),
      page_size: limitedPageSize
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
