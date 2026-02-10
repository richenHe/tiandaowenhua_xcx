/**
 * 获取上课排期列表（管理端接口）
 */
const { rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, status, start_date, end_date, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE cr.deleted_at IS NULL';
    const params = [];

    if (course_id) {
      whereClause += ' AND cr.course_id = ?';
      params.push(course_id);
    }

    if (status !== undefined) {
      whereClause += ' AND cr.status = ?';
      params.push(status);
    }

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
        c.type as course_type,
        cr.class_date,
        cr.start_time,
        cr.end_time,
        cr.location,
        cr.teacher,
        cr.max_students,
        cr.current_students,
        (cr.max_students - cr.current_students) as available_quota,
        cr.notes,
        cr.status,
        cr.created_at,
        cr.updated_at
      FROM class_records cr
      INNER JOIN courses c ON c.id = cr.course_id
      ${whereClause}
      ORDER BY cr.class_date DESC, cr.start_time DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const list = await rawQuery(listSql, params);

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getClassRecordList] 查询失败:', error);
    return response.error('查询上课排期列表失败', error);
  }
};
