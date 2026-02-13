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
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, user_id, send_type, send_status } = event;

  try {
    console.log(`[admin:getNotificationLogs] 管理员 ${admin.id} 获取通知日志`);

    const { limit, offset } = getPagination(page, page_size);

    // 构建查询（使用外键名进行 JOIN）
    let query = db
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
      `)
      .order('created_at', { ascending: false });

    // 筛选条件
    if (user_id) query = query.eq('user_id', user_id);
    if (send_type != null && send_type !== '') {
      query = query.eq('send_type', parseInt(send_type));
    }
    if (send_status != null && send_status !== '') {
      query = query.eq('send_status', parseInt(send_status));
    }

    // 分页
    const { data: logs, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('notification_logs')
      .select('*', { count: 'exact', head: true });

    if (user_id) countQuery = countQuery.eq('user_id', user_id);
    if (send_type != null && send_type !== '') {
      countQuery = countQuery.eq('send_type', parseInt(send_type));
    }
    if (send_status != null && send_status !== '') {
      countQuery = countQuery.eq('send_status', parseInt(send_status));
    }

    const { count: total } = await countQuery;

    // 处理数据
    const processedLogs = logs.map(log => {
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
      list: processedLogs,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
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
