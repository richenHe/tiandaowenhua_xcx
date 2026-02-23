/**
 * 获取案例列表（公开接口）
 */
const { db, response, executePaginatedQuery, getTempFileURL } = require('../../common');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询（注意：academy_cases 表没有 deleted_at 字段）
    let queryBuilder = db.from('academy_cases')
      .select('id, student_name, student_avatar, student_title, title, summary, content, video_url, images, course_id, course_name, view_count, like_count, is_featured, sort_order, status, created_at', { count: 'exact' })
      .eq('status', 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 添加分类过滤
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%,student_name.ilike.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理返回数据 - 解析 JSON 字段
    const processedList = (result.list || []).map(caseItem => {
      try {
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

    // 添加 cover_image：取 images 第一张，无图片时取 student_avatar 作为兜底
    processedList.forEach(caseItem => {
      caseItem.cover_image = (Array.isArray(caseItem.images) && caseItem.images.length > 0)
        ? caseItem.images[0]
        : (caseItem.student_avatar || null);
    });

    return response.success({
      ...result,
      list: processedList
    });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
