/**
 * 更新案例（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_cases
 * 关键字段：student_name、student_avatar、summary、course_id、sort_order
 *
 * @param {Object} event
 * @param {number} event.id            - 案例 ID（必填）
 * @param {string} event.title         - 案例标题
 * @param {string} event.studentName   - 学员姓名，对应 DB 字段 student_name
 * @param {string} event.studentAvatar - 学员头像URL，对应 DB 字段 student_avatar
 * @param {string} event.studentTitle  - 学员头衔/职业，对应 DB 字段 student_title
 * @param {string} event.summary       - 案例摘要，对应 DB 字段 summary
 * @param {string} event.content       - 案例详情
 * @param {string} event.videoUrl      - 视频URL，对应 DB 字段 video_url
 * @param {Array}  event.images        - 图片数组，对应 DB 字段 images（JSON）
 * @param {number} event.courseId      - 关联课程ID，对应 DB 字段 course_id
 * @param {string} event.courseName    - 课程名称，对应 DB 字段 course_name
 * @param {number} event.sortOrder     - 排序，对应 DB 字段 sort_order
 * @param {number} event.status        - 状态：0隐藏/1显示
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数
  const {
    id,
    title,
    studentName,
    studentAvatar,
    studentTitle,
    summary,
    content,
    videoUrl,
    images,
    courseId,
    courseName,
    sortOrder,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询案例是否存在
    const caseItem = await findOne('academy_cases', { id });
    if (!caseItem) {
      return response.notFound('案例不存在');
    }

    // 如果有 courseId 但没有 courseName，自动查询课程名称
    let finalCourseName = courseName;
    if (courseId !== undefined && courseName === undefined) {
      const course = await findOne('courses', { id: courseId });
      if (course) {
        finalCourseName = course.name;
      }
    }

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (studentName !== undefined) fieldsToUpdate.student_name = studentName;
    if (studentAvatar !== undefined) fieldsToUpdate.student_avatar = studentAvatar;
    if (studentTitle !== undefined) fieldsToUpdate.student_title = studentTitle;
    if (summary !== undefined) fieldsToUpdate.summary = summary;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (videoUrl !== undefined) fieldsToUpdate.video_url = videoUrl;
    if (images !== undefined) fieldsToUpdate.images = images ? JSON.stringify(images) : null;
    if (courseId !== undefined) fieldsToUpdate.course_id = courseId;
    if (finalCourseName !== undefined) fieldsToUpdate.course_name = finalCourseName;
    if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新案例（fieldsToUpdate 仅含 DB 真实存在的列）
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
