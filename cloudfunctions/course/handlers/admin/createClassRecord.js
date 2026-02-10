/**
 * 创建上课排期（管理端接口）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    course_id,
    class_date,
    start_time,
    end_time,
    location,
    teacher,
    max_students,
    notes
  } = event;

  try {
    // 参数验证
    const validation = validateRequired(
      { course_id, class_date, start_time, max_students },
      ['course_id', 'class_date', 'start_time', 'max_students']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建上课排期
    const recordId = await insert('class_records', {
      course_id,
      class_date,
      start_time,
      end_time,
      location,
      teacher,
      max_students,
      current_students: 0,
      notes,
      status: 1
    });

    return response.success({
      message: '上课排期创建成功',
      record_id: recordId
    });

  } catch (error) {
    console.error('[Course/createClassRecord] 创建失败:', error);
    return response.error('创建上课排期失败', error);
  }
};
