/**
 * 管理端接口：获取通知配置列表
 * Action: getNotificationConfigList
 *
 * 参数：
 * - status: 状态筛选（可选）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { status } = event;

  try {
    console.log(`[admin:getNotificationConfigList] 管理员 ${admin.id} 获取通知配置列表`);

    // 构建查询
    let query = db
      .from('notification_configs')
      .select('*')
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
    }

    const { data: configs, error } = await query;

    if (error) {
      throw error;
    }

    return response.success(configs || [], '获取成功');

  } catch (error) {
    console.error('[admin:getNotificationConfigList] 失败:', error);
    return response.error('获取通知配置列表失败', error);
  }
};
