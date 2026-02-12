/**
 * 管理端接口：删除公告
 * Action: deleteAnnouncement
 *
 * 参数：
 * - id: 公告ID
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

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

    // 软删除（更新状态为0，updated_at 使用数据库默认值）
    await update('announcements', {
      status: 0
    }, { id });

    return response.success({ id }, '删除成功');

  } catch (error) {
    console.error('[admin:deleteAnnouncement] 失败:', error);
    return response.error('删除公告失败', error);
  }
};
