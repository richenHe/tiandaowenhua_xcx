/**
 * 管理端接口：创建角色
 * Action: createRole
 *
 * 参数：
 * - roleKey: 角色标识（唯一，如 finance、editor）
 * - roleName: 角色显示名（如"财务"、"编辑员"）
 * - permissions: 权限数组（页面 key 数组）
 * - description: 角色描述（可选）
 *
 * 权限要求：super_admin
 */
const { findOne, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { roleKey, roleName, permissions = [], description = '' } = event;

  try {
    if (admin.role !== 'super_admin') {
      return response.error('仅超级管理员可创建角色', null, 403);
    }

    if (!roleKey || !roleName) {
      return response.paramError('缺少必要参数: roleKey, roleName');
    }

    // 校验 roleKey 格式：字母、数字、下划线
    if (!/^[a-zA-Z][a-zA-Z0-9_]{1,49}$/.test(roleKey)) {
      return response.paramError('角色标识只能包含字母、数字、下划线，且以字母开头，长度2-50');
    }

    console.log(`[admin:createRole] 超级管理员 ${admin.id} 创建角色: ${roleKey}`);

    const existing = await findOne('admin_roles', { role_key: roleKey });
    if (existing) {
      return response.error('角色标识已存在');
    }

    const [newRole] = await insert('admin_roles', {
      role_key: roleKey,
      role_name: roleName,
      permissions: JSON.stringify(permissions),
      is_system: 0,
      description: description || null,
      status: 1
    });

    return response.success({
      id: newRole.id,
      role_key: newRole.role_key,
      role_name: newRole.role_name
    }, '创建成功');

  } catch (error) {
    console.error('[admin:createRole] 失败:', error);
    return response.error('创建角色失败', error);
  }
};
