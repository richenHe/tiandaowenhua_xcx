/**
 * 客户端接口：获取协议详情
 * Action: getContractDetail
 * 返回协议签署记录，含电子合同文件URL（取模板文件，签署时已快照）
 */
const { findOne } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

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

    // 查询签署记录（含关联模板的电子合同文件字段）
    const { data, error } = await db
      .from('contract_signatures')
      .select(`
        *,
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version, effective_time, contract_file_id)
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

    // 优先取签署快照文件，无则取模板当前文件
    const fileId = signature.contract_file_id || signature.template?.contract_file_id || null;
    const contractFileUrl = fileId ? cloudFileIDToURL(fileId) : null;

    const contractName = signature.template?.contract_name || signature.contract_name;

    return response.success({
      signature: {
        id: signature.id,
        template_id: signature.contract_template_id,
        title: contractName,
        contract_name: contractName,
        ambassador_level: signature.ambassador_level,
        contract_version: signature.contract_version,
        contract_file_url: contractFileUrl,
        sign_time: signature.sign_time,
        contract_start: signature.contract_start,
        contract_end: signature.contract_end,
        effective_date: signature.contract_start,
        expiry_date: signature.contract_end,
        status: signature.status,
        status_text: signature.status === 1 ? '有效' : signature.status === 2 ? '已过期' : signature.status === 3 ? '已续签' : '已作废',
        sign_ip: signature.sign_ip,
        sign_device: signature.sign_device,
        effective_time: signature.template?.effective_time
      }
    });

  } catch (error) {
    console.error(`[getContractDetail] 失败:`, error);
    return response.error('查询协议详情失败', error);
  }
};
