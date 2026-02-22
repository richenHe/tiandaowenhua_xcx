/**
 * 创建上课排期（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：class_records
 * 关键字段：class_time（合并存储开始+结束时间，格式：HH:mm-HH:mm）、class_location、total_quota、remark
 *
 * @param {Object} event
 * @param {number} event.courseId      - 课程 ID（必填）
 * @param {string} event.classDate     - 上课日期（如 "2026-03-01"）（必填）
 * @param {string} event.startTime     - 开始时间（如 "09:00:00"）（必填）
 * @param {string} event.endTime       - 结束时间（如 "17:00:00"）（必填）
 * @param {string} event.classLocation - 上课地点，对应 DB 字段 class_location
 * @param {string} event.teacher       - 讲师
 * @param {number} event.totalQuota    - 总名额，对应 DB 字段 total_quota（默认 30）
 * @param {string} event.remark        - 备注，对应 DB 字段 remark
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数
  const {
    courseId,
    classDate,
    startTime,
    endTime,
    classLocation,
    teacher,
    totalQuota,
    remark
  } = event;

  try {
    // 参数验证（camelCase key）
    const validation = validateRequired(
      { courseId, classDate, startTime, endTime },
      ['courseId', 'classDate', 'startTime', 'endTime']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 合并 startTime + endTime → class_time（DB 实际字段）
    const classTime = `${startTime}-${endTime}`;

    // camelCase → snake_case，写入 DB
    const [result] = await insert('class_records', {
      course_id: courseId,
      class_date: classDate,
      class_time: classTime,
      class_location: classLocation || null,
      teacher: teacher || null,
      total_quota: totalQuota || 30,
      booked_quota: 0,
      remark: remark || null,
      status: 1
    });

    return response.success({
      classRecordId: result.id
    }, '上课排期创建成功');

  } catch (error) {
    console.error('[Course/createClassRecord] 创建失败:', error);
    return response.error('创建上课排期失败', error);
  }
};
