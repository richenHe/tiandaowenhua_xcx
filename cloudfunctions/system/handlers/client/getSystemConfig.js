/**
 * 客户端接口：获取系统配置
 * Action: client:getSystemConfig
 * @description 根据配置键获取系统配置值
 */
const cloudbase = require('@cloudbase/node-sdk');
const { response } = require('../../common');

// 初始化 CloudBase
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();

module.exports = async (event, context) => {
  const { key } = event;

  try {
    // 参数校验
    if (!key) {
      return response.paramError('配置键不能为空');
    }

    console.log('[getSystemConfig] 获取系统配置:', key);

    // 查询配置
    const result = await db.collection('system_configs')
      .where({
        config_key: key,
        status: 1
      })
      .field({
        config_value: true
      })
      .get();

    if (!result.data || result.data.length === 0) {
      return response.error('配置不存在或已禁用');
    }

    const config = result.data[0];

    console.log('[getSystemConfig] 查询成功');
    return response.success({
      value: config.config_value
    });

  } catch (error) {
    console.error('[getSystemConfig] 查询失败:', error);
    return response.error('获取系统配置失败', error);
  }
};
