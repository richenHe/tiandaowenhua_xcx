/**
 * 更新案例（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_cases
 *
 * @param {Object} event
 * @param {number} event.id               - 案例 ID（必填）
 * @param {string} event.title            - 案例标题
 * @param {string} event.studentName      - 学员姓名，DB: student_name
 * @param {string} event.studentSurname   - 学员姓氏，DB: student_surname
 * @param {string} event.studentAvatar    - 学员头像 fileID，DB: student_avatar
 * @param {string} event.studentTitle     - 学员头衔/职业，DB: student_title
 * @param {string} event.studentDesc      - 学员描述，DB: student_desc
 * @param {string} event.category         - 分类 entrepreneur/startup/workplace
 * @param {string} event.categoryLabel    - 分类标签名称
 * @param {string} event.avatarTheme      - 头像主题色
 * @param {string} event.badgeTheme       - 徽章主题色
 * @param {string} event.summary          - 案例摘要
 * @param {string} event.content          - 案例详情
 * @param {string} event.quote            - 学习感悟
 * @param {Array}  event.achievements     - 成果列表（字符串数组）
 * @param {string} event.videoUrl         - 视频 fileID，DB: video_url
 * @param {Array}  event.images           - 图片 fileID 数组，DB: images (JSON)
 * @param {number} event.courseId         - 关联课程ID，DB: course_id
 * @param {string} event.courseName       - 课程名称，DB: course_name
 * @param {number} event.sortOrder        - 排序，DB: sort_order
 * @param {number} event.isFeatured       - 是否精选 0/1
 * @param {number} event.status           - 状态：0隐藏/1显示
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    id,
    title,
    studentName,
    studentSurname,
    studentAvatar,
    studentTitle,
    studentDesc,
    category,
    categoryLabel,
    avatarTheme,
    badgeTheme,
    summary,
    content,
    quote,
    achievements,
    videoUrl,
    images,
    courseId,
    courseName,
    sortOrder,
    isFeatured,
    status
  } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const caseItem = await findOne('academy_cases', { id });
    if (!caseItem) {
      return response.notFound('案例不存在');
    }

    let finalCourseName = courseName;
    if (courseId !== undefined && courseName === undefined) {
      const course = await findOne('courses', { id: courseId });
      if (course) {
        finalCourseName = course.name;
      }
    }

    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (studentName !== undefined) fieldsToUpdate.student_name = studentName;
    if (studentSurname !== undefined) fieldsToUpdate.student_surname = studentSurname;
    if (studentAvatar !== undefined) fieldsToUpdate.student_avatar = studentAvatar;
    if (studentTitle !== undefined) fieldsToUpdate.student_title = studentTitle;
    if (studentDesc !== undefined) fieldsToUpdate.student_desc = studentDesc;
    if (category !== undefined) fieldsToUpdate.category = category;
    if (categoryLabel !== undefined) fieldsToUpdate.category_label = categoryLabel;
    if (avatarTheme !== undefined) fieldsToUpdate.avatar_theme = avatarTheme;
    if (badgeTheme !== undefined) fieldsToUpdate.badge_theme = badgeTheme;
    if (summary !== undefined) fieldsToUpdate.summary = summary;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (quote !== undefined) fieldsToUpdate.quote = quote;
    if (achievements !== undefined) fieldsToUpdate.achievements = achievements && achievements.length ? JSON.stringify(achievements) : null;
    if (videoUrl !== undefined) fieldsToUpdate.video_url = videoUrl;
    if (images !== undefined) fieldsToUpdate.images = images ? JSON.stringify(images) : null;
    if (courseId !== undefined) fieldsToUpdate.course_id = courseId;
    if (finalCourseName !== undefined) fieldsToUpdate.course_name = finalCourseName;
    if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
    if (isFeatured !== undefined) fieldsToUpdate.is_featured = isFeatured ? 1 : 0;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    await update('academy_cases', fieldsToUpdate, { id });

    return response.success({
      success: true,
      message: '案例更新成功'
    });

  } catch (error) {
    console.error('[Course/updateCase] 更新失败:', error);
    return response.error('更新案例失败', error);
  }
};
