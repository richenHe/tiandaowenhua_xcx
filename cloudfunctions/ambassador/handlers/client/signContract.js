/**
 * 客户端接口：签署协议
 * Action: signContract
 */
const { findOne, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { template_id, agreed } = event;

  try {
    console.log(`[signContract] 签署协议:`, { user_id: user.id, template_id });

    // 参数验证
    if (!template_id || agreed !== true) {
      return response.paramError('缺少必要参数或未同意协议');
    }

    // 查询协议模板
    const template = await findOne('contract_templates', { id: template_id });
    if (!template) {
      return response.error('协议模板不存在');
    }

    if (template.status !== 1) {
      return response.error('该协议已停用');
    }

    // 检查是否已签署
    const existingSignature = await findOne('contract_signatures', {
      user_id: user.id,
      template_id
    });

    if (existingSignature) {
      return response.error('您已签署过该协议');
    }

    // 创建签署记录
    const [signature] = await insert('contract_signatures', {
      user_id: user.id,
      template_id,
      template_level: template.level,
      template_version: template.version,
      contract_content: template.content,  // 保存协议快照
      signed_at: new Date().toISOString(),
      status: 1,  // 已签署
      ip_address: event.ip_address || '',
      device_info: event.device_info || '',
      created_at: new Date().toISOString()
    });

    return response.success({
      signature_id: signature.id,
      template_level: template.level,
      signed_at: signature.signed_at,
      message: '协议签署成功'
    }, '签署成功');

  } catch (error) {
    console.error(`[signContract] 失败:`, error);
    return response.error('签署协议失败', error);
  }
};
