/**
 * 管理端接口：获取大使等级配置列表
 * Action: getAmbassadorLevelConfigs
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;

  try {
    console.log(`[admin:getAmbassadorLevelConfigs] 管理员 ${admin.id} 获取大使等级配置`);

    // 查询所有等级配置
    const configs = await query('ambassador_level_configs', {
      orderBy: { column: 'level', ascending: true }
    });

    // 解析 JSON 字段
    const processedConfigs = configs.map(c => ({
      ...c,
      upgrade_conditions: c.upgrade_conditions ? JSON.parse(c.upgrade_conditions) : null,
      benefits: c.benefits ? JSON.parse(c.benefits) : null
    }));

    return response.success(processedConfigs, '获取成功');

  } catch (error) {
    console.error('[admin:getAmbassadorLevelConfigs] 失败:', error);
    return response.error('获取大使等级配置失败', error);
  }
};
