/**
 * 客户端接口：获取协议详情
 * Action: getContractDetail
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { signature_id } = event;

  try {
    console.log(`[getContractDetail] 查询协议详情:`, { user_id: user.id, signature_id });

    // 参数验证
    if (!signature_id) {
      return response.paramError('缺少必要参数: signature_id');
    }

    const { db } = require('../../common/db');

    // 查询签署记录
    const { data, error } = await db
      .from('contract_signatures')
      .select(`
        *,
        template:contract_templates(title, level, version, effective_date, expiry_date)
      `)
      .eq('id', signature_id)
      .eq('user_id', user.id)
      .single();

    if (error && !error.message.includes('0 rows')) {
      throw error;
    }

    const signature = data;

    if (!signature) {
      return response.error('协议记录不存在');
    }

    return response.success({
      signature: {
        id: signature.id,
        template_id: signature.template_id,
        title: signature.template?.title || '未知协议',
        level: signature.template_level,
        version: signature.template_version,
        content: signature.contract_content,
        signed_at: signature.signed_at,
        status: signature.status,
        status_text: signature.status === 1 ? '已签署' : signature.status === 2 ? '已过期' : '已撤销',
        ip_address: signature.ip_address,
        device_info: signature.device_info,
        effective_date: signature.template?.effective_date,
        expiry_date: signature.template?.expiry_date
      }
    });

  } catch (error) {
    console.error(`[getContractDetail] 失败:`, error);
    return response.error('查询协议详情失败', error);
  }
};
