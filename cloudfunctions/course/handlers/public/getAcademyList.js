/**
 * 获取商学院介绍列表（公开接口）
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  try {
    // 使用 Query Builder 查询商学院介绍列表（注意：academy_intro 表没有 summary 和 deleted_at 字段）
    const { data: list, error } = await db
      .from('academy_intro')
      .select('id, title, cover_image, content, team, sort_order, created_at')
      .eq('status', 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 🔥 转换封面图 cloud:// fileID 为 CDN HTTPS URL
    const processedList = (list || []).map(item => ({
      ...item,
      cover_image: cloudFileIDToURL(item.cover_image || '')
    }));

    return response.success({
      list: processedList
    });

  } catch (error) {
    console.error('[Course/getAcademyList] 查询失败:', error);
    return response.error('查询商学院列表失败', error);
  }
};
