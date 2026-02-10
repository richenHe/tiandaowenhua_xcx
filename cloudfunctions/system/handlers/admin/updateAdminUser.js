/**
 * 管理端接口：更新管理员
 * Action: updateAdminUser
 *
 * 参数：
 * - id: 管理员ID
 * - password: 新密码（可选）
 * - real_name: 真实姓名（可选）
 * - role: 角色（可选）
 * - permissions: 权限列表（可选）
 * - status: 状态（可选）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const crypto = require('crypto');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id, password, real_name, role, permissions, status } = event;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:updateAdminUser] 管理员 ${admin.id} 更新管理员 ${id}`);

    // 验证管理员存在
    const targetAdmin = await findOne('admin_users', { id });
    if (!targetAdmin) {
      return response.notFound('管理员不存在');
    }

    // 不能修改自己的状态
    if (admin.id === id && status !== undefined) {
      return response.error('不能修改自己的状态');
    }

    // 构建更新数据
    const updateData = { updated_at: new Date() };

    if (password) {
      if (password.length < 6) {
        return response.paramError('密码长度不能少于6位');
      }
      updateData.password = crypto.createHash('md5').update(password).digest('hex');
    }

    if (real_name) updateData.real_name = real_name;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (status !== undefined) updateData.status = status;

    // 更新管理员
    await update('admin_users', updateData, { id });

    return response.success({ id }, '更新成功');

  } catch (error) {
    console.error('[admin:updateAdminUser] 失败:', error);
    return response.error('更新管理员失败', error);
  }
};
