/**
 * 管理端接口：创建通知配置
 * Action: createNotificationConfig
 *
 * 参数：
 * - name: 通知名称
 * - description: 通知描述
 * - template_id: 模板ID
 * - scene: 使用场景
 * - required: 是否必需（0-否，1-是）
 * - sort_order: 排序
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { name, description, template_id, scene, required = 0, sort_order = 0 } = event;

  try {
    // 参数验证
    if (!name || !template_id || !scene) {
      return response.paramError('缺少必要参数: name, template_id, scene');
    }

    console.log(`[admin:createNotificationConfig] 管理员 ${admin.id} 创建通知配置`);

    // 创建配置
    const [config] = await insert('notification_configs', {
      name,
      description,
      template_id,
      scene,
      required,
      sort_order,
      status: 1,
      created_at: new Date()
    });

    return response.success({ id: config.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createNotificationConfig] 失败:', error);
    return response.error('创建通知配置失败', error);
  }
};
