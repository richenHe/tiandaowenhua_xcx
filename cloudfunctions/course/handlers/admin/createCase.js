/**
 * 创建案例（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_cases
 *
 * @param {Object} event
 * @param {string} event.title            - 案例标题（必填）
 * @param {string} event.studentName      - 学员姓名（必填），DB: student_name
 * @param {string} event.studentSurname   - 学员姓氏，DB: student_surname
 * @param {string} event.studentAvatar    - 学员头像 fileID，DB: student_avatar
 * @param {string} event.studentTitle     - 学员头衔/职业，DB: student_title
 * @param {string} event.studentDesc      - 学员描述，DB: student_desc
 * @param {string} event.category         - 分类 entrepreneur/startup/workplace
 * @param {string} event.categoryLabel    - 分类标签名称
 * @param {string} event.avatarTheme      - 头像主题色 default/success/primary
 * @param {string} event.badgeTheme       - 徽章主题色 warning/success/primary
 * @param {string} event.summary          - 案例摘要
 * @param {string} event.content          - 案例详情
 * @param {string} event.quote            - 学习感悟
 * @param {Array}  event.achievements     - 成果列表（字符串数组）
 * @param {string} event.videoUrl         - 视频 fileID，DB: video_url
 * @param {Array}  event.images           - 图片 fileID 数组，DB: images (JSON)
 * @param {number} event.courseId         - 关联课程ID，DB: course_id
 * @param {string} event.courseName       - 课程名称，DB: course_name
 * @param {number} event.sortOrder        - 排序，DB: sort_order（默认 0）
 * @param {number} event.isFeatured       - 是否精选 0/1
 * @param {number} event.status           - 状态：0隐藏/1显示（默认 1）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const title = event.title;
  const studentName = event.studentName || event.student_name;
  const studentSurname = event.studentSurname || event.student_surname;
  const studentAvatar = event.studentAvatar || event.student_avatar;
  const studentTitle = event.studentTitle || event.student_title;
  const studentDesc = event.studentDesc || event.student_desc;
  const category = event.category;
  const categoryLabel = event.categoryLabel || event.category_label;
  const avatarTheme = event.avatarTheme || event.avatar_theme;
  const badgeTheme = event.badgeTheme || event.badge_theme;
  const summary = event.summary;
  const content = event.content;
  const quote = event.quote;
  const achievements = event.achievements;
  const videoUrl = event.videoUrl || event.video_url;
  const images = event.images;
  const courseId = event.courseId || event.course_id;
  const courseName = event.courseName || event.course_name;
  const sortOrder = event.sortOrder || event.sort_order;
  const isFeatured = event.isFeatured !== undefined ? event.isFeatured : (event.is_featured || 0);
  const status = event.status;

  try {
    const validation = validateRequired(
      { title, studentName },
      ['title', 'studentName']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    let finalCourseName = courseName;
    if (courseId && !courseName) {
      const { findOne } = require('../../common/db');
      const course = await findOne('courses', { id: courseId });
      if (course) {
        finalCourseName = course.name;
      }
    }

    const [result] = await insert('academy_cases', {
      title,
      student_name: studentName,
      student_surname: studentSurname || null,
      student_avatar: studentAvatar || null,
      student_title: studentTitle || null,
      student_desc: studentDesc || null,
      category: category || null,
      category_label: categoryLabel || null,
      avatar_theme: avatarTheme || 'default',
      badge_theme: badgeTheme || 'primary',
      summary: summary || null,
      content: content || null,
      quote: quote || null,
      achievements: achievements && achievements.length ? JSON.stringify(achievements) : null,
      video_url: videoUrl || null,
      images: images ? JSON.stringify(images) : null,
      course_id: courseId || null,
      course_name: finalCourseName || null,
      view_count: 0,
      like_count: 0,
      sort_order: sortOrder || 0,
      is_featured: isFeatured ? 1 : 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      case_id: result.id
    }, '案例创建成功');

  } catch (error) {
    console.error('[Course/createCase] 创建失败:', error);
    return response.error('创建案例失败', error);
  }
};
