/**
 * 客户端接口：大使升级
 * Action: upgrade
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { target_level, upgrade_type } = event;

  try {
    console.log(`[upgrade] 大使升级:`, { user_id: user.id, target_level, upgrade_type });

    // 参数验证
    if (!target_level || !upgrade_type) {
      return response.paramError('缺少必要参数: target_level, upgrade_type');
    }

    // 验证目标等级
    if (target_level <= user.ambassador_level) {
      return response.error('目标等级必须高于当前等级');
    }

    // 检查升级资格
    const eligibility = await business.checkUpgradeEligibility({
      user_id: user.id,
      current_level: user.ambassador_level,
      target_level,
      upgrade_type
    });

    if (!eligibility.eligible) {
      return response.error(eligibility.reason || '不满足升级条件');
    }

    // 根据升级类型处理
    if (upgrade_type === 'payment') {
      // 支付升级：创建升级订单
      const { db } = require('../../common/db');
      const orderNo = business.generateOrderNo('UPG');

      const [order] = await db
        .from('orders')
        .insert({
          order_no: orderNo,
          user_id: user.id,
          order_type: 3,  // 升级订单
          related_id: target_level,
          original_amount: eligibility.upgrade_fee,
          discount_amount: 0,
          final_amount: eligibility.upgrade_fee,
          pay_status: 0,
          created_at: new Date().toISOString(),
          expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        })
        .select();

      return response.success({
        order_id: order.id,
        order_no: orderNo,
        amount: eligibility.upgrade_fee,
        message: '请完成支付以升级'
      }, '升级订单创建成功');

    } else if (upgrade_type === 'contract') {
      // 协议升级：验证协议签署
      const contract = await findOne('contract_signatures', {
        user_id: user.id,
        template_level: target_level,
        status: 1  // 已签署
      });

      if (!contract) {
        return response.error('请先签署对应等级的协议');
      }

      // 执行升级
      await business.processAmbassadorUpgrade({
        user_id: user.id,
        from_level: user.ambassador_level,
        to_level: target_level,
        upgrade_type: 'contract',
        contract_id: contract.id
      });

      return response.success({
        new_level: target_level,
        message: '恭喜您升级成功！'
      }, '升级成功');

    } else {
      return response.paramError('不支持的升级类型');
    }

  } catch (error) {
    console.error(`[upgrade] 失败:`, error);
    return response.error('升级失败', error);
  }
};
