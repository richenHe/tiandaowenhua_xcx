/**
 * 创建案例（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_cases
 * 关键字段：student_name（必填）、student_avatar、summary、course_id、sort_order
 *
 * @param {Object} event
 * @param {string} event.title         - 案例标题（必填）
 * @param {string} event.studentName   - 学员姓名（必填），对应 DB 字段 student_name
 * @param {string} event.studentAvatar - 学员头像URL，对应 DB 字段 student_avatar
 * @param {string} event.studentTitle  - 学员头衔/职业，对应 DB 字段 student_title
 * @param {string} event.summary       - 案例摘要，对应 DB 字段 summary
 * @param {string} event.content       - 案例详情
 * @param {string} event.videoUrl      - 视频URL，对应 DB 字段 video_url
 * @param {Array}  event.images        - 图片数组，对应 DB 字段 images（JSON）
 * @param {number} event.courseId      - 关联课程ID，对应 DB 字段 course_id
 * @param {string} event.courseName    - 课程名称，对应 DB 字段 course_name
 * @param {number} event.sortOrder     - 排序，对应 DB 字段 sort_order（默认 0）
 * @param {number} event.status        - 状态：0隐藏/1显示（默认 1）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数，同时兼容 snake_case（防止旧客户端传参）
  const title = event.title;
  const studentName = event.studentName || event.student_name;
  const studentAvatar = event.studentAvatar || event.student_avatar;
  const studentTitle = event.studentTitle || event.student_title;
  const summary = event.summary;
  const content = event.content;
  const videoUrl = event.videoUrl || event.video_url;
  const images = event.images;
  const courseId = event.courseId || event.course_id;
  const courseName = event.courseName || event.course_name;
  const sortOrder = event.sortOrder || event.sort_order;
  const status = event.status;

  try {
    // 参数验证（camelCase key）
    const validation = validateRequired(
      { title, studentName },
      ['title', 'studentName']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 如果有 courseId 但没有 courseName，自动查询课程名称
    let finalCourseName = courseName;
    if (courseId && !courseName) {
      const { findOne } = require('../../common/db');
      const course = await findOne('courses', { id: courseId });
      if (course) {
        finalCourseName = course.name;
      }
    }

    // camelCase → snake_case，写入 DB
    const [result] = await insert('academy_cases', {
      title,
      student_name: studentName,
      student_avatar: studentAvatar || null,
      student_title: studentTitle || null,
      summary: summary || null,
      content: content || null,
      video_url: videoUrl || null,
      images: images ? JSON.stringify(images) : null,
      course_id: courseId || null,
      course_name: finalCourseName || null,
      view_count: 0,
      like_count: 0,
      sort_order: sortOrder || 0,
      is_featured: 0,
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
