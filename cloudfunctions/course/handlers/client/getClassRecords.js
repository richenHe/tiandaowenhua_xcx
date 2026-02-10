/**
 * 获取上课排期列表（客户端接口）
 */
const { rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, start_date, end_date, page = 1, page_size = 10 } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ course_id }, ['course_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE cr.course_id = ? AND cr.status = 1 AND cr.deleted_at IS NULL';
    const params = [course_id];

    if (start_date) {
      whereClause += ' AND cr.class_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND cr.class_date <= ?';
      params.push(end_date);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM class_records cr
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        cr.id,
        cr.course_id,
        c.name as course_name,
        cr.class_date,
        cr.start_time,
        cr.end_time,
        cr.location,
        cr.teacher,
        cr.max_students,
        cr.current_students,
        (cr.max_students - cr.current_students) as available_quota,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_appointed
      FROM class_records cr
      INNER JOIN courses c ON c.id = cr.course_id
      LEFT JOIN appointments a ON a.class_record_id = cr.id AND a.user_id = ? AND a.status IN (1,2) AND a.deleted_at IS NULL
      ${whereClause}
      ORDER BY cr.class_date ASC, cr.start_time ASC
      LIMIT ? OFFSET ?
    `;
    params.unshift(user.id);
    params.push(limit, offset);

    const list = await rawQuery(listSql, params);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getClassRecords] 查询失败:', error);
    return response.error('查询上课排期失败', error);
  }
};
