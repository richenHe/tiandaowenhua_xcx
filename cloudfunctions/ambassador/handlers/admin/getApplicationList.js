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
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询
    let queryBuilder = db
      .from('ambassador_applications')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true });

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 查询用户信息并格式化返回数据
    const list = await Promise.all((result.list || []).map(async (app) => {
      // 查询用户信息
      const { data: user } = await db
        .from('users')
        .select('real_name, phone, avatar, ambassador_level')
        .eq('id', app.user_id)
        .single();

      return {
        id: app.id,
        user_id: app.user_id,
        user_name: app.real_name || user?.real_name || '',
        phone: app.phone || user?.phone || '',
        avatar: user?.avatar || '',
        real_name: app.real_name,
        // 前端需要 current_level 字段
        current_level: user?.ambassador_level || 0,
        // 目标等级（申请表中没有 target_level 字段，用 status 辅助判断，实际存储在 audit_remark 或通过业务约定）
        target_level: app.target_level || null,
        city: app.city,
        occupation: app.occupation,
        apply_reason: app.apply_reason,
        // 前端列表用 reason 列，映射自 apply_reason
        reason: app.apply_reason || '',
        understanding: app.understanding,
        willing_help: app.willing_help,
        promotion_plan: app.promotion_plan,
        status: app.status,
        status_text: app.status === 0 ? '待审核' : app.status === 1 ? '已通过' : '已拒绝',
        reject_reason: app.reject_reason,
        created_at: app.created_at,
        audit_time: app.audit_time,
        audit_admin_id: app.audit_admin_id
      };
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
