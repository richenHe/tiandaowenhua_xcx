/**
 * 管理端接口：创建轮播图
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  // tiandao_culture.banners 字段: image_url, link_url, subtitle, link_type
  // tiandao_culture.banners 无 start_time / end_time 字段
  const { title, subtitle, coverImage, link, linkType, sortOrder, status = 1 } = event;

  if (!title) return response.paramError('标题不能为空');
  if (!coverImage) return response.paramError('图片不能为空');

  try {
    const insertData = {
      title,
      subtitle: subtitle || '',
      image_url: coverImage,
      link_type: linkType || 'miniprogram_path',
      link_url: link || '',
      sort_order: sortOrder || 0,
      status,
    };

    const { data, error } = await db.from('banners').insert(insertData).select();
    if (error) throw error;

    return response.success(data?.[0] || null, '创建成功');
  } catch (error) {
    console.error('[admin:createBanner] 失败:', error);
    return response.error('创建轮播图失败', error);
  }
};
