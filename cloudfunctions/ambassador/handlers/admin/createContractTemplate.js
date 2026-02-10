/**
 * 管理端接口：创建协议模板
 * Action: createContractTemplate
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { title, content, level, version, effective_date, expiry_date } = event;

  try {
    console.log(`[createContractTemplate] 创建协议模板:`, { title, level, version });

    // 参数验证
    if (!title || !content || !level || !version) {
      return response.paramError('缺少必要参数: title, content, level, version');
    }

    // 创建协议模板
    const [template] = await insert('contract_templates', {
      title,
      content,
      level,
      version,
      effective_date: effective_date || new Date().toISOString(),
      expiry_date: expiry_date || null,
      status: 1,  // 启用
      created_by: admin.id,
      created_at: new Date().toISOString()
    });

    return response.success({
      template_id: template.id,
      title: template.title,
      level: template.level,
      version: template.version
    }, '协议模板创建成功');

  } catch (error) {
    console.error(`[createContractTemplate] 失败:`, error);
    return response.error('创建协议模板失败', error);
  }
};
