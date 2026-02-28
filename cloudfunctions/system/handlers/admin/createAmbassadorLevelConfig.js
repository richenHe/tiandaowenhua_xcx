/**
 * 管理端接口：新增大使等级配置
 * Action: createAmbassadorLevelConfig
 *
 * 参数：
 * - level: 等级值（必填，整数）
 * - levelName: 等级名称（必填）
 * - upgradeType: 升级方式（可选，payment/contract）
 * - description: 等级描述（可选）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { level, levelName, upgradeType = 'payment', description = '' } = event;

  try {
    if (!level || !levelName) {
      return response.paramError('缺少必要参数: level, levelName');
    }

    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1) {
      return response.paramError('等级值必须为正整数');
    }

    console.log(`[admin:createAmbassadorLevelConfig] 管理员 ${admin.id} 新增等级 ${levelNum}`);

    // 检查是否已存在
    const { data: existing } = await db.from('ambassador_level_configs')
      .select('id').eq('level', levelNum).single();
    if (existing) {
      return response.error(`等级 ${levelNum} 配置已存在`);
    }

    const { data: newConfig, error } = await db.from('ambassador_level_configs').insert({
      level: levelNum,
      level_name: levelName,
      level_desc: description || null,
      upgrade_conditions: null,
      benefits: null,
      merit_rate_basic: 0,
      merit_rate_advanced: 0,
      cash_rate_basic: 0,
      cash_rate_advanced: 0,
      frozen_points: 0,
      unfreeze_per_referral: 0,
      gift_quota_basic: 0,
      gift_quota_advanced: 0,
      upgrade_payment_amount: 0,
      _openid: ''
    }).select('id, level').single();

    if (error) throw error;

    return response.success({ id: newConfig.id, level: levelNum }, '新增成功');

  } catch (error) {
    console.error('[admin:createAmbassadorLevelConfig] 失败:', error);
    return response.error('新增等级配置失败', error);
  }
};
