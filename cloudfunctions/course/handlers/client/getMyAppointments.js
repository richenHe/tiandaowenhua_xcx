/**
 * 获取我的预约列表（客户端接口）
 */
const { rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { status, page = 1, page_size = 10 } = event;
  const { user } = context;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE a.user_id = ? AND a.deleted_at IS NULL';
    const params = [user.id];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM appointments a
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        a.id,
        a.course_id,
        c.name as course_name,
        c.type as course_type,
        a.class_record_id,
        cr.class_date,
        cr.start_time,
        cr.end_time,
        cr.location,
        cr.teacher,
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
      INNER JOIN courses c ON c.id = a.course_id
      INNER JOIN class_records cr ON cr.id = a.class_record_id
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
    console.error('[Course/getMyAppointments] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
