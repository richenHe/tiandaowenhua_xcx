/**
 * 获取日历排期（公共接口，无需鉴权）
 * @description 用于首页日历展示有课程的日期及课程昵称；按排期 class_date～class_end_date（含）展开到每一天，同日多课合并为 nicknames
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Object} 日期为键，课程信息为值的对象
 *   - nickname: 首个课程昵称（日历格第二行优先展示）
 *   - nicknames: 当日涉及的全部课程昵称（去重、按 course_id 升序，供「课程：」行逗号拼接）
 *   - courseName / classTime / classRecordId: 与 nickname 同属「首个」排期（course_id 最小）
 */

const { db, response } = require('common');

/** @param {string} s YYYY-MM-DD */
function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** @param {Date} date */
function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 含首尾遍历自然日
 * @param {string} startStr
 * @param {string} endStr
 * @param {(ymd: string) => void} fn
 */
function eachDayInclusive(startStr, endStr, fn) {
  const start = parseYmd(startStr);
  let end = parseYmd(endStr);
  if (end < start) end = start;
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    fn(formatYmd(new Date(t)));
  }
}

module.exports = async (event, context) => {
  const { startDate, endDate } = event;

  try {
    if (!startDate || !endDate) {
      return response.paramError('缺少必要参数：startDate 和 endDate');
    }

    const sel = `
      id,
      course_id,
      course_name,
      class_date,
      class_end_date,
      class_time,
      course:courses!fk_class_records_course(nickname)
    `;

    // 与区间 [startDate,endDate] 有交集的排期：
    // - 有结课日：class_date <= endDate 且 class_end_date >= startDate
    // - 单日：class_end_date IS NULL 且 class_date 落在区间内
    const [rMulti, rSingle] = await Promise.all([
      db
        .from('class_records')
        .select(sel)
        .not('class_end_date', 'is', null)
        .lte('class_date', endDate)
        .gte('class_end_date', startDate)
        .in('status', [1, 2, 3]),
      db
        .from('class_records')
        .select(sel)
        .is('class_end_date', null)
        .gte('class_date', startDate)
        .lte('class_date', endDate)
        .in('status', [1, 2, 3])
    ]);

    const err = rMulti.error || rSingle.error;
    if (err) throw err;

    const byId = new Map();
    for (const row of rMulti.data || []) byId.set(row.id, row);
    for (const row of rSingle.data || []) byId.set(row.id, row);
    const records = Array.from(byId.values());

    /** @type {Record<string, Map<number, { nickname: string, courseName: string, classTime: string, classRecordId: number }>>} */
    const dayMap = {};

    records.forEach((record) => {
      const start = record.class_date;
      const end =
        record.class_end_date && String(record.class_end_date) >= String(start)
          ? record.class_end_date
          : start;
      const nick = (record.course && record.course.nickname) || record.course_name || '';

      eachDayInclusive(start, end, (dateStr) => {
        if (dateStr < startDate || dateStr > endDate) return;
        if (!dayMap[dateStr]) dayMap[dateStr] = new Map();
        const m = dayMap[dateStr];
        if (!m.has(record.course_id)) {
          m.set(record.course_id, {
            nickname: nick,
            courseName: record.course_name,
            classTime: record.class_time,
            classRecordId: record.id
          });
        }
      });
    });

    const calendarData = {};
    const sortedDates = Object.keys(dayMap).sort();
    sortedDates.forEach((dateStr) => {
      const m = dayMap[dateStr];
      const entries = [...m.entries()].sort((a, b) => a[0] - b[0]);
      const first = entries[0][1];
      const nicknames = [...new Set(entries.map(([, v]) => v.nickname).filter(Boolean))];
      calendarData[dateStr] = {
        courseId: entries[0][0],
        nickname: nicknames[0] || '',
        nicknames,
        courseName: first.courseName,
        classTime: first.classTime,
        classRecordId: first.classRecordId
      };
    });

    return response.success(calendarData, '获取成功');
  } catch (error) {
    console.error('获取日历数据失败:', error);
    return response.error('获取日历数据失败', error);
  }
};
