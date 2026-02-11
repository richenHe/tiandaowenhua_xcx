/**
 * 管理端接口：获取即将到期的协议
 * Action: getExpiringContracts
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { days = 30 } = event;

  try {
    console.log(`[getExpiringContracts] 查询即将到期的协议:`, { days });

    const { db } = require('../../common/db');

    // 计算到期时间范围
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // 查询即将到期的协议签署记录
    const { data: signatures, error } = await db
      .from('contract_signatures')
      .select(`
        *,
        user:users!fk_contract_signatures_user(id, real_name, phone, avatar, ambassador_level),
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version)
      `)
      .eq('status', 1)  // 有效
      .gte('contract_end', now.toISOString().split('T')[0])
      .lte('contract_end', futureDate.toISOString().split('T')[0])
      .order('contract_end', { ascending: true });

    if (error) throw error;

    // 格式化返回数据
    const list = (signatures || []).map(sig => {
      const expiryDate = new Date(sig.contract_end);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        id: sig.id,
        user_id: sig.user_id,
        user_name: sig.user?.real_name,
        phone: sig.user?.phone,
        avatar: sig.user?.avatar,
        ambassador_level: sig.ambassador_level,
        template_id: sig.contract_template_id,
        contract_name: sig.template?.contract_name || sig.contract_name,
        contract_version: sig.contract_version,
        sign_time: sig.sign_time,
        contract_end: sig.contract_end,
        days_remaining: daysRemaining,
        urgency: daysRemaining <= 7 ? 'high' : daysRemaining <= 15 ? 'medium' : 'low'
      };
    });

    // 按紧急程度分组统计
    const stats = {
      high: list.filter(item => item.urgency === 'high').length,
      medium: list.filter(item => item.urgency === 'medium').length,
      low: list.filter(item => item.urgency === 'low').length,
      total: list.length
    };

    return response.success({
      stats,
      list
    });

  } catch (error) {
    console.error(`[getExpiringContracts] 失败:`, error);
    return response.error('查询即将到期的协议失败', error);
  }
};
