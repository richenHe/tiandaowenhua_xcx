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
    const finalPageSize = pageSize || page_size || 20;

    // 查询变更日志
    let queryBuilder = db.from('referee_change_logs').select('*', { count: 'exact' })
      .order('id', { ascending: false });

    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化日志数据，字段名与前端 referee-logs.html 对齐（snake_case）
    const changeTypeMap = {
      1: '系统自动',
      2: '管理员修改',
      3: '异常变更',
      'user_update': '用户自主修改',
      'admin_update': '管理员修改',
      'admin_clear': '管理员清除'
    };

    const list = (result.list || []).map(log => {
      // 操作人名称
      let operatorName = '系统';
      if (log.operator_type === 'admin' && log.admin_id) {
        operatorName = `管理员(${log.admin_id})`;
      } else if (log.operator_type === 'user') {
        operatorName = '用户';
      }

      return {
        id: log.id,
        // 前端使用 snake_case
        user_id: log.user_id,
        user_name: log.user_name || '',           // 变更的用户名
        old_referee_id: log.old_referee_id,
        old_referee_name: log.old_referee_name || '',   // 原推荐人名
        new_referee_id: log.new_referee_id,
        new_referee_name: log.new_referee_name || '',   // 新推荐人名
        change_type: log.change_type,
        change_type_text: changeTypeMap[log.change_type] || String(log.change_type),
        operator_name: operatorName,
        reason: log.remark || '',      // 前端 reason 列对应数据库 remark
        remark: log.remark || '',
        created_at: log.created_at
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
