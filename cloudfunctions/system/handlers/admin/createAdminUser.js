/**
 * 管理端接口：创建管理员
 * Action: createAdminUser
 *
 * 参数：
 * - username: 用户名
 * - password: 密码
 * - real_name: 真实姓名
 * - role: 角色（super_admin/admin/operator）
 * - permissions: 权限列表（可选）
 */
const { findOne, insert } = require('../../common/db');
const { response } = require('../../common');
const crypto = require('crypto');

module.exports = async (event, context) => {
  const { admin } = context;
  const { username, password, real_name, role, permissions = [] } = event;

  try {
    // 参数验证
    if (!username || !password || !real_name || !role) {
      return response.paramError('缺少必要参数: username, password, real_name, role');
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return response.paramError('用户名长度应在3-20字符之间');
    }

    // 验证密码长度
    if (password.length < 6) {
      return response.paramError('密码长度不能少于6位');
    }

    console.log(`[admin:createAdminUser] 管理员 ${admin.id} 创建管理员: ${username}`);

    // 检查用户名是否已存在
    const existingAdmin = await findOne('admin_users', { username });
    if (existingAdmin) {
      return response.error('用户名已存在');
    }

    // 密码加密（MD5）
    const passwordHash = crypto.createHash('md5').update(password).digest('hex');

    // 创建管理员
    const [newAdmin] = await insert('admin_users', {
      username,
      password: passwordHash,
      real_name,
      role,
      permissions: JSON.stringify(permissions),
      status: 1,
      created_at: new Date()
    });

    return response.success({
      id: newAdmin.id,
      username: newAdmin.username
    }, '创建成功');

  } catch (error) {
    console.error('[admin:createAdminUser] 失败:', error);
    return response.error('创建管理员失败', error);
  }
};
