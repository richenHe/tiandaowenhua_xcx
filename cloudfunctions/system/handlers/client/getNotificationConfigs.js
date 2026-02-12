/**
 * 客户端接口：获取通知配置列表
 * Action: getNotificationConfigs
 *
 * 功能：获取所有可订阅的通知类型
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;

  try {
    console.log(`[getNotificationConfigs] 用户 ${user.id} 获取通知配置`);

    // 查询所有启用的通知配置
    const { data: configs, error: configError } = await db
      .from('notification_configs')
      .select('id, name, config_name, template_name, trigger_type, status')
      .eq('status', 1)
      .order('id', { ascending: true });

    if (configError) throw configError;

    // 查询用户的订阅状态
    const { data: subscriptions, error: subError } = await db
      .from('notification_subscriptions')
      .select('config_id, subscribed')
      .eq('user_id', user.id);

    if (subError) throw subError;

    const subscriptionMap = {};
    (subscriptions || []).forEach(s => {
      subscriptionMap[s.config_id] = s.subscribed === 1;
    });

    // 合并订阅状态
    const configsWithStatus = (configs || []).map(c => ({
      id: c.id,
      name: c.name || c.config_name,
      template_name: c.template_name,
      trigger_type: c.trigger_type,
      subscribed: subscriptionMap[c.id] || false,
      can_unsubscribe: true // 都可以取消订阅
    }));

    return response.success(configsWithStatus, '获取成功');

  } catch (error) {
    console.error('[getNotificationConfigs] 失败:', error);
    return response.error('获取通知配置失败', error);
  }
};
