/**
 * 管理端接口：获取申请列表
 * Action: getApplicationList
 */
const { query } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { status, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getApplicationList] 查询申请列表:`, { status, page });

    const { limit, offset } = getPagination(page, page_size);
    const { db } = require('../../common/db');

    // 构建查询
    let queryBuilder = db
      .from('ambassador_applications')
      .select(`
        *,
        user:users!user_id(real_name, phone, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 状态筛选
    if (status !== undefined && status !== null) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data: applications, error, count } = await queryBuilder;

    if (error) throw error;

    // 格式化返回数据
    const list = (applications || []).map(app => ({
      id: app.id,
      user_id: app.user_id,
      user_name: app.user?.real_name || app.real_name,
      phone: app.user?.phone || app.phone,
      avatar_url: app.user?.avatar_url,
      reason: app.reason,
      status: app.status,
      status_text: app.status === 0 ? '待审核' : app.status === 1 ? '已通过' : '已拒绝',
      reject_reason: app.reject_reason,
      created_at: app.created_at,
      reviewed_at: app.reviewed_at,
      reviewer_id: app.reviewer_id
    }));

    return response.success({
      total: count || 0,
      page,
      page_size,
      list
    });

  } catch (error) {
    console.error(`[getApplicationList] 失败:`, error);
    return response.error('查询申请列表失败', error);
  }
};
