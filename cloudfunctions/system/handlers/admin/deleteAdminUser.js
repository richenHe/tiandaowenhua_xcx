/**
 * 管理端接口：删除管理员
 * Action: deleteAdminUser
 *
 * 参数：
 * - id: 管理员ID
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

    console.log(`[admin:deleteAdminUser] 管理员 ${admin.id} 删除管理员 ${id}`);

    // 不能删除自己
    if (admin.id === id) {
      return response.error('不能删除自己');
    }

    // 验证管理员存在
    const targetAdmin = await findOne('admin_users', { id });
    if (!targetAdmin) {
      return response.notFound('管理员不存在');
    }

    // 软删除（更新状态为0）
    await update('admin_users', {
      status: 0,
      updated_at: new Date()
    }, { id });

    return response.success({ id }, '删除成功');

  } catch (error) {
    console.error('[admin:deleteAdminUser] 失败:', error);
    return response.error('删除管理员失败', error);
  }
};
