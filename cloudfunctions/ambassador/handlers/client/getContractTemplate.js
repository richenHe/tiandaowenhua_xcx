/**
 * 客户端接口：获取协议模板
 * Action: getContractTemplate
 * 协议内容改为电子合同文件（PDF/Word），返回 contract_file_url 供下载查看
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

/** 等级名称映射 */
const LEVEL_NAMES = { 1: '准青鸾', 2: '青鸾', 3: '鸿鹄', 4: '金凤' };

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { level } = event;

  try {
    console.log(`[getContractTemplate] 获取协议模板:`, { user_id: user.id, level });

    // 参数验证
    if (!level) {
      return response.paramError('缺少必要参数: level');
    }

    // 查询指定等级的最新协议模板（数据库列名为 ambassador_level）
    const { data: templates, error } = await db
      .from('contract_templates')
      .select('id, contract_name, ambassador_level, version, contract_file_id, validity_years, effective_time')
      .eq('ambassador_level', level)
      .eq('status', 1)  // 启用状态
      .order('id', { ascending: true })
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
      .eq('contract_template_id', template.id)
      .single();

    const signature = signatures;

    // 电子合同文件 URL（用于下载查看）
    const contractFileUrl = template.contract_file_id ? cloudFileIDToURL(template.contract_file_id) : null;

    return response.success({
      template: {
        id: template.id,
        title: template.contract_name,
        version: template.version,
        level: template.ambassador_level,
        level_name: LEVEL_NAMES[template.ambassador_level] || '未知',
        validity_years: template.validity_years || 1,
        effective_date: template.effective_time ? template.effective_time.slice(0, 10) : null,
        contract_file_url: contractFileUrl
      },
      signed: !!signature,
      signature: signature ? {
        id: signature.id,
        signed_at: signature.sign_time,
        status: signature.status
      } : null
    });

  } catch (error) {
    console.error(`[getContractTemplate] 失败:`, error);
    return response.error('获取协议模板失败', error);
  }
};
