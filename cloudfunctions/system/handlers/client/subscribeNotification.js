/**
 * 客户端接口：订阅/取消订阅通知
 * Action: subscribeNotification
 *
 * 参数：
 * - config_id: 通知配置ID
 * - subscribed: 是否订阅（true/false）
 */
const { findOne, insert, update, upsert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { config_id, subscribed } = event;

  try {
    // 参数验证
    if (!config_id || subscribed === undefined) {
      return response.paramError('缺少必要参数: config_id, subscribed');
    }

    console.log(`[subscribeNotification] 用户 ${user.id} ${subscribed ? '订阅' : '取消订阅'} 通知 ${config_id}`);

    // 验证通知配置存在
    const config = await findOne('notification_configs', { id: config_id });
    if (!config) {
      return response.paramError('通知配置不存在');
    }

    // 检查是否为必需通知
    if (config.required === 1 && !subscribed) {
      return response.error('该通知为必需通知，无法取消订阅');
    }

    // 使用 upsert 更新或插入订阅记录
    await upsert('notification_subscriptions', {
      user_id: user.id,
      config_id,
      subscribed: subscribed ? 1 : 0,
      updated_at: new Date()
    }, {
      onConflict: ['user_id', 'config_id']
    });

    return response.success({
      config_id,
      subscribed
    }, subscribed ? '订阅成功' : '取消订阅成功');

  } catch (error) {
    console.error('[subscribeNotification] 失败:', error);
    return response.error('操作失败', error);
  }
};
