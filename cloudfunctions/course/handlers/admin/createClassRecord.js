/**
 * 创建上课排期（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：class_records
 * 关键字段：class_date（开课日期）、class_end_date（结课日期）、class_time（上课时段）、class_location、total_quota、cancel_deadline_days
 *
 * @param {Object} event
 * @param {number} event.courseId              - 课程 ID（必填）
 * @param {string} event.classDate             - 开课日期（如 "2026-03-01"）（必填）
 * @param {string} event.classEndDate          - 结课日期（如 "2026-03-05"），单天课与 classDate 相同
 * @param {string} event.classTime             - 上课时段（如 "09:00-17:00"），对应 DB 字段 class_time
 * @param {string} event.classLocation         - 上课地点，对应 DB 字段 class_location
 * @param {string} event.teacher               - 讲师
 * @param {number} event.totalQuota            - 总名额，对应 DB 字段 total_quota（默认 30）
 * @param {number} event.cancelDeadlineDays    - 取消预约截止天数（必填，上课前X天不可取消）
 * @param {number} event.retrainPrice          - 该排期复训费（元），对应 DB retrain_price，默认 0（0=本排期免费复训）
 * @param {string} event.remark                - 备注，对应 DB 字段 remark
 */
const { db, insert, findOne } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const courseId = event.courseId || event.course_id;
  const classDate = event.classDate || event.class_date;
  // 单天课与 classDate 相同，未传则默认等于 classDate
  const classEndDate = event.classEndDate || event.class_end_date || classDate;
  const classTime = event.classTime || event.class_time || null;
  const classLocation = event.classLocation || event.class_location;
  const teacher = event.teacher;
  const totalQuota = event.totalQuota || event.total_quota;
  const cancelDeadlineDays = event.cancelDeadlineDays ?? event.cancel_deadline_days;
  const retrainPriceRaw = event.retrainPrice ?? event.retrain_price;
  const remark = event.remark;

  try {
    const validation = validateRequired(
      { courseId, classDate, cancelDeadlineDays },
      ['courseId', 'classDate', 'cancelDeadlineDays']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const parsedDays = parseInt(cancelDeadlineDays, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      return response.paramError('取消预约截止天数必须为大于 0 的整数');
    }

    // 取服务器今天日期（北京时间 UTC+8，YYYY-MM-DD 格式）
    const nowBJ = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const todayStr = nowBJ.toISOString().slice(0, 10);
    if (classDate < todayStr) {
      return response.paramError('上课日期不能早于今天');
    }

    if (classEndDate && classEndDate < classDate) {
      return response.paramError('结课日期不能早于上课时间');
    }

    const retrainPriceNum =
      retrainPriceRaw !== undefined && retrainPriceRaw !== null && retrainPriceRaw !== ''
        ? Math.max(0, parseFloat(retrainPriceRaw) || 0)
        : 0;

    // 沙龙课程(type=4)只允许创建一个有效排期
    const course = await findOne('courses', { id: courseId });
    if (course && course.type === 4) {
      const { data: existingRecords } = await db
        .from('class_records')
        .select('id')
        .eq('course_id', courseId)
        .neq('status', 0);
      if (existingRecords && existingRecords.length > 0) {
        return response.error('该沙龙课程已有排期，无法再次创建');
      }
    }

    const [result] = await insert('class_records', {
      course_id: courseId,
      class_date: classDate,
      class_end_date: classEndDate,
      class_time: classTime || null,
      class_location: classLocation || null,
      teacher: teacher || null,
      total_quota: totalQuota || 30,
      booked_quota: 0,
      cancel_deadline_days: parsedDays,
      retrain_price: retrainPriceNum,
      remark: remark || null,
      status: 1
    });

    return response.success({
      class_record_id: result.id
    }, '上课排期创建成功');

  } catch (error) {
    console.error('[Course/createClassRecord] 创建失败:', error);
    return response.error('创建上课排期失败', error);
  }
};
