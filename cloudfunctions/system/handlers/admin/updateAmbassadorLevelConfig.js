/**
 * 管理端接口：更新大使等级配置
 * Action: updateAmbassadorLevelConfig
 *
 * 参数：
 * - level: 等级（1-5）
 * - level_name: 等级名称
 * - upgrade_type: 升级方式（payment/contract）
 * - upgrade_conditions: 升级条件（JSON）
 * - benefits: 权益说明（JSON）
 * - description: 等级描述
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { level, level_name, upgrade_type, upgrade_conditions, benefits, description } = event;

  try {
    // 参数验证
    if (!level) {
      return response.paramError('缺少必要参数: level');
    }

    if (level < 1 || level > 5) {
      return response.paramError('等级范围应为1-5');
    }

    console.log(`[admin:updateAmbassadorLevelConfig] 管理员 ${admin.id} 更新等级 ${level} 配置`);

    // 查询配置是否存在
    const config = await findOne('ambassador_level_configs', { level });
    if (!config) {
      return response.notFound('等级配置不存在');
    }

    // 构建更新数据
    const updateData = {
      updated_at: new Date()
    };

    if (level_name) updateData.level_name = level_name;
    if (upgrade_type) updateData.upgrade_type = upgrade_type;
    if (description) updateData.description = description;

    if (upgrade_conditions) {
      updateData.upgrade_conditions = typeof upgrade_conditions === 'string'
        ? upgrade_conditions
        : JSON.stringify(upgrade_conditions);
    }

    if (benefits) {
      updateData.benefits = typeof benefits === 'string'
        ? benefits
        : JSON.stringify(benefits);
    }

    // 更新配置
    await update('ambassador_level_configs', updateData, { level });

    return response.success({ level }, '更新成功');

  } catch (error) {
    console.error('[admin:updateAmbassadorLevelConfig] 失败:', error);
    return response.error('更新大使等级配置失败', error);
  }
};
