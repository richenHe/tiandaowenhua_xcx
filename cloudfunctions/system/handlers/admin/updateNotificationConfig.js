/**
 * 管理端接口：更新通知配置
 * Action: updateNotificationConfig
 *
 * 参数：
 * - id: 配置ID
 * - name: 通知名称（可选）
 * - description: 通知描述（可选）
 * - template_id: 模板ID（可选）
 * - scene: 使用场景（可选）
 * - required: 是否必需（可选）
 * - sort_order: 排序（可选）
 * - status: 状态（可选）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id, name, description, template_id, scene, required, sort_order, status } = event;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:updateNotificationConfig] 管理员 ${admin.id} 更新通知配置 ${id}`);

    // 验证配置存在
    const config = await findOne('notification_configs', { id });
    if (!config) {
      return response.notFound('通知配置不存在');
    }

    // 构建更新数据
    const updateData = { updated_at: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (template_id) updateData.template_id = template_id;
    if (scene) updateData.scene = scene;
    if (required !== undefined) updateData.required = required;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (status !== undefined) updateData.status = status;

    // 更新配置
    await update('notification_configs', updateData, { id });

    return response.success({ id }, '更新成功');

  } catch (error) {
    console.error('[admin:updateNotificationConfig] 失败:', error);
    return response.error('更新通知配置失败', error);
  }
};
