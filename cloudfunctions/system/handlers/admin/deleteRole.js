/**
 * 管理端接口：删除角色
 * Action: deleteRole
 *
 * 参数：
 * - id: 角色ID
 *
 * 限制：
 * - 系统内置角色（is_system=1）不可删除
 * - 有管理员正在使用的角色不可删除
 *
 * 权限要求：super_admin
 */
const { findOne, deleteRecord, count } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id } = event;

  try {
    if (admin.role !== 'super_admin') {
      return response.error('仅超级管理员可删除角色', null, 403);
    }

    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:deleteRole] 超级管理员 ${admin.id} 删除角色 ${id}`);

    const role = await findOne('admin_roles', { id });
    if (!role) {
      return response.notFound('角色不存在');
    }

    if (role.is_system === 1) {
      return response.error('系统内置角色不可删除');
    }

    // 检查是否有管理员正在使用该角色
    const adminCount = await count('admin_users', { role: role.role_key });
    if (adminCount > 0) {
      return response.error(`该角色下还有 ${adminCount} 个管理员，请先调整后再删除`);
    }

    await deleteRecord('admin_roles', { id });

    return response.success({ id }, '删除成功');

  } catch (error) {
    console.error('[admin:deleteRole] 失败:', error);
    return response.error('删除角色失败', error);
  }
};
