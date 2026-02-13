/**
 * 获取轮播图列表（公共接口，无需鉴权）
 * @description 用于首页展示轮播图，从 banners 表查询
 */

const { db, response, getTempFileURL } = require('common');

module.exports = async (event, context) => {
  try {
    // 查询轮播图数据（使用 banners 表）
    const { data: banners, error } = await db
      .from('banners')
      .select('id, title, subtitle, image_url, link_url, sort_order')
      .eq('status', 1)  // 已启用
      .order('sort_order', { ascending: false })  // 按排序字段倒序
      .order('created_at', { ascending: false })  // 相同排序按创建时间倒序
      .limit(10);  // 最多返回10个

    if (error) throw error;

    // 格式化返回数据并转换云存储 fileID 为临时 URL
    const list = await Promise.all((banners || []).map(async item => {
      let coverImageUrl = item.image_url || '';
      if (item.image_url) {
        try {
          const result = await getTempFileURL(item.image_url);
          coverImageUrl = result.tempFileURL || item.image_url;
        } catch (error) {
          console.warn('[getBannerList] 转换临时URL失败:', item.image_url, error.message);
        }
      }
      
      return {
        id: item.id,
        title: item.title || '',
        subtitle: item.subtitle || '',
        cover_image: coverImageUrl,
        link: item.link_url || '',
        sort_order: item.sort_order || 0
      };
    }));

    return response.success({
      list,
      total: list.length
    }, '获取成功');

  } catch (error) {
    console.error('获取轮播图失败:', error);
    return response.error('获取轮播图失败', error);
  }
};






