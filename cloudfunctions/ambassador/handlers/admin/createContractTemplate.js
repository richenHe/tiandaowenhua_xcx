/**
 * 管理端接口：创建协议模板
 * Action: createContractTemplate
 * 支持通过电子合同文件（PDF/Word）或 HTML 内容创建协议模板
 */
const { db } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  // 兼容 level-config 弹窗（ambassadorLevel/contract_name）和合约管理页（title/level/version）
  const {
    contract_name, title,
    ambassadorLevel, level,
    contractType,
    version,
    content,
    contractFileId,
    effective_date, expiry_date
  } = event;

  try {
    const resolvedName = contract_name || title;
    const resolvedLevel = ambassadorLevel != null ? Number(ambassadorLevel) : (level != null ? Number(level) : null);
    const resolvedVersion = version || 'v1.0';

    console.log(`[createContractTemplate] 创建协议模板:`, { resolvedName, resolvedLevel, resolvedVersion });

    if (!resolvedName || resolvedLevel == null) {
      return response.paramError('缺少必要参数: contract_name/title, ambassadorLevel/level');
    }

    // 判断协议类型：1=传播大使协议 / 2=青鸾大使协议 / 3=鸿鹄大使补充协议
    let contractTypeValue = 1;
    if (resolvedLevel === 2) contractTypeValue = 2;
    else if (resolvedLevel === 3) contractTypeValue = 3;

    // 插入协议模板
    const { data: inserted, error } = await db
      .from('contract_templates')
      .insert({
        contract_name: resolvedName,
        contract_type: contractTypeValue,
        ambassador_level: resolvedLevel,
        version: resolvedVersion,
        content: content || '',
        // 电子合同文件ID（cloud:// 格式）
        contract_file_id: contractFileId || null,
        validity_years: 1,
        effective_time: effective_date || formatDateTime(new Date()),
        status: 1,
        created_by: admin?.id || null
      })
      .select('id, contract_name, ambassador_level, version')
      .single();

    if (error) throw error;

    return response.success({
      template_id: inserted.id,
      contract_name: inserted.contract_name,
      level: inserted.ambassador_level,
      version: inserted.version
    }, '协议模板创建成功');

  } catch (error) {
    console.error(`[createContractTemplate] 失败:`, error);
    return response.error('创建协议模板失败', error);
  }
};
