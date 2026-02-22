/**
 * 更新上课排期（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * @param {Object} event
 * @param {number} event.id           - 排期 ID（必填）
 * @param {number} event.courseId     - 课程 ID
 * @param {string} event.classDate    - 上课日期（如 "2026-03-01"）
 * @param {string} event.startTime    - 开始时间（如 "09:00:00"），与 endTime 合并存为 class_time
 * @param {string} event.endTime      - 结束时间（如 "17:00:00"）
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
  // 接收 camelCase 参数
  const {
    id,
    courseId,
    classDate,
    startTime,
    endTime,
    classLocation,
    totalQuota,
    remark,
    teacher,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询排期是否存在
    const record = await findOne('class_records', { id });
    if (!record) {
      return response.notFound('上课排期不存在');
    }

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const fieldsToUpdate = {};
    if (courseId !== undefined) fieldsToUpdate.course_id = courseId;
    if (classDate !== undefined) fieldsToUpdate.class_date = classDate;
    // startTime + endTime 合并为 class_time（格式：HH:mm-HH:mm）
    if (startTime !== undefined && endTime !== undefined) {
      fieldsToUpdate.class_time = `${startTime}-${endTime}`;
    } else if (startTime !== undefined) {
      fieldsToUpdate.class_time = `${startTime}-`;
    }
    if (classLocation !== undefined) fieldsToUpdate.class_location = classLocation;
    if (totalQuota !== undefined) fieldsToUpdate.total_quota = totalQuota;
    if (remark !== undefined) fieldsToUpdate.remark = remark;
    if (teacher !== undefined) fieldsToUpdate.teacher = teacher;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新排期（fieldsToUpdate 仅含 DB 真实存在的列）
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
