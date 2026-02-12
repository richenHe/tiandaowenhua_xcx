/**
 * 管理端接口：获取通知发送日志
 * Action: getNotificationLogs
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - user_id: 用户ID筛选（可选）
 * - scene: 场景筛选（可选）
 * - status: 状态筛选（可选）
 */
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, user_id, scene, status } = event;

  try {
    console.log(`[admin:getNotificationLogs] 管理员 ${admin.id} 获取通知日志`);

    const { limit, offset } = getPagination(page, page_size);

    // 构建查询（使用外键名进行 JOIN）
    let query = db
      .from('notification_logs')
      .select(`
        id,
        user_id,
        scene,
        template_id,
        data,
        status,
        error_msg,
        created_at,
        user:users!fk_notification_logs_user(real_name, phone)
      `)
      .order('created_at', { ascending: false });

    // 筛选条件
    if (user_id) query = query.eq('user_id', user_id);
    if (scene) query = query.eq('scene', scene);
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
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
    if (scene) countQuery = countQuery.eq('scene', scene);
    if (status !== undefined && status !== null && status !== '') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: total } = await countQuery;

    // 处理数据
    const processedLogs = logs.map(log => ({
      ...log,
      data: log.data ? JSON.parse(log.data) : null,
      status_text: log.status === 1 ? '成功' : '失败'
    }));

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
