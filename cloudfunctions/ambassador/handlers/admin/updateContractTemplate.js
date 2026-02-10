/**
 * 管理端接口：更新协议模板
 * Action: updateContractTemplate
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { template_id, title, content, effective_date, expiry_date, status } = event;

  try {
    console.log(`[updateContractTemplate] 更新协议模板:`, template_id);

    // 参数验证
    if (!template_id) {
      return response.paramError('缺少必要参数: template_id');
    }

    // 查询协议模板
    const template = await findOne('contract_templates', { id: template_id });
    if (!template) {
      return response.error('协议模板不存在');
    }

    // 构建更新数据
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (effective_date !== undefined) updateData.effective_date = effective_date;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新协议模板
    await update('contract_templates', updateData, { id: template_id });

    return response.success({
      template_id,
      message: '协议模板更新成功'
    }, '更新成功');

  } catch (error) {
    console.error(`[updateContractTemplate] 失败:`, error);
    return response.error('更新协议模板失败', error);
  }
};
