/**
 * 管理端接口：更新轮播图
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  // tiandao_culture.banners 字段: image_url, link_url, subtitle, link_type（无 start_time / end_time）
  const { id, title, subtitle, coverImage, link, linkType, sortOrder, status } = event;

  if (!id) return response.paramError('ID 不能为空');

  try {
    const updateData = {};
    if (title !== undefined)      updateData.title      = title;
    if (subtitle !== undefined)   updateData.subtitle   = subtitle;
    if (coverImage !== undefined) updateData.image_url  = coverImage;
    if (link !== undefined)       updateData.link_url   = link;
    if (linkType !== undefined)   updateData.link_type  = linkType;
    if (sortOrder !== undefined)  updateData.sort_order = sortOrder;
    if (status !== undefined)     updateData.status     = status;

    const { data, error } = await db.from('banners').update(updateData).eq('id', id).select();
    if (error) throw error;

    const result = data?.[0] || {};
    return response.success({ ...result, id: result.id ?? parseInt(id, 10) }, '更新成功');
  } catch (error) {
    console.error('[admin:updateBanner] 失败:', error);
    return response.error('更新轮播图失败', error);
  }
};
