/**
 * 创建案例（管理端接口）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    title,
    category,
    category_label,
    badge_theme,
    student_surname,
    student_name,
    student_avatar,
    student_title,
    student_desc,
    avatar_theme,
    summary,
    content,
    quote,
    achievements,
    video_url,
    images,
    course_id,
    course_name,
    sort_order,
    is_featured,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ title, student_name }, ['title', 'student_name']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建案例
    const [result] = await insert('academy_cases', {
      title,
      category,
      category_label,
      badge_theme: badge_theme || 'primary',
      student_surname,
      student_name,
      student_avatar,
      student_title,
      student_desc,
      avatar_theme: avatar_theme || 'default',
      summary,
      content,
      quote,
      achievements, // JSON 类型
      video_url,
      images, // JSON 类型
      course_id,
      course_name,
      view_count: 0,
      like_count: 0,
      sort_order: sort_order || 0,
      is_featured: is_featured || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      message: '案例创建成功',
      case_id: result.id
    });

  } catch (error) {
    console.error('[Course/createCase] 创建失败:', error);
    return response.error('创建案例失败', error);
  }
};
