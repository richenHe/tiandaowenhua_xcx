/**
 * 客户端接口：获取我的协议列表
 * Action: getMyContracts
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;

  try {
    console.log(`[getMyContracts] 查询协议列表:`, user.id);

    const { db } = require('../../common/db');

    // 查询用户签署的所有协议
    const { data: signatures, error } = await db
      .from('contract_signatures')
      .select(`
        *,
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version)
      `)
      .eq('user_id', user.id)
      .order('sign_time', { ascending: false });

    if (error) throw error;

    // 格式化返回数据
    const contracts = (signatures || []).map(sig => ({
      id: sig.id,
      template_id: sig.contract_template_id,
      contract_name: sig.template?.contract_name || sig.contract_name || '未知协议',
      level: sig.ambassador_level,
      version: sig.contract_version,
      sign_time: sig.sign_time,
      contract_start: sig.contract_start,
      contract_end: sig.contract_end,
      status: sig.status,
      status_text: sig.status === 1 ? '有效' : sig.status === 2 ? '已过期' : sig.status === 3 ? '已续签' : '已作废'
    }));

    console.log(`[getMyContracts] 查询成功，共 ${contracts.length} 条协议`);

    return response.success({
      total: contracts.length,
      contracts
    });

  } catch (error) {
    console.error(`[getMyContracts] 失败:`, error);
    return response.error('查询协议列表失败', error);
  }
};
