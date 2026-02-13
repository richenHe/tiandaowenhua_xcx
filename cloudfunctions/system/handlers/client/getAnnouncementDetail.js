/**
 * 客户端接口：获取公告详情
 * Action: client:getAnnouncementDetail
 */
const { db, response, getTempFileURL } = require('common');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必填参数: id');
    }

    console.log(`[getAnnouncementDetail] 获取公告详情，ID: ${id}`);

    const { data, error } = await db
      .from('announcements')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (error) throw error;
    if (!data) return response.error('公告不存在或已下架');

    // 🔥 转换云存储 fileID 为临时 URL
    if (data.cover_image) {
      try {
        const result = await getTempFileURL(data.cover_image);
        data.cover_image = result.tempFileURL || data.cover_image;
      } catch (error) {
        console.warn('[getAnnouncementDetail] 转换临时URL失败:', data.cover_image, error.message);
      }
    }

    return response.success(data, '获取成功');
  } catch (error) {
    console.error('[getAnnouncementDetail] 失败:', error);
    return response.error('获取公告详情失败', error);
  }
};
