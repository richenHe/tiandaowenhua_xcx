/**
 * 获取预约列表（管理端接口）
 */
const { rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, class_record_id, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE a.deleted_at IS NULL';
    const params = [];

    if (course_id) {
      whereClause += ' AND a.course_id = ?';
      params.push(course_id);
    }

    if (class_record_id) {
      whereClause += ' AND a.class_record_id = ?';
      params.push(class_record_id);
    }

    if (status !== undefined) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (u.real_name LIKE ? OR u.phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        a.id,
        a.user_id,
        u.real_name,
        u.phone,
        a.course_id,
        c.name as course_name,
        a.class_record_id,
        cr.class_date,
        cr.start_time,
        cr.end_time,
        cr.location,
        a.status,
        CASE a.status
          WHEN 1 THEN '待上课'
          WHEN 2 THEN '已签到'
          WHEN 3 THEN '已取消'
          ELSE '未知'
        END as status_name,
        a.checkin_code,
        a.checkin_at,
        a.appointed_at,
        a.cancelled_at
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      INNER JOIN courses c ON c.id = a.course_id
      INNER JOIN class_records cr ON cr.id = a.class_record_id
      ${whereClause}
      ORDER BY a.appointed_at DESC
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
    console.error('[Course/getAppointmentList] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
