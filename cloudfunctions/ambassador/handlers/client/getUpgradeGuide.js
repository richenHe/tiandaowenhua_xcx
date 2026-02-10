/**
 * 客户端接口：获取升级指南
 * Action: getUpgradeGuide
 */
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { target_level } = event;

  try {
    console.log(`[getUpgradeGuide] 获取升级指南:`, { user_id: user.id, target_level });

    // 参数验证
    if (!target_level) {
      return response.paramError('缺少必要参数: target_level');
    }

    // 验证目标等级
    if (target_level <= user.ambassador_level) {
      return response.error('目标等级必须高于当前等级');
    }

    // 获取目标等级配置
    const targetConfig = await business.getLevelConfig(target_level);
    if (!targetConfig) {
      return response.error('目标等级配置不存在');
    }

    // 获取当前等级配置
    const currentConfig = user.ambassador_level > 0
      ? await business.getLevelConfig(user.ambassador_level)
      : null;

    // 检查升级资格（支付方式）
    const paymentEligibility = await business.checkUpgradeEligibility({
      user_id: user.id,
      current_level: user.ambassador_level,
      target_level,
      upgrade_type: 'payment'
    });

    // 检查升级资格（协议方式）
    const contractEligibility = await business.checkUpgradeEligibility({
      user_id: user.id,
      current_level: user.ambassador_level,
      target_level,
      upgrade_type: 'contract'
    });

    // 查询用户当前数据
    const { db } = require('../../common/db');

    // 统计推荐人数
    const { count: refereeCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .is('deleted_at', null);

    // 统计推荐订单数
    const { count: orderCount } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .eq('pay_status', 1);

    return response.success({
      current_level: {
        level: user.ambassador_level,
        name: currentConfig?.level_name || '普通用户',
        benefits: currentConfig?.benefits || []
      },
      target_level: {
        level: target_level,
        name: targetConfig.level_name,
        benefits: targetConfig.benefits || []
      },
      upgrade_options: [
        {
          type: 'payment',
          name: '支付升级',
          eligible: paymentEligibility.eligible,
          fee: paymentEligibility.upgrade_fee || 0,
          reason: paymentEligibility.reason
        },
        {
          type: 'contract',
          name: '协议升级',
          eligible: contractEligibility.eligible,
          requirements: contractEligibility.requirements || [],
          reason: contractEligibility.reason
        }
      ],
      current_stats: {
        referee_count: refereeCount || 0,
        order_count: orderCount || 0,
        merit_points: user.merit_points_available || 0,
        cash_points: user.cash_points_available || 0
      },
      requirements: targetConfig.upgrade_requirements || {}
    });

  } catch (error) {
    console.error(`[getUpgradeGuide] 失败:`, error);
    return response.error('获取升级指南失败', error);
  }
};
