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
  console.log('[LOGIN STEP 1] login handler 开始');
  console.log('[LOGIN STEP 1] event:', JSON.stringify(event));
  
  const { username, password } = event;
  console.log('[LOGIN STEP 2] 提取参数 - username:', username, 'password:', password ? '***' : undefined);

  try {
    // 参数验证
    if (!username || !password) {
      console.log('[LOGIN STEP 3] 参数缺失');
      return response.paramError('缺少必要参数: username, password');
    }

    console.log(`[LOGIN STEP 4] 管理员登录尝试: ${username}`);

    // 查询管理员账号
    console.log('[LOGIN STEP 5] 查询管理员账号');
    const admin = await findOne('admin_users', { username });
    console.log('[LOGIN STEP 6] 查询结果:', admin ? '找到用户' : '未找到用户');
    if (!admin) {
      return response.error('用户名或密码错误', null, 401);
    }

    // 检查账号状态
    console.log('[LOGIN STEP 7] 检查账号状态:', admin.status);
    if (admin.status !== 1) {
      return response.error('账号已被禁用', null, 403);
    }

    // 验证密码（bcrypt）
    console.log('[LOGIN STEP 8] 验证密码');
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('[LOGIN STEP 9] 密码验证结果:', isPasswordValid);
    if (!isPasswordValid) {
      return response.error('用户名或密码错误', null, 401);
    }

    // 生成 JWT Token
    console.log('[LOGIN STEP 10] 生成 JWT Token');
    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role
    });
    console.log('[LOGIN STEP 11] Token 生成成功');

    // 更新最后登录时间
    // await update('admin_users', { last_login_at: new Date() }, { id: admin.id });

    // 解析 permissions
    console.log('[LOGIN STEP 12] 解析 permissions');
    let permissions = [];
    if (Array.isArray(admin.permissions)) {
      permissions = admin.permissions;
      console.log('[LOGIN STEP 12] permissions 是数组');
    } else if (admin.permissions) {
      try {
        permissions = JSON.parse(admin.permissions);
        console.log('[LOGIN STEP 12] permissions 解析成功');
      } catch (e) {
        console.error('[LOGIN STEP 12] permissions 解析失败:', e);
        permissions = [];
      }
    }

    // 返回登录结果
    console.log('[LOGIN STEP 13] 构造返回结果');
    const result = response.success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
        role: admin.role,
        permissions: permissions
      }
    }, '登录成功');
    console.log('[LOGIN STEP 14] 登录成功，返回结果');
    return result;

  } catch (error) {
    console.error('[LOGIN ERROR] 登录失败:', error);
    console.error('[LOGIN ERROR] 错误堆栈:', error.stack);
    return response.error('登录失败', error);
  }
};
