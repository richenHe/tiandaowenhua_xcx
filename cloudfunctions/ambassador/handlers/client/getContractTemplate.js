/**
 * 客户端接口：获取协议模板
 * Action: getContractTemplate
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { level } = event;

  try {
    console.log(`[getContractTemplate] 获取协议模板:`, { user_id: user.id, level });

    // 参数验证
    if (!level) {
      return response.paramError('缺少必要参数: level');
    }

    // 查询指定等级的最新协议模板
    const { data: templates, error } = await db
      .from('contract_templates')
      .select('*')
      .eq('level', level)
      .eq('status', 1)  // 启用状态
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const template = templates;

    if (!template) {
      return response.error('该等级暂无可用协议模板');
    }

    // 检查用户是否已签署该协议
    const { data: signatures } = await db
      .from('contract_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('template_id', template.id)
      .single();

    const signature = signatures;

    return response.success({
      template: {
        id: template.id,
        title: template.title,
        content: template.content,
        level: template.level,
        version: template.version,
        effective_date: template.effective_date,
        expiry_date: template.expiry_date
      },
      signed: !!signature,
      signature: signature ? {
        id: signature.id,
        signed_at: signature.signed_at,
        status: signature.status
      } : null
    });

  } catch (error) {
    console.error(`[getContractTemplate] 失败:`, error);
    return response.error('获取协议模板失败', error);
  }
};
