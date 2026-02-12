/**
 * 管理端接口：获取管理员列表
 * Action: getAdminUserList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - status: 状态筛选（可选）
 */
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, status } = event;

  try {
    console.log(`[admin:getAdminUserList] 管理员 ${admin.id} 获取管理员列表`);

    const { limit, offset } = getPagination(page, page_size);

    // 构建查询
    let query = db
      .from('admin_users')
      .select('id, username, real_name, role, permissions, status, last_login_time, created_at')
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
    }

    // 分页
    const { data: admins, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (status !== undefined && status !== null && status !== '') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: total } = await countQuery;

    // 处理数据（permissions 是 JSON 类型，无需解析）
    const processedAdmins = admins.map(a => ({
      ...a,
      permissions: a.permissions || [],
      role_text: getRoleText(a.role),
      status_text: a.status === 1 ? '启用' : '禁用'
    }));

    return response.success({
      list: processedAdmins,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAdminUserList] 失败:', error);
    return response.error('获取管理员列表失败', error);
  }
};

// 获取角色文本
function getRoleText(role) {
  const roleMap = {
    'super_admin': '超级管理员',
    'admin': '管理员',
    'operator': '运营人员'
  };
  return roleMap[role] || '未知';
}
