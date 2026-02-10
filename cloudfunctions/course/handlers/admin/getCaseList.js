/**
 * 获取案例列表（管理端接口）
 */
const { from, rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询条件
    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM academy_cases
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        id,
        title,
        category,
        cover_image,
        summary,
        author,
        view_count,
        sort_order,
        status,
        created_at,
        updated_at
      FROM academy_cases
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
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
