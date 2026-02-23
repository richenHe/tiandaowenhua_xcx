/**
 * 客户端接口：签署协议
 * Action: signContract
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { templateId, template_id, agreed } = event;
  const finalTemplateId = templateId || template_id; // 支持两种命名

  try {
    console.log(`[signContract] 签署协议:`, { user_id: user.id, template_id: finalTemplateId });

    // 参数验证
    if (!finalTemplateId || agreed !== true) {
      return response.paramError('缺少必要参数或未同意协议');
    }

    // 查询协议模板
    const { data: templates, error: templateError } = await db
      .from('contract_templates')
      .select('*')
      .eq('id', finalTemplateId)
      .single();

    if (templateError || !templates) {
      return response.error('协议模板不存在');
    }

    const template = templates;

    if (template.status !== 1) {
      return response.error('该协议已停用');
    }

    // 检查是否已签署（数据库列名为 contract_template_id）
    const { data: existingSignatures } = await db
      .from('contract_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('contract_template_id', finalTemplateId)
      .single();

    if (existingSignatures) {
      return response.error('您已签署过该协议');
    }

    // 计算合约有效期（contract_start/contract_end 为 DATE 类型）
    const formatDate = (d) => d.toISOString().slice(0, 10);
    const signDate = new Date();
    const contractStart = formatDate(signDate);
    const contractEndDate = new Date(signDate);
    contractEndDate.setFullYear(contractEndDate.getFullYear() + (template.validity_years || 1));
    const contractEnd = formatDate(contractEndDate);

    // 创建签署记录（使用数据库实际列名）
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id: user.id,
        _openid: OPENID || '',
        contract_template_id: finalTemplateId,       // 实际列名（非 template_id）
        ambassador_level: template.ambassador_level, // 实际列名（非 template_level）
        contract_name: template.contract_name,       // NOT NULL，需从模板获取
        contract_version: template.version,          // 实际列名（非 template_version）
        contract_content: template.content,
        contract_start: contractStart,               // NOT NULL，DATE 类型
        contract_end: contractEnd,                   // NOT NULL，DATE 类型
        sign_time: signDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''), // DATETIME 格式
        status: 1,
        sign_ip: event.ip_address || '',             // 实际列名（非 ip_address）
        sign_device: event.device_info || null       // 实际列名（非 device_info）
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[signContract] 创建签署记录失败:`, insertError);
      throw insertError;
    }

    return response.success({
      signature_id: newSignature.id,
      ambassador_level: template.ambassador_level,   // 实际字段（非 template.level）
      signed_at: newSignature.sign_time,             // 返回实际列名对应值
      message: '协议签署成功'
    }, '签署成功');

  } catch (error) {
    console.error(`[signContract] 失败:`, error);
    return response.error('签署协议失败', error);
  }
};
