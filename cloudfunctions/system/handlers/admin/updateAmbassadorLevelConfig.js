/**
 * 管理端接口：更新大使等级配置
 * Action: updateAmbassadorLevelConfig
 *
 * 参数：
 * - level: 等级（0-5）
 * - level_name: 等级名称
 * - level_desc: 等级描述文案（富文本 HTML，小程序等级体系页展示）
 * - upgrade_type: 升级方式（payment/contract）
 * - upgrade_conditions: 升级条件（JSON 数组）
 * - benefits: 权益说明（JSON 数组）
 * - upgrade_benefits: 升级权益文案（JSON 数组，{title, desc}）
 * - apply_questions: 申请列表文案（JSON 数组，{question}）
 */
const { findOne, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const {
    level, level_name, level_desc, upgrade_type,
    upgrade_conditions, benefits, upgrade_benefits, apply_questions,
    upgrade_payment_amount, frozen_points, unfreeze_per_referral,
    merit_rate_basic, merit_rate_advanced, cash_rate_basic, cash_rate_advanced,
    gift_quota_basic, gift_quota_advanced
  } = event;

  try {
    if (level == null || level === '') {
      return response.paramError('缺少必要参数: level');
    }

    if (level < 0 || level > 5) {
      return response.paramError('等级范围应为0-5');
    }

    console.log(`[admin:updateAmbassadorLevelConfig] 管理员 ${admin.id} 更新等级 ${level} 配置`);

    const config = await findOne('ambassador_level_configs', { level });
    if (!config) {
      return response.notFound('等级配置不存在');
    }

    const updateData = { updated_at: formatDateTime(new Date()) };

    if (level_name !== undefined) updateData.level_name = level_name;
    if (upgrade_type !== undefined) updateData.upgrade_type = upgrade_type;

    // 等级描述文案（支持富文本 HTML）
    if (level_desc !== undefined) updateData.level_desc = level_desc;

    if (upgrade_conditions !== undefined) {
      updateData.upgrade_conditions = typeof upgrade_conditions === 'string'
        ? upgrade_conditions
        : JSON.stringify(upgrade_conditions);
    }

    if (benefits !== undefined) {
      updateData.benefits = typeof benefits === 'string'
        ? benefits
        : JSON.stringify(benefits);
    }

    if (upgrade_benefits !== undefined) {
      updateData.upgrade_benefits = typeof upgrade_benefits === 'string'
        ? upgrade_benefits
        : JSON.stringify(upgrade_benefits);
    }

    // 申请列表文案（JSON 数组，每项 {question: string}）
    if (apply_questions !== undefined) {
      updateData.apply_questions = typeof apply_questions === 'string'
        ? apply_questions
        : JSON.stringify(apply_questions);
    }

    if (upgrade_payment_amount !== undefined) updateData.upgrade_payment_amount = upgrade_payment_amount;
    if (frozen_points !== undefined) updateData.frozen_points = frozen_points;
    if (unfreeze_per_referral !== undefined) updateData.unfreeze_per_referral = unfreeze_per_referral;
    if (merit_rate_basic !== undefined) updateData.merit_rate_basic = merit_rate_basic;
    if (merit_rate_advanced !== undefined) updateData.merit_rate_advanced = merit_rate_advanced;
    if (cash_rate_basic !== undefined) updateData.cash_rate_basic = cash_rate_basic;
    if (cash_rate_advanced !== undefined) updateData.cash_rate_advanced = cash_rate_advanced;
    if (gift_quota_basic !== undefined) updateData.gift_quota_basic = gift_quota_basic;
    if (gift_quota_advanced !== undefined) updateData.gift_quota_advanced = gift_quota_advanced;

    // 业务校验：功德分和积分全局互斥（同一等级不可同时配置）
    const finalMeritBasic = parseFloat(updateData.merit_rate_basic ?? config.merit_rate_basic) || 0;
    const finalMeritAdv = parseFloat(updateData.merit_rate_advanced ?? config.merit_rate_advanced) || 0;
    const finalCashBasic = parseFloat(updateData.cash_rate_basic ?? config.cash_rate_basic) || 0;
    const finalCashAdv = parseFloat(updateData.cash_rate_advanced ?? config.cash_rate_advanced) || 0;
    const hasMerit = finalMeritBasic > 0 || finalMeritAdv > 0;
    const hasCash = finalCashBasic > 0 || finalCashAdv > 0;
    if (hasMerit && hasCash) {
      return response.paramError('功德分和积分不能同时配置，请统一选择提成类型');
    }

    // 业务校验：冻结积分必须是单次解冻积分的整数倍
    const finalFrozen = parseFloat(updateData.frozen_points ?? config.frozen_points) || 0;
    const finalUnfreeze = parseFloat(updateData.unfreeze_per_referral ?? config.unfreeze_per_referral) || 0;
    if (finalUnfreeze > 0 && finalFrozen > 0 && finalFrozen % finalUnfreeze !== 0) {
      return response.paramError(`冻结积分(${finalFrozen})必须是单次解冻积分(${finalUnfreeze})的整数倍`);
    }

    await update('ambassador_level_configs', updateData, { level });

    return response.success({ level }, '更新成功');

  } catch (error) {
    console.error('[admin:updateAmbassadorLevelConfig] 失败:', error);
    return response.error('更新大使等级配置失败', error);
  }
};
