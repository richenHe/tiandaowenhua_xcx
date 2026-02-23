/**
 * 获取轮播图列表（公共接口，无需鉴权）
 * @description 用于首页展示轮播图，从独立的 banners 表查询
 */

const { db, response, getTempFileURL } = require('common');

module.exports = async (event, context) => {
  try {
    // tiandao_culture.banners 表字段：id, title, subtitle, image_url, link_url, sort_order, status
    const { data: banners, error } = await db
      .from('banners')
      .select('id, title, subtitle, image_url, link_url, sort_order')
      .eq('status', 1)
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const items = banners || [];

    // image_url 是直接 HTTP URL，无需云存储转换
    const list = items.map(item => {
      // 规范化 link_url，确保以 / 开头
      const rawLink = item.link_url || '';
      const link = rawLink && !rawLink.startsWith('/') ? '/' + rawLink : rawLink;

      return {
        id: item.id,
        title: item.title || '',
        subtitle: item.subtitle || '',
        cover_image: item.image_url || '',
        link,
        sort_order: item.sort_order || 0
      };
    });

    return response.success({
      list,
      total: list.length
    }, '获取成功');

  } catch (error) {
    console.error('获取轮播图失败:', error);
    return response.error('获取轮播图失败', error);
  }
};






