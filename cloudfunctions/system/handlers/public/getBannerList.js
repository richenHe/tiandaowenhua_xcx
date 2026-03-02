/**
 * 获取轮播图列表（公共接口，无需鉴权）
 * @description 用于首页展示轮播图，从独立的 banners 表查询
 */

const { db, response, cloudFileIDToURL } = require('common');

module.exports = async (event, context) => {
  try {
    // tiandao_culture.banners 表字段：id, title, subtitle, image_url, link_url, sort_order, status
    const { data: banners, error } = await db
      .from('banners')
      .select('id, title, subtitle, image_url, link_url, sort_order')
      .eq('status', 1)
      .order('id', { ascending: true })
      .limit(10);

    if (error) throw error;

    const items = banners || [];

    // 🔥 将 cloud:// fileID 直接转换为 CDN HTTPS URL（无需 API 调用）
    const list = items.map(item => {
      const rawLink = item.link_url || '';
      const link = rawLink && !rawLink.startsWith('/') ? '/' + rawLink : rawLink;
      const coverImage = cloudFileIDToURL(item.image_url || '');

      return {
        id: item.id,
        title: item.title || '',
        subtitle: item.subtitle || '',
        cover_image: coverImage,
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






