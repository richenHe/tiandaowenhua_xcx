/**
 * 获取案例列表（公开接口）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    const finalPageSize = pageSize || page_size || 10;

    let queryBuilder = db.from('academy_cases')
      .select(`
        id, student_name, student_surname, student_avatar, student_title, student_desc,
        category, category_label, avatar_theme, badge_theme,
        title, summary, content, quote, achievements,
        video_url, images, course_id, course_name,
        view_count, like_count, is_featured, sort_order, status, created_at
      `, { count: 'exact' })
      .eq('status', 1)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false });

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,summary.like.%${keyword}%,student_name.like.%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const processedList = (result.list || []).map(caseItem => {
      try {
        if (caseItem.images && typeof caseItem.images === 'string') {
          caseItem.images = JSON.parse(caseItem.images);
        }
      } catch (e) { caseItem.images = []; }
      try {
        if (caseItem.achievements && typeof caseItem.achievements === 'string') {
          caseItem.achievements = JSON.parse(caseItem.achievements);
        }
      } catch (e) { caseItem.achievements = []; }

      if (caseItem.student_avatar) caseItem.student_avatar = cloudFileIDToURL(caseItem.student_avatar);
      if (caseItem.video_url) caseItem.video_url = cloudFileIDToURL(caseItem.video_url);
      if (Array.isArray(caseItem.images)) {
        caseItem.images = caseItem.images.map(imgFileID => cloudFileIDToURL(imgFileID));
      }

      caseItem.cover_image = (Array.isArray(caseItem.images) && caseItem.images.length > 0)
        ? caseItem.images[0]
        : (caseItem.student_avatar || null);

      return caseItem;
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
