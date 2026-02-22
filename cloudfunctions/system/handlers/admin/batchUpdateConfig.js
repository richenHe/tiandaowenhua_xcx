/**
 * 管理端接口：批量更新配置
 * Action: batchUpdateConfig
 *
 * 参数：
 * - configs: 配置数组 [{ key, value }, ...]
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { configs } = event;

  try {
    // 参数验证
    if (!configs || !Array.isArray(configs) || configs.length === 0) {
      return response.paramError('缺少必要参数: configs（数组）');
    }

    console.log(`[admin:batchUpdateConfig] 管理员 ${admin.id} 批量更新配置 ${configs.length} 个`);

    const results = [];
    const errors = [];

    // 逐个更新配置
    for (const config of configs) {
      const { key, value } = config;

      if (!key) {
        errors.push({ key, error: '缺少 key' });
        continue;
      }

      try {
        // 查找配置
        const existingConfig = await findOne('system_configs', { config_key: key });

        if (!existingConfig) {
          errors.push({ key, error: '配置不存在' });
          continue;
        }

        // 系统配置检查
        if (existingConfig.is_system && admin.role !== 'super_admin') {
          errors.push({ key, error: '无权限修改系统配置' });
          continue;
        }

        // 更新配置
        await update('system_configs', {
          config_value: String(value),
          updated_by: admin.id
        }, { config_key: key });

        results.push({ key, success: true });

      } catch (error) {
        console.error(`[admin:batchUpdateConfig] 更新配置 ${key} 失败:`, error);
        errors.push({ key, error: error.message });
      }
    }

    return response.success({
      success: true,
      total: configs.length,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    }, `批量更新完成: 成功 ${results.length}/${configs.length}`);

  } catch (error) {
    console.error('[admin:batchUpdateConfig] 失败:', error);
    return response.error('批量更新配置失败', error);
  }
};
