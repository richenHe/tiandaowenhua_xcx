/**
 * 获取案例列表（公开接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');
const { getTempFileURL } = require('../../common/storage');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（注意：academy_cases 表没有 deleted_at 字段）
    let queryBuilder = db.from('academy_cases')
      .select('id, category, category_label, badge_theme, student_surname, student_name, student_desc, student_avatar, student_title, avatar_theme, title, summary, content, quote, achievements, video_url, images, course_name, view_count, like_count, is_featured, sort_order, created_at', { count: 'exact' })
      .eq('status', 1);

    // 添加分类过滤
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%,student_name.ilike.%${keyword}%`);
    }

    // 执行查询（带总数和分页）
    const { data: list, error, count: total } = await queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 处理返回数据 - 解析 JSON 字段
    const processedList = (list || []).map(caseItem => {
      try {
        // 解析 achievements JSON 字符串
        if (caseItem.achievements && typeof caseItem.achievements === 'string') {
          caseItem.achievements = JSON.parse(caseItem.achievements);
        }
        // 解析 images JSON 字符串
        if (caseItem.images && typeof caseItem.images === 'string') {
          caseItem.images = JSON.parse(caseItem.images);
        }
      } catch (e) {
        console.error('[getCaseList] JSON解析失败:', e);
      }
      return caseItem;
    });

    // 🔥 转换云存储 fileID 为临时 URL
    if (processedList && processedList.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      processedList.forEach(caseItem => {
        if (caseItem.student_avatar) fileIDs.push(caseItem.student_avatar);
        if (caseItem.video_url) fileIDs.push(caseItem.video_url);
        // images 是 JSON 数组，包含多个 fileID
        if (Array.isArray(caseItem.images)) {
          caseItem.images.forEach(imgFileID => {
            if (imgFileID) fileIDs.push(imgFileID);
          });
        }
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

      // 替换 processedList 中的 fileID 为临时 URL
      processedList.forEach(caseItem => {
        if (caseItem.student_avatar && urlMap[caseItem.student_avatar]) {
          caseItem.student_avatar = urlMap[caseItem.student_avatar];
        }
        if (caseItem.video_url && urlMap[caseItem.video_url]) {
          caseItem.video_url = urlMap[caseItem.video_url];
        }
        // 转换 images 数组中的 fileID
        if (Array.isArray(caseItem.images)) {
          caseItem.images = caseItem.images.map(imgFileID => 
            urlMap[imgFileID] || imgFileID
          );
        }
      });
    }

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: processedList
    });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
