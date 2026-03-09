/**
 * 管理端接口：管理员登录
 * Action: login
 *
 * 参数：
 * - username: 用户名
 * - password: 密码
 *
 * 返回：JWT Token（24小时有效）
 */
const { findOne } = require('../../common/db');
const { response, generateAdminToken } = require('../../common');
const bcrypt = require('bcryptjs');

module.exports = async (event, context) => {
  const { username, password } = event;

  try {
    if (!username || !password) {
      return response.paramError('缺少必要参数: username, password');
    }

    console.log(`[admin:login] 管理员登录尝试: ${username}`);

    const admin = await findOne('admin_users', { username });
    if (!admin) {
      return response.error('用户名或密码错误', null, 401);
    }

    if (admin.status !== 1) {
      return response.error('账号已被禁用', null, 403);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return response.error('用户名或密码错误', null, 401);
    }

    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role
    });

    // 从 admin_roles 表查询该角色的权限
    let permissions = [];
    let roleName = admin.role;
    const roleInfo = await findOne('admin_roles', { role_key: admin.role, status: 1 });
    if (roleInfo) {
      roleName = roleInfo.role_name;
      const rawPerms = roleInfo.permissions;
      permissions = Array.isArray(rawPerms)
        ? rawPerms
        : (rawPerms ? JSON.parse(rawPerms) : []);
    }

    return response.success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
        role: admin.role,
        role_name: roleName,
        permissions
      }
    }, '登录成功');

  } catch (error) {
    console.error('[admin:login] 失败:', error);
    return response.error('登录失败', error);
  }
};
