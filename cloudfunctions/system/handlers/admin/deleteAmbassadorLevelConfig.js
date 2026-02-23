/**
 * 管理端接口：删除大使等级配置
 * Action: deleteAmbassadorLevelConfig
 *
 * 参数：
 * - level: 等级值（必填）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { level } = event;

  try {
    if (!level) {
      return response.paramError('缺少必要参数: level');
    }

    console.log(`[admin:deleteAmbassadorLevelConfig] 管理员 ${admin.id} 删除等级 ${level}`);

    const { error } = await db.from('ambassador_level_configs').delete().eq('level', level);
    if (error) throw error;

    return response.success({}, '删除成功');

  } catch (error) {
    console.error('[admin:deleteAmbassadorLevelConfig] 失败:', error);
    return response.error('删除等级配置失败', error);
  }
};
