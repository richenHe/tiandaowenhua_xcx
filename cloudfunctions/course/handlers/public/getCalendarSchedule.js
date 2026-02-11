/**
 * 获取日历排期（公共接口，无需鉴权）
 * @description 用于首页日历展示有课程的日期及第一个课程信息
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Object} 日期为键，课程信息为值的对象
 *   - nickname: 课程昵称（优先显示，如"初探"）
 *   - courseName: 课程完整名称
 *   - classTime: 上课时间（如"09:00-17:00"）
 *   - 一天只显示一个课程：如有多个课程，显示courses表id正序的第一个
 */

const { db, response } = require('common');

module.exports = async (event, context) => {
  const { startDate, endDate } = event;

  try {
    // 参数验证
    if (!startDate || !endDate) {
      return response.paramError('缺少必要参数：startDate 和 endDate');
    }

    // 查询日期范围内的上课排期，关联courses表获取nickname
    const { data: records, error } = await db
      .from('class_records')
      .select(`
        id,
        course_id,
        course_name,
        class_date,
        class_time,
        course:courses!fk_class_records_course(nickname)
      `)
      .gte('class_date', startDate)
      .lte('class_date', endDate)
      .eq('status', 1)  // 正常状态
      .order('class_date', { ascending: true })
      .order('course_id', { ascending: true });  // 按课程ID正序，确保同一天取ID最小的课程

    if (error) throw error;

    // 按日期分组，每天只保留第一个课程（course_id最小的）
    const calendarData = {};
    
    records.forEach(record => {
      const dateStr = record.class_date;
      
      // 如果当天还没有课程，或者当前课程的course_id更小
      if (!calendarData[dateStr] || record.course_id < calendarData[dateStr].courseId) {
        calendarData[dateStr] = {
          courseId: record.course_id,
          nickname: record.course?.nickname || '',  // 课程昵称（优先显示）
          courseName: record.course_name,           // 课程完整名称
          classTime: record.class_time,             // 上课时间
          classRecordId: record.id
        };
      }
    });

    return response.success(calendarData, '获取成功');

  } catch (error) {
    console.error('获取日历数据失败:', error);
    return response.error('获取日历数据失败', error);
  }
};

