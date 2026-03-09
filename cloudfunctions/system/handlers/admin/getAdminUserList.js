/**
 * 管理端接口：获取管理员列表
 * Action: getAdminUserList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - status: 状态筛选（可选）
 */
const { db, query: dbQuery } = require('../../common/db');
const { response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, status } = event;

  try {
    console.log(`[admin:getAdminUserList] 管理员 ${admin.id} 获取管理员列表`);

    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('admin_users')
      .select('id, username, real_name, role, permissions, status, last_login_time, created_at', { count: 'exact' })
      .order('id', { ascending: true });

    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 从 admin_roles 表动态获取角色名称映射
    const roles = await dbQuery('admin_roles', { columns: 'role_key, role_name' });
    const roleMap = {};
    (roles || []).forEach(r => { roleMap[r.role_key] = r.role_name; });

    const keyword = event.keyword || '';
    const processedList = (result.list || []).map(a => ({
      ...a,
      permissions: a.permissions || [],
      role_text: roleMap[a.role] || a.role || '未知',
      status_text: a.status === 1 ? '启用' : '禁用',
      last_login_at: a.last_login_time || null
    })).filter(a => {
      if (!keyword) return true;
      return (a.username || '').includes(keyword) || (a.real_name || '').includes(keyword);
    });

    return response.success({
      ...result,
      list: processedList
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAdminUserList] 失败:', error);
    return response.error('获取管理员列表失败', error);
  }
};
