/**
 * 管理端接口：获取角色列表
 * Action: getRoleList
 *
 * 参数：
 * - status: 状态筛选（可选，默认只返回启用的角色）
 *
 * 返回：角色列表（含权限信息）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { status } = event;

  try {
    console.log(`[admin:getRoleList] 管理员 ${admin.id} 获取角色列表`);

    let queryBuilder = db
      .from('admin_roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('id', { ascending: true });

    // 默认只返回启用角色，传 status 时按指定值筛选
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    } else {
      queryBuilder = queryBuilder.eq('status', 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    const list = (data || []).map(role => ({
      ...role,
      permissions: role.permissions || []
    }));

    return response.success({ list }, '获取成功');

  } catch (error) {
    console.error('[admin:getRoleList] 失败:', error);
    return response.error('获取角色列表失败', error);
  }
};
