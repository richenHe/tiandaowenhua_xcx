/**
 * 管理端接口：获取通知配置列表
 * Action: getNotificationConfigList
 *
 * 参数：
 * - status: 状态筛选（可选）
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { status } = event;

  try {
    console.log(`[admin:getNotificationConfigList] 管理员 ${admin.id} 获取通知配置列表`);

    // 构建查询条件
    const where = {};
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }

    // 查询配置列表
    const configs = await query('notification_configs', {
      where,
      orderBy: { column: 'sort_order', ascending: true }
    });

    return response.success(configs, '获取成功');

  } catch (error) {
    console.error('[admin:getNotificationConfigList] 失败:', error);
    return response.error('获取通知配置列表失败', error);
  }
};
