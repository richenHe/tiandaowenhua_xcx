/**
 * 管理端接口：获取系统配置
 * Action: getConfig
 *
 * 参数：
 * - key: 配置键（可选，不传则返回所有配置）
 */
const { findOne, query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { key } = event;

  try {
    console.log(`[admin:getConfig] 管理员 ${admin.id} 获取配置`);

    if (key) {
      // 获取单个配置
      const config = await findOne('system_configs', { config_key: key });
      if (!config) {
        return response.notFound('配置不存在');
      }

      return response.success({
        key: config.config_key,
        value: parseConfigValue(config.config_value, config.value_type),
        description: config.description
      }, '获取成功');
    } else {
      // 获取所有配置
      const configs = await query('system_configs', {
        orderBy: { column: 'config_key', ascending: true }
      });

      const configMap = {};
      configs.forEach(c => {
        configMap[c.config_key] = {
          value: parseConfigValue(c.config_value, c.value_type),
          description: c.description,
          value_type: c.value_type
        };
      });

      return response.success(configMap, '获取成功');
    }

  } catch (error) {
    console.error('[admin:getConfig] 失败:', error);
    return response.error('获取配置失败', error);
  }
};

// 解析配置值
function parseConfigValue(value, type) {
  if (!value) return null;

  switch (type) {
    case 'json':
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true' || value === '1';
    default:
      return value;
  }
}
