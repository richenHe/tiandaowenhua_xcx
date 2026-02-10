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
        user:users!user_id(real_name, phone, avatar_url, ambassador_level),
        template:contract_templates(title, level, version, expiry_date)
      `)
      .eq('status', 1)  // 已签署
      .gte('template.expiry_date', now.toISOString())
      .lte('template.expiry_date', futureDate.toISOString())
      .order('template.expiry_date', { ascending: true });

    if (error) throw error;

    // 格式化返回数据
    const list = (signatures || []).map(sig => {
      const expiryDate = new Date(sig.template?.expiry_date);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        id: sig.id,
        user_id: sig.user_id,
        user_name: sig.user?.real_name,
        phone: sig.user?.phone,
        avatar_url: sig.user?.avatar_url,
        ambassador_level: sig.user?.ambassador_level,
        template_id: sig.template_id,
        template_title: sig.template?.title,
        template_level: sig.template_level,
        template_version: sig.template_version,
        signed_at: sig.signed_at,
        expiry_date: sig.template?.expiry_date,
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
