/**
 * 管理端接口：更新系统配置
 * Action: updateConfig
 *
 * 参数：
 * - key: 配置键
 * - value: 配置值
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { key, value } = event;

  try {
    // 参数验证
    if (!key || value === undefined) {
      return response.paramError('缺少必要参数: key, value');
    }

    console.log(`[admin:updateConfig] 管理员 ${admin.id} 更新配置: ${key}`);

    // 查询配置是否存在
    const config = await findOne('system_configs', { config_key: key });

    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (config) {
      // 更新配置
      await update('system_configs', {
        config_value: configValue,
        updated_at: new Date()
      }, { id: config.id });
    } else {
      // 创建新配置
      await insert('system_configs', {
        config_key: key,
        config_value: configValue,
        value_type: typeof value === 'object' ? 'json' : 'string',
        created_at: new Date()
      });
    }

    return response.success({ key, value }, '更新成功');

  } catch (error) {
    console.error('[admin:updateConfig] 失败:', error);
    return response.error('更新配置失败', error);
  }
};
