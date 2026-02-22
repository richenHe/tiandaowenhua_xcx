/**
 * 管理端接口：获取协议版本历史
 * Action: getContractVersions
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level } = event;

  try {
    console.log(`[getContractVersions] 查询协议版本历史:`, level);

    // 参数验证
    if (!level) {
      return response.paramError('缺少必要参数: level');
    }

    const { db } = require('../../common/db');

    // 查询指定等级的所有版本
    const { data: versions, error } = await db
      .from('contract_templates')
      .select('*')
      .eq('ambassador_level', level)
      .order('version', { ascending: false });

    if (error) throw error;

    // 统计每个版本的签署数量
    const list = await Promise.all((versions || []).map(async (version) => {
      const { count: signatureCount } = await db
        .from('contract_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('contract_template_id', version.id);

      return {
        id: version.id,
        contract_name: version.contract_name,
        version: version.version,
        version_note: version.version_note,
        effective_time: version.effective_time,
        validity_years: version.validity_years,
        status: version.status,
        status_text: version.status === 1 ? '启用' : '停用',
        signature_count: signatureCount || 0,
        created_at: version.created_at
      };
    }));

    return response.success({
      level,
      total: list.length,
      versions: list
    });

  } catch (error) {
    console.error(`[getContractVersions] 失败:`, error);
    return response.error('查询协议版本历史失败', error);
  }
};
