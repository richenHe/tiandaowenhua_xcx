/**
 * 更新上课排期（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * @param {Object} event
 * @param {number} event.id           - 排期 ID（必填）
 * @param {number} event.courseId     - 课程 ID
 * @param {string} event.classDate    - 开课日期（如 "2026-03-01"）
 * @param {string} event.classEndDate - 结课日期（如 "2026-03-05"），单天课与 classDate 相同
 * @param {string} event.classTime    - 上课时段（如 "09:00-17:00"），对应 DB 字段 class_time
 * @param {string} event.classLocation- 上课地点，对应 DB 字段 class_location
 * @param {number} event.totalQuota   - 总名额，对应 DB 字段 total_quota
 * @param {string} event.remark       - 备注，对应 DB 字段 remark
 * @param {string} event.teacher      - 讲师
 * @param {number} event.status       - 状态：0取消/1正常/2已结束
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    id,
    courseId,
    classDate,
    classEndDate,
    classTime,
    classLocation,
    totalQuota,
    remark,
    teacher,
    status
  } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const record = await findOne('class_records', { id });
    if (!record) {
      return response.notFound('上课排期不存在');
    }

    if (classDate !== undefined && classEndDate !== undefined && classEndDate && classEndDate < classDate) {
      return response.paramError('结课日期不能早于上课时间');
    }

    const fieldsToUpdate = {};
    if (courseId !== undefined) fieldsToUpdate.course_id = courseId;
    if (classDate !== undefined) fieldsToUpdate.class_date = classDate;
    // 未传 classEndDate 但传了 classDate 时，同步更新结课日期为开课日期（单天课保持同步）
    if (classEndDate !== undefined) {
      fieldsToUpdate.class_end_date = classEndDate || classDate || record.class_date;
    } else if (classDate !== undefined) {
      // 只改了开课日期但没传结课日期：若原结课日期=原开课日期（单天课），同步跟随
      if (record.class_end_date === record.class_date) {
        fieldsToUpdate.class_end_date = classDate;
      }
    }
    if (classTime !== undefined) fieldsToUpdate.class_time = classTime || null;
    if (classLocation !== undefined) fieldsToUpdate.class_location = classLocation;
    if (totalQuota !== undefined) fieldsToUpdate.total_quota = totalQuota;
    if (remark !== undefined) fieldsToUpdate.remark = remark;
    if (teacher !== undefined) fieldsToUpdate.teacher = teacher;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    await update('class_records', fieldsToUpdate, { id });

    return response.success({
      success: true,
      message: '上课排期更新成功'
    });

  } catch (error) {
    console.error('[Course/updateClassRecord] 更新失败:', error);
    return response.error('更新上课排期失败', error);
  }
};
