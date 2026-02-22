/**
 * 管理端接口：通知配置管理
 * Action: manageNotificationConfig
 *
 * 参数：
 * - action: 操作类型（list/create/update/delete）
 * - id: 配置ID（update/delete时必需）
 * - template_id: 模板ID（create/update时必需）
 * - scene: 场景（create/update时必需）
 * - config_data: 配置数据（create/update时可选）
 */
const { db, findOne, insert, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { action, id, template_id, scene, config_data } = event;

  try {
    console.log(`[admin:manageNotificationConfig] 管理员 ${admin.id} 操作: ${action}`);

    switch (action) {
      case 'list': {
        // 获取配置列表
        const { data: configs, count, error } = await db
          .from('notification_configs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (error) throw error;

        return response.success({
          total: count || configs.length,
          list: configs
        }, '获取成功');
      }

      case 'create': {
        // 创建配置
        if (!template_id || !scene) {
          return response.paramError('缺少必要参数: template_id, scene');
        }

        const [config] = await insert('notification_configs', {
          template_id,
          scene,
          config_data: config_data || {},
          status: 1,
          created_by: admin.id
        });

        return response.success({ id: config.id }, '创建成功');
      }

      case 'update': {
        // 更新配置
        if (!id) {
          return response.paramError('缺少必要参数: id');
        }

        const existingConfig = await findOne('notification_configs', { id });
        if (!existingConfig) {
          return response.notFound('配置不存在');
        }

        const updateData = {};
        if (template_id) updateData.template_id = template_id;
        if (scene) updateData.scene = scene;
        if (config_data !== undefined) updateData.config_data = config_data;
        updateData.updated_by = admin.id;

        await update('notification_configs', updateData, { id });

        return response.success({ success: true, id }, '更新成功');
      }

      case 'delete': {
        // 删除配置
        if (!id) {
          return response.paramError('缺少必要参数: id');
        }

        const existingConfig = await findOne('notification_configs', { id });
        if (!existingConfig) {
          return response.notFound('配置不存在');
        }

        await update('notification_configs', { status: 0 }, { id });

        return response.success({ success: true, id }, '删除成功');
      }

      default:
        return response.paramError(`未知的操作: ${action}`);
    }

  } catch (error) {
    console.error(`[admin:manageNotificationConfig] ${action} 失败:`, error);
    return response.error('操作失败', error);
  }
};
