/**
 * 获取轮播图列表（公共接口，无需鉴权）
 * @description 用于首页展示轮播图，从 banners 表查询
 */

const { db, response } = require('common');
const { getTempFileURL } = require('../../common/storage');

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

    // 格式化返回数据（映射字段名以匹配前端期望）
    const list = banners.map(item => ({
      id: item.id,
      title: item.title || '',
      subtitle: item.subtitle || '',
      cover_image: item.image_url || '',
      link: item.link_url || '',
      sort_order: item.sort_order || 0
    }));

    // 🔥 转换云存储 fileID 为临时 URL
    if (list && list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(item => {
        if (item.cover_image) fileIDs.push(item.cover_image);
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(item => {
        if (item.cover_image && urlMap[item.cover_image]) {
          item.cover_image = urlMap[item.cover_image];
        }
      });
    }

    return response.success({
      list,
      total: list.length
    }, '获取成功');

  } catch (error) {
    console.error('获取轮播图失败:', error);
    return response.error('获取轮播图失败', error);
  }
};






