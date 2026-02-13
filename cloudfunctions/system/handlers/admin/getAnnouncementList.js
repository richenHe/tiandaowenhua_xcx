/**
 * 管理端接口：获取公告列表
 * Action: getAnnouncementList
 *
 * 参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * - keyword: 关键词搜索（可选）
 * - category: 类型筛选（可选）
 * - status: 状态筛选（可选）
 */
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');
const { getTempFileURLs } = require('../../common/storage');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, pageSize = 20, keyword, category, status } = event;

  try {
    console.log(`[admin:getAnnouncementList] 管理员 ${admin.id} 获取公告列表`);

    const { limit, offset } = getPagination(page, pageSize);

    // 构建查询
    let query = db
      .from('announcements')
      .select('*')
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }
    if (category) query = query.eq('category', category);
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
    }

    // 分页
    const { data: announcements, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    if (keyword) {
      countQuery = countQuery.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }
    if (category) countQuery = countQuery.eq('category', category);
    if (status !== undefined && status !== null && status !== '') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: total } = await countQuery;

    // 🔥 转换云存储 fileID 为临时 URL
    if (announcements && announcements.length > 0) {
      const fileIDs = announcements
        .filter(a => a.cover_image)
        .map(a => a.cover_image);

      if (fileIDs.length > 0) {
        try {
          const tempURLs = await getTempFileURLs(fileIDs);
          const urlMap = {};
          tempURLs.forEach(item => {
            urlMap[item.fileID] = item.tempFileURL;
          });

          // 替换 fileID 为临时 URL
          announcements.forEach(a => {
            if (a.cover_image && urlMap[a.cover_image]) {
              a.cover_image = urlMap[a.cover_image];
            }
          });
        } catch (error) {
          console.warn('转换封面图片URL失败（不阻塞）:', error);
        }
      }
    }

    return response.success({
      list: announcements,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAnnouncementList] 失败:', error);
    return response.error('获取公告列表失败', error);
  }
};
