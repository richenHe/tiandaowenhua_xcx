/**
 * 管理端接口：获取大使等级配置列表
 * Action: getAmbassadorLevelConfigs
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;

  try {
    console.log(`[admin:getAmbassadorLevelConfigs] 管理员 ${admin.id} 获取大使等级配置`);

    // 查询所有等级配置
    const { data: configs, error } = await db
      .from('ambassador_level_configs')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      throw error;
    }

    // 解析 JSON 字段（安全解析）
    const processedConfigs = (configs || []).map(c => {
      let upgrade_conditions = null;
      let benefits = null;
      
      try {
        if (c.upgrade_conditions && typeof c.upgrade_conditions === 'string') {
          upgrade_conditions = JSON.parse(c.upgrade_conditions);
        } else if (typeof c.upgrade_conditions === 'object') {
          upgrade_conditions = c.upgrade_conditions;
        }
      } catch (e) {
        console.error('解析 upgrade_conditions 失败:', e.message);
      }
      
      try {
        if (c.benefits && typeof c.benefits === 'string') {
          benefits = JSON.parse(c.benefits);
        } else if (typeof c.benefits === 'object') {
          benefits = c.benefits;
        }
      } catch (e) {
        console.error('解析 benefits 失败:', e.message);
      }
      
      return {
        ...c,
        upgrade_conditions,
        benefits
      };
    });

    return response.success(processedConfigs, '获取成功');

  } catch (error) {
    console.error('[admin:getAmbassadorLevelConfigs] 失败:', error);
    return response.error('获取大使等级配置失败', error);
  }
};
