/**
 * 管理端接口：评估名单列表
 * Action: getEvaluationList
 *
 * 参数：
 * - page: 页码（可选，默认1）
 * - pageSize: 每页数量（可选，默认20）
 * - keyword: 搜索关键词，姓名/手机号（可选）
 *
 * 返回：
 * - list: 用户列表（含各岗位加分汇总、扣分汇总、黑名单状态）
 * - total: 总数
 * - positionTypes: 岗位类型列表
 * - config: 阈值配置
 */
const { db, response, getPagination, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page, pageSize, keyword } = event;

  try {
    const { offset, limit } = getPagination(page, pageSize);

    // 1. 查询阈值配置
    const { data: configList } = await db.from('blacklist_config').select('*');
    const config = {};
    (configList || []).forEach(item => {
      config[item.config_key] = item.config_value;
    });

    // 2. 查询岗位类型列表
    const { data: positionTypes } = await db.from('ambassador_position_types')
      .select('id, name')
      .eq('status', 1)
      .order('sort_order', { ascending: true });

    // 3. 查询用户（带搜索和分页）
    let countQuery = db.from('users').select('id');
    let userQuery = db.from('users').select('id, real_name, phone, avatar, ambassador_level');

    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      if (/^\d+$/.test(kw)) {
        countQuery = countQuery.eq('phone', kw);
        userQuery = userQuery.eq('phone', kw);
      } else {
        countQuery = countQuery.like('real_name', `%${kw}%`);
        userQuery = userQuery.like('real_name', `%${kw}%`);
      }
    }

    const { data: countData } = await countQuery;
    const total = countData ? countData.length : 0;

    const { data: users } = await userQuery
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!users || users.length === 0) {
      return response.success({
        list: [],
        total: 0,
        positionTypes: positionTypes || [],
        config
      });
    }

    const userIds = users.map(u => u.id);

    // 4. 批量查询表现分汇总（按用户+类型+岗位分组）
    const { data: allScores } = await db.from('performance_scores')
      .select('user_id, type, position_type_id, position_name, score')
      .in('user_id', userIds);

    // 按用户聚合分数
    const scoreMap = {};
    (allScores || []).forEach(s => {
      if (!scoreMap[s.user_id]) {
        scoreMap[s.user_id] = { positionScores: {}, studentDeduction: 0, activityDeduction: 0, totalAdd: 0 };
      }
      const userScore = scoreMap[s.user_id];

      if (s.type === 1) {
        // 加分，按岗位汇总
        const posKey = s.position_name || '未知岗位';
        userScore.positionScores[posKey] = (userScore.positionScores[posKey] || 0) + parseFloat(s.score);
        userScore.totalAdd += parseFloat(s.score);
      } else if (s.type === 2) {
        userScore.studentDeduction += parseFloat(s.score);
      } else if (s.type === 3) {
        userScore.activityDeduction += parseFloat(s.score);
      }
    });

    // 5. 批量查询黑名单状态
    const { data: blacklistData } = await db.from('user_blacklist')
      .select('user_id, blacklist_type, blacklist_months, blacklist_start_time, blacklist_end_time, status')
      .in('user_id', userIds)
      .eq('status', 1);

    const blacklistMap = {};
    (blacklistData || []).forEach(b => {
      if (!blacklistMap[b.user_id]) blacklistMap[b.user_id] = {};
      blacklistMap[b.user_id][b.blacklist_type] = b;
    });

    // 6. 组装返回数据
    const list = users.map(user => {
      const scores = scoreMap[user.id] || { positionScores: {}, studentDeduction: 0, activityDeduction: 0, totalAdd: 0 };
      const blacklist = blacklistMap[user.id] || {};

      const now = new Date();
      const courseBlacklist = blacklist[1];
      const activityBlacklist = blacklist[2];

      return {
        id: user.id,
        real_name: user.real_name,
        phone: user.phone,
        avatar: cloudFileIDToURL(user.avatar || ''),
        ambassador_level: user.ambassador_level,
        position_scores: scores.positionScores,
        total_add: scores.totalAdd,
        student_deduction: scores.studentDeduction,
        activity_deduction: scores.activityDeduction,
        course_blacklist: courseBlacklist ? {
          active: new Date(courseBlacklist.blacklist_end_time) > now,
          months: courseBlacklist.blacklist_months,
          start_time: courseBlacklist.blacklist_start_time,
          end_time: courseBlacklist.blacklist_end_time
        } : null,
        activity_blacklist: activityBlacklist ? {
          active: new Date(activityBlacklist.blacklist_end_time) > now,
          months: activityBlacklist.blacklist_months,
          start_time: activityBlacklist.blacklist_start_time,
          end_time: activityBlacklist.blacklist_end_time
        } : null
      };
    });

    return response.success({
      list,
      total,
      positionTypes: positionTypes || [],
      config
    });

  } catch (error) {
    console.error('[admin:getEvaluationList] 失败:', error);
    return response.error('查询评估名单失败', error);
  }
};
