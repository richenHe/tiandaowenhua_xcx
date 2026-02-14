/**
 * 管理端接口：推荐人变更日志
 * Action: admin:getRefereeChangeLogs
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log('[admin:getRefereeChangeLogs] 获取推荐人变更日志:', userId);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 查询变更日志
    let queryBuilder = db.from('referee_change_logs').select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化日志数据
    const changeTypeMap = {
      'user_update': '用户自主修改',
      'admin_update': '管理员修改',
      'admin_clear': '管理员清除'
    };

    const list = (result.list || []).map(log => {
      let operatorInfo = '';
      if (log.operator_type === 'user') {
        operatorInfo = `用户 ${log.user_id}`;
      } else if (log.operator_type === 'admin') {
        operatorInfo = `管理员 ${log.operator_id}`;
      }

      return {
        id: log.id,
        userId: log.user_id,
        oldRefereeId: log.old_referee_id,
        newRefereeId: log.new_referee_id,
        changeType: log.change_type,
        changeTypeText: changeTypeMap[log.change_type] || log.change_type,
        operatorType: log.operator_type,
        operatorInfo,
        remark: log.remark,
        createdAt: log.created_at
      };
    });

    console.log('[admin:getRefereeChangeLogs] 查询成功，共', result.total, '条');

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[admin:getRefereeChangeLogs] 查询失败:', error);
    return response.error('获取推荐人变更日志失败', error);
  }
};
