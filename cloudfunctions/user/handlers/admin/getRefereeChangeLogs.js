/**
 * 管理端接口：推荐人变更日志
 * Action: admin:getRefereeChangeLogs
 * 
 * ⚠️ 注意：此接口涉及多个 LEFT JOIN
 * CloudBase SDK 查询构建器不支持，需要使用 MCP 工具或其他方案
 * 当前版本：简化实现，只查询变更日志基本信息，不包含关联的用户信息
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, page = 1, pageSize = 20 } = event;

  try {
    console.log('[admin:getRefereeChangeLogs] 获取推荐人变更日志:', userId);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 查询变更日志（使用 CloudBase Query Builder）
    let logQuery = db.from('referee_change_logs').select('*');
    
    if (userId) {
      logQuery = logQuery.eq('user_id', userId);
    }
    
    const { data: logs, error: logError } = await logQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (logError) {
      throw new Error(`查询日志失败: ${logError.message}`);
    }

    // 查询总数
    let countQuery = db.from('referee_change_logs').select('*', { count: 'exact', head: true });
    
    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }
    
    const { count: total, error: countError } = await countQuery;
    
    if (countError) {
      throw new Error(`查询总数失败: ${countError.message}`);
    }

    // ⚠️ 格式化日志数据（简化版，缺少用户名信息）
    const formattedLogs = logs.map(log => {
      const changeTypeMap = {
        'user_update': '用户自主修改',
        'admin_update': '管理员修改',
        'admin_clear': '管理员清除'
      };

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
        createdAt: log.created_at,
        _note: '⚠️ 用户详细信息（姓名、手机号）需要使用 MCP 工具实现 JOIN 查询'
      };
    });

    console.log('[admin:getRefereeChangeLogs] 查询成功，共', total, '条');
    console.warn('[admin:getRefereeChangeLogs] 当前版本不包含用户详细信息（需要 JOIN 查询）');

    return response.success({
      total,
      page,
      pageSize,
      list: formattedLogs
    });

  } catch (error) {
    console.error('[admin:getRefereeChangeLogs] 查询失败:', error);
    return response.error('获取推荐人变更日志失败', error);
  }
};
