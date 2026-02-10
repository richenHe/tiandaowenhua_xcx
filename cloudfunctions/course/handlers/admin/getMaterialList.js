/**
 * 获取资料列表（管理端接口）
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
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM academy_materials
      ${whereClause}
    `;
    const countResult = await rawQuery(countSql, params);
    const total = countResult[0].total;

    // 查询列表
    const listSql = `
      SELECT
        id,
        title,
        type,
        CASE type
          WHEN 1 THEN '文档'
          WHEN 2 THEN '视频'
          WHEN 3 THEN '音频'
          WHEN 4 THEN '图片'
          ELSE '其他'
        END as type_name,
        cover_image,
        description,
        file_url,
        file_size,
        download_count,
        sort_order,
        status,
        created_at,
        updated_at
      FROM academy_materials
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
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
