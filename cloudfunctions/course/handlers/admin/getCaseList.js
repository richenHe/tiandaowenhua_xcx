/**
 * 获取案例列表（管理端接口）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { category, status, keyword, courseId, page = 1, page_size = 10, pageSize } = event;

  try {
    const finalPageSize = pageSize || page_size || 10;

    let queryBuilder = db
      .from('academy_cases')
      .select(`
        id, student_name, student_surname, student_avatar, student_title, student_desc,
        category, category_label, avatar_theme, badge_theme,
        title, summary, content, quote, achievements,
        video_url, images, course_id, course_name,
        view_count, like_count, sort_order, is_featured, status,
        created_at, updated_at
      `, { count: 'exact' })
      .order('id', { ascending: false });

    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    if (courseId) {
      queryBuilder = queryBuilder.eq('course_id', parseInt(courseId));
    }

    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,summary.like.%${keyword}%,student_name.like.%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const list = (result.list || []).map(item => {
      let images = [];
      try { images = item.images ? JSON.parse(item.images) : []; } catch (e) {}
      let achievements = [];
      try { achievements = item.achievements ? JSON.parse(item.achievements) : []; } catch (e) {}
      return {
        ...item,
        student_avatar: cloudFileIDToURL(item.student_avatar || ''),
        video_url: cloudFileIDToURL(item.video_url || ''),
        images: images.map(img => cloudFileIDToURL(img)),
        achievements
      };
    });

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
