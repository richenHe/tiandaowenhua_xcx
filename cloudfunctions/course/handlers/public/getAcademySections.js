/**
 * 获取商学院板块列表（公开接口）
 * 返回所有启用的板块，按 sort_order 升序排列
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

/**
 * 遍历 teachers/honors 类型的 content，将云存储 fileID 转换为 CDN URL
 */
function convertContentStorageURLs(sectionType, content) {
  if (!content || !content.items) return content;

  if (sectionType === 'teachers') {
    content.items = content.items.map(item => ({
      ...item,
      avatar: item.avatar ? cloudFileIDToURL(item.avatar) : ''
    }));
  } else if (sectionType === 'honors') {
    content.items = content.items.map(item => ({
      ...item,
      image: item.image ? cloudFileIDToURL(item.image) : ''
    }));
  }

  return content;
}

module.exports = async (event, context) => {
  try {
    const { data: list, error } = await db
      .from('academy_sections')
      .select('id, section_type, title, icon, content, sort_order')
      .eq('status', 1)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const processedList = (list || []).map(item => {
      let content = item.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch (e) { content = {}; }
      }
      content = convertContentStorageURLs(item.section_type, content);

      return {
        ...item,
        content
      };
    });

    return response.success({ list: processedList });

  } catch (error) {
    console.error('[Course/getAcademySections] 查询失败:', error);
    return response.error('查询商学院板块列表失败', error);
  }
};
