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

    // 检查是否已签署
    const { data: existingSignatures } = await db
      .from('contract_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('template_id', finalTemplateId)
      .single();

    if (existingSignatures) {
      return response.error('您已签署过该协议');
    }

    // 创建签署记录
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id: user.id,
        template_id: finalTemplateId,
        template_level: template.level,
        template_version: template.version,
        contract_content: template.content,  // 保存协议快照
        signed_at: new Date().toISOString(),
        status: 1,  // 已签署
        ip_address: event.ip_address || '',
        device_info: event.device_info || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[signContract] 创建签署记录失败:`, insertError);
      throw insertError;
    }

    return response.success({
      signature_id: newSignature.id,
      template_level: template.level,
      signed_at: newSignature.signed_at,
      message: '协议签署成功'
    }, '签署成功');

  } catch (error) {
    console.error(`[signContract] 失败:`, error);
    return response.error('签署协议失败', error);
  }
};
