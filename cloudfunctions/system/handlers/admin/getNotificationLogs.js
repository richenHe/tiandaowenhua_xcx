/**
 * 管理端接口：获取通知发送日志
 * Action: getNotificationLogs
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - user_id: 用户ID筛选（可选）
 * - send_type: 发送类型筛选（可选，1=系统通知 2=订阅消息）
 * - send_status: 发送状态筛选（可选，0=失败 1=成功）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, user_id, send_type, send_status } = event;

  try {
    console.log(`[admin:getNotificationLogs] 管理员 ${admin.id} 获取通知日志`);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询（使用外键名进行 JOIN）
    let queryBuilder = db
      .from('notification_logs')
      .select(`
        id,
        user_id,
        config_id,
        template_id,
        title,
        content,
        template_data,
        send_type,
        send_status,
        send_time,
        error_message,
        class_record_id,
        order_no,
        appointment_id,
        created_at,
        user:users!fk_notification_logs_user(real_name, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (user_id) {
      queryBuilder = queryBuilder.eq('user_id', user_id);
    }
    if (send_type != null && send_type !== '') {
      queryBuilder = queryBuilder.eq('send_type', parseInt(send_type));
    }
    if (send_status != null && send_status !== '') {
      queryBuilder = queryBuilder.eq('send_status', parseInt(send_status));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理数据
    const list = (result.list || []).map(log => {
      let templateData = null;

      // 安全解析 template_data 字段
      if (log.template_data) {
        try {
          if (typeof log.template_data === 'string') {
            templateData = JSON.parse(log.template_data);
          } else {
            templateData = log.template_data;
          }
        } catch (e) {
          console.error('[getNotificationLogs] 解析 template_data 失败:', e);
        }
      }

      return {
        ...log,
        template_data: templateData,
        send_type_text: getSendTypeText(log.send_type),
        send_status_text: getSendStatusText(log.send_status)
      };
    });

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getNotificationLogs] 失败:', error);
    return response.error('获取通知日志失败', error);
  }
};

// 获取发送类型文本
function getSendTypeText(type) {
  const typeMap = {
    1: '系统通知',
    2: '订阅消息',
    3: '模板消息'
  };
  return typeMap[type] || '未知';
}

// 获取发送状态文本
function getSendStatusText(status) {
  const statusMap = {
    0: '失败',
    1: '成功',
    2: '待发送'
  };
  return statusMap[status] || '未知';
}
