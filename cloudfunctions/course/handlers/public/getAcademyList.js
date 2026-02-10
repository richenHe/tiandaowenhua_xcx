/**
 * 获取商学院介绍列表（公开接口）
 */
const { from, rawQuery } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    // 查询商学院介绍列表
    const sql = `
      SELECT
        id,
        title,
        cover_image,
        summary,
        sort_order,
        created_at
      FROM academy_intro
      WHERE status = 1 AND deleted_at IS NULL
      ORDER BY sort_order ASC, created_at DESC
    `;

    const list = await rawQuery(sql);

    return response.success({
      list
    });

  } catch (error) {
    console.error('[Course/getAcademyList] 查询失败:', error);
    return response.error('查询商学院列表失败', error);
  }
};
