/**
 * 管理端接口：更新系统配置
 * Action: updateConfig
 *
 * 参数：
 * - key / config_key: 配置键
 * - value / config_value: 配置值
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { key, value, config_key, config_value } = event;
  
  // 兼容两种参数格式
  const configKey = key || config_key;
  const configValue = value !== undefined ? value : config_value;

  try {
    // 参数验证
    if (!configKey || configValue === undefined) {
      return response.paramError('缺少必要参数: key, value');
    }

    console.log(`[admin:updateConfig] 管理员 ${admin.id} 更新配置: ${configKey}`);

    // 查询配置是否存在
    const config = await findOne('system_configs', { config_key: configKey });

    const configValueStr = typeof configValue === 'object' ? JSON.stringify(configValue) : String(configValue);

    if (config) {
      // 更新配置
      await update('system_configs', {
        config_value: configValueStr,
        // updated_at 使用数据库默认值
      }, { id: config.id });
    } else {
      // 创建新配置
      await insert('system_configs', {
        config_key: configKey,
        config_value: configValueStr,
        value_type: typeof configValue === 'object' ? 'json' : 'string',
        // created_at 使用数据库默认值
      });
    }

    return response.success({ key: configKey, value: configValue }, '更新成功');

  } catch (error) {
    console.error('[admin:updateConfig] 失败:', error);
    return response.error('更新配置失败', error);
  }
};
