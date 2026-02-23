/**
 * 客户端接口：获取系统配置
 * Action: client:getSystemConfig
 * @description 根据配置键获取系统配置值
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { key } = event;

  try {
    // 参数校验
    if (!key) {
      return response.paramError('配置键不能为空');
    }

    console.log('[getSystemConfig] 获取系统配置:', key);

    const { data, error } = await db
      .from('system_configs')
      .select('config_value')
      .eq('config_key', key)
      .eq('status', 1)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return response.error('配置不存在或已禁用');
    }

    console.log('[getSystemConfig] 查询成功');
    return response.success({
      value: data[0].config_value
    });

  } catch (error) {
    console.error('[getSystemConfig] 查询失败:', error);
    return response.error('获取系统配置失败', error);
  }
};
