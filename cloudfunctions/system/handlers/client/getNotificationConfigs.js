/**
 * 客户端接口：获取通知配置列表
 * Action: getNotificationConfigs
 *
 * 功能：获取所有可订阅的通知类型
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log(`[getNotificationConfigs] 用户 ${user.id} 获取通知配置`);

    // 查询所有启用的通知配置
    const configs = await query('notification_configs', {
      where: { status: 1 },
      columns: 'id, name, description, template_id, scene, required',
      orderBy: { column: 'sort_order', ascending: true }
    });

    // 查询用户的订阅状态
    const subscriptions = await query('notification_subscriptions', {
      where: { user_id: user.id },
      columns: 'config_id, subscribed'
    });

    const subscriptionMap = {};
    subscriptions.forEach(s => {
      subscriptionMap[s.config_id] = s.subscribed === 1;
    });

    // 合并订阅状态
    const configsWithStatus = configs.map(c => ({
      ...c,
      subscribed: subscriptionMap[c.id] || false,
      can_unsubscribe: c.required === 0 // 非必需的可以取消订阅
    }));

    return response.success(configsWithStatus, '获取成功');

  } catch (error) {
    console.error('[getNotificationConfigs] 失败:', error);
    return response.error('获取通知配置失败', error);
  }
};
