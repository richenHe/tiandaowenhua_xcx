/**
 * 管理端接口：按等级获取协议模板
 * Action: getContractTemplateByLevel
 * 用于后台等级配置详情弹窗加载该等级对应的协议内容（含电子合同文件URL）
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { level } = event;
  const { admin } = context;

  try {
    console.log(`[getContractTemplateByLevel] 管理员 ${admin?.id} 查询等级 ${level} 协议模板`);

    if (level == null || level === '') {
      return response.paramError('缺少必要参数: level');
    }

    // 按 ambassador_level 查询最新启用的协议模板（含电子合同文件字段）
    const { data: templates, error } = await db
      .from('contract_templates')
      .select('id, contract_name, contract_type, ambassador_level, version, contract_file_id, validity_years, status, created_at')
      .eq('ambassador_level', Number(level))
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let template = templates && templates[0] ? templates[0] : null;

    // 将 cloud:// 文件ID 转换为可访问的 HTTPS URL
    if (template && template.contract_file_id) {
      template.contract_file_url = cloudFileIDToURL(template.contract_file_id);
    }

    return response.success({ template }, '获取成功');

  } catch (error) {
    console.error('[getContractTemplateByLevel] 失败:', error);
    return response.error('获取协议模板失败', error);
  }
};
