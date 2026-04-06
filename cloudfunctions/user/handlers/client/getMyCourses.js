/**
 * 客户端接口：获取我的课程列表
 * Action: client:getMyCourses
 *
 * 使用 Supabase 风格 JOIN 查询，利用外键约束优化性能
 */
const { db } = require('../../common/db');
const { response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 10, pageSize } = event;

  try {
    console.log('[getMyCourses] 获取我的课程:', user.id);

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询（利用外键 fk_user_courses_course）
    // 返回 status=1（有效）和 status=3（已过期）的记录，均展示
    let queryBuilder = db
      .from('user_courses')
      .select(`
        *,
        course:courses!fk_user_courses_course(
          id,
          name,
          type,
          cover_image,
          original_price,
          current_price,
          description,
          duration,
          teacher,
          outline,
          validity_days
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', [1, 3])
      .order('id', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const rawList = result.list || [];

    // 对 contract_signed=0 的课程，批量查询待审核(status=5)和已驳回(status=6)签署记录
    const unsignedCourseIds = rawList
      .filter(uc => !uc.contract_signed)
      .map(uc => uc.course_id);

    let pendingAuditCourseIds = new Set();
    // courseId → reject_reason
    let rejectedCourseMap = {};
    if (unsignedCourseIds.length > 0) {
      const { data: recentSigs } = await db
        .from('contract_signatures')
        .select('course_id, status, reject_reason')
        .eq('user_id', user.id)
        .in('status', [5, 6])
        .in('course_id', unsignedCourseIds)
        .order('id', { ascending: false });

      if (recentSigs) {
        // 每门课只取最新一条（降序，Map 中已有的不覆盖）
        recentSigs.forEach(s => {
          if (s.status === 5 && !pendingAuditCourseIds.has(s.course_id)) {
            pendingAuditCourseIds.add(s.course_id);
          }
          if (s.status === 6 && !(s.course_id in rejectedCourseMap)) {
            rejectedCourseMap[s.course_id] = s.reject_reason || '无';
          }
        });
      }
    }

    // 格式化数据
    const list = rawList.map(uc => ({
      id: uc.id,
      user_id: uc.user_id,
      course_id: uc.course_id,
      buy_price: uc.buy_price,
      buy_time: uc.buy_time,
      attend_count: uc.attend_count,
      expire_at: uc.expire_at,
      contract_signed: uc.contract_signed || 0,
      // 合同待审核：已签署但未通过，禁止预约
      contract_audit_pending: pendingAuditCourseIds.has(uc.course_id),
      // 合同已驳回：显示驳回原因，可重新签署
      contract_rejected: uc.course_id in rejectedCourseMap,
      contract_reject_reason: rejectedCourseMap[uc.course_id] || null,
      pending_days: uc.pending_days || 0,
      is_gift: uc.is_gift || 0,
      source_course_id: uc.source_course_id || null,
      source_order_id: uc.source_order_id || null,
      status: uc.status,
      created_at: uc.created_at,
      // 课程信息
      title: uc.course?.name,
      cover_image: uc.course?.cover_image,
      type: uc.course?.type,
      original_price: uc.course?.original_price,
      current_price: uc.course?.current_price,
      description: uc.course?.description,
      duration: uc.course?.duration,
      teacher: uc.course?.teacher,
      outline: uc.course?.outline,
      validity_days: uc.course?.validity_days
    }));

    console.log('[getMyCourses] 查询成功，共', result.total, '条');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[getMyCourses] 查询失败:', error);
    return response.error('获取课程列表失败', error);
  }
};
