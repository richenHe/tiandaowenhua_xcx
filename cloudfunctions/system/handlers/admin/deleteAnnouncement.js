/**
 * 管理端接口：删除公告（物理删除数据库记录）
 * Action: deleteAnnouncement
 *
 * 与「隐藏」区分：隐藏由 updateAnnouncement 改 status；删除会移除 announcements 行。
 *
 * 参数：
 * - id: 公告ID
 */
const { findOne, deleteRecord } = require('../../common/db');
const { response } = require('../../common');
const { deleteFile } = require('../../common/storage');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id } = event;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:deleteAnnouncement] 管理员 ${admin.id} 删除公告 ${id}`);

    // 验证公告存在
    const announcement = await findOne('announcements', { id });
    if (!announcement) {
      return response.notFound('公告不存在');
    }

    // 封面存 cloud:// fileID 时尝试删云文件（失败不阻塞删库）
    const cover = announcement.cover_image;
    if (cover && String(cover).startsWith('cloud://')) {
      try {
        await deleteFile(cover);
      } catch (e) {
        console.warn('[admin:deleteAnnouncement] 封面云存储删除失败（继续删库）:', e.message);
      }
    }

    await deleteRecord('announcements', { id });

    return response.success({ success: true, id }, '删除成功');

  } catch (error) {
    console.error('[admin:deleteAnnouncement] 失败:', error);
    return response.error('删除公告失败', error);
  }
};
