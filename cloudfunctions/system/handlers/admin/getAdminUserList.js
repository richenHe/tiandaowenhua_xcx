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
const { response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, status } = event;

  try {
    console.log(`[admin:getAdminUserList] 管理员 ${admin.id} 获取管理员列表`);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('admin_users')
      .select('id, username, real_name, role, permissions, status, last_login_time, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理数据（permissions 是 JSON 类型，无需解析）
    const processedList = (result.list || []).map(a => ({
      ...a,
      permissions: a.permissions || [],
      role_text: getRoleText(a.role),
      status_text: a.status === 1 ? '启用' : '禁用'
    }));

    return response.success({
      ...result,
      list: processedList
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
