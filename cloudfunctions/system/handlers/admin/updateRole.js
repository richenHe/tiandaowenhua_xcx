/**
 * 管理端接口：更新角色
 * Action: updateRole
 *
 * 参数：
 * - id: 角色ID
 * - roleName: 角色显示名（可选）
 * - permissions: 权限数组（可选）
 * - description: 角色描述（可选）
 * - status: 状态（可选）
 *
 * 限制：super_admin 角色的 permissions 不可修改
 * 权限要求：super_admin
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id, roleName, permissions, description, status } = event;

  try {
    if (admin.role !== 'super_admin') {
      return response.error('仅超级管理员可修改角色', null, 403);
    }

    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:updateRole] 超级管理员 ${admin.id} 更新角色 ${id}`);

    const role = await findOne('admin_roles', { id });
    if (!role) {
      return response.notFound('角色不存在');
    }

    // super_admin 的权限不可修改
    if (role.role_key === 'super_admin' && permissions !== undefined) {
      return response.error('超级管理员的权限不可修改');
    }

    const updateData = {};
    if (roleName !== undefined) updateData.role_name = roleName;
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      // 系统内置角色不可禁用
      if (role.is_system === 1 && status === 0) {
        return response.error('系统内置角色不可禁用');
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return response.paramError('未提供任何更新字段');
    }

    await update('admin_roles', updateData, { id });

    return response.success({ id }, '更新成功');

  } catch (error) {
    console.error('[admin:updateRole] 失败:', error);
    return response.error('更新角色失败', error);
  }
};
