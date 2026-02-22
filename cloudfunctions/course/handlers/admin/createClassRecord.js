/**
 * 创建上课排期（管理端接口）
 * 注意：字段名与实际数据库不同
 * - class_time: 上课时间（如 "09:00-12:00"）
 * - class_location: 上课地点
 * - total_quota: 总名额
 * - booked_quota: 已预约数
 * - remark: 备注
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    course_id,
    class_date,
    class_time,
    class_location,
    teacher,
    total_quota,
    remark,
    // 兼容旧参数
    start_time,
    end_time,
    location,
    max_students,
    notes
  } = event;

  try {
    // 参数处理（兼容旧参数名）
    const finalClassTime = class_time || (start_time && end_time ? `${start_time}-${end_time}` : null);
    const finalLocation = class_location || location;
    const finalQuota = total_quota || max_students || 30;
    const finalRemark = remark || notes;

    // 参数验证
    const validation = validateRequired(
      { course_id, class_date, class_time: finalClassTime },
      ['course_id', 'class_date', 'class_time']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建上课排期
    const [result] = await insert('class_records', {
      course_id,
      class_date,
      class_time: finalClassTime,
      class_location: finalLocation,
      teacher,
      total_quota: finalQuota,
      booked_quota: 0,
      remark: finalRemark,
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
