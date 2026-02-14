/**
 * 管理端接口：获取申请列表
 * Action: getApplicationList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { status, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getApplicationList] 查询申请列表:`, { status, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('ambassador_applications')
      .select(`
        *,
        user:users!fk_ambassador_applications_user(real_name, phone, avatar)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据
    const list = (result.list || []).map(app => ({
      id: app.id,
      user_id: app.user_id,
      user_name: app.user?.real_name,
      phone: app.user?.phone,
      avatar: app.user?.avatar,
      target_level: app.target_level,
      reason: app.reason,
      status: app.status,
      status_text: app.status === 0 ? '待审核' : app.status === 1 ? '已通过' : '已拒绝',
      reject_reason: app.reject_reason,
      created_at: app.created_at,
      reviewed_at: app.reviewed_at,
      reviewer_id: app.reviewer_id
    }));

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getApplicationList] 失败:`, error);
    return response.error('查询申请列表失败', error);
  }
};
