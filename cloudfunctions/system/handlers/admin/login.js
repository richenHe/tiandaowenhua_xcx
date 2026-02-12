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
    // 参数验证
    if (!username || !password) {
      return response.paramError('缺少必要参数: username, password');
    }

    console.log(`[admin:login] 管理员登录尝试: ${username}`);

    // 查询管理员账号
    const admin = await findOne('admin_users', { username });
    if (!admin) {
      return response.error('用户名或密码错误', null, 401);
    }

    // 检查账号状态
    if (admin.status !== 1) {
      return response.error('账号已被禁用', null, 403);
    }

    // 验证密码（bcrypt）
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return response.error('用户名或密码错误', null, 401);
    }

    // 生成 JWT Token
    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role
    });

    // 更新最后登录时间
    // await update('admin_users', { last_login_at: new Date() }, { id: admin.id });

    // 返回登录结果
    return response.success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
        role: admin.role,
        // permissions 字段可能是 JSON 类型（已解析）或字符串
        permissions: Array.isArray(admin.permissions) 
          ? admin.permissions 
          : (admin.permissions ? JSON.parse(admin.permissions) : [])
      }
    }, '登录成功');

  } catch (error) {
    console.error('[admin:login] 失败:', error);
    return response.error('登录失败', error);
  }
};
