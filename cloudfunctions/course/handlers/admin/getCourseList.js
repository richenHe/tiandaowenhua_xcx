/**
 * 获取课程列表（管理端接口）
 */
const { from, rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { type, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM courses
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        id,
        name,
        type,
        CASE type
          WHEN 1 THEN '初探班'
          WHEN 2 THEN '密训班'
          WHEN 3 THEN '咨询服务'
          ELSE '未知'
        END as type_name,
        cover_image,
        description,
        current_price,
        original_price,
        retrain_price,
        allow_retrain,
        status,
        sort_order,
        created_at,
        updated_at
      FROM courses
      ${whereClause}
      ORDER BY sort_order ASC, created_at DESC
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
    console.error('[Course/getCourseList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
