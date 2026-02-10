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
        template:contract_templates(title, level, version)
      `)
      .eq('user_id', user.id)
      .order('signed_at', { ascending: false });

    if (error) throw error;

    // 格式化返回数据
    const contracts = (signatures || []).map(sig => ({
      id: sig.id,
      template_id: sig.template_id,
      title: sig.template?.title || '未知协议',
      level: sig.template_level,
      version: sig.template_version,
      signed_at: sig.signed_at,
      status: sig.status,
      status_text: sig.status === 1 ? '已签署' : sig.status === 2 ? '已过期' : '已撤销'
    }));

    return response.success({
      total: contracts.length,
      contracts
    });

  } catch (error) {
    console.error(`[getMyContracts] 失败:`, error);
    return response.error('查询协议列表失败', error);
  }
};
