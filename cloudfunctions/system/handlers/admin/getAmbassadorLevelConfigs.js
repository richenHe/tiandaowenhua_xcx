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
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    /**
     * 安全解析 JSON 字段
     * @param {any} value - 原始值（可能是字符串或已解析对象）
     * @param {string} fieldName - 字段名（用于日志）
     * @returns {any} 解析后的值，失败返回 null
     */
    function safeParseJson(value, fieldName) {
      if (value == null) return null;
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch (e) {
          console.error(`解析 ${fieldName} 失败:`, e.message);
          return null;
        }
      }
      return value;
    }

    const processedConfigs = (configs || []).map(c => ({
      ...c,
      upgrade_conditions: safeParseJson(c.upgrade_conditions, 'upgrade_conditions'),
      benefits:           safeParseJson(c.benefits, 'benefits'),
      upgrade_benefits:   safeParseJson(c.upgrade_benefits, 'upgrade_benefits'),
      apply_questions:    safeParseJson(c.apply_questions, 'apply_questions'),
    }));

    return response.success(processedConfigs, '获取成功');

  } catch (error) {
    console.error('[admin:getAmbassadorLevelConfigs] 失败:', error);
    return response.error('获取大使等级配置失败', error);
  }
};
