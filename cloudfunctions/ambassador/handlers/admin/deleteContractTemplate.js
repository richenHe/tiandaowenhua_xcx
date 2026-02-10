/**
 * 管理端接口：删除协议模板
 * Action: deleteContractTemplate
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { template_id } = event;

  try {
    console.log(`[deleteContractTemplate] 删除协议模板:`, template_id);

    // 参数验证
    if (!template_id) {
      return response.paramError('缺少必要参数: template_id');
    }

    // 查询协议模板
    const template = await findOne('contract_templates', { id: template_id });
    if (!template) {
      return response.error('协议模板不存在');
    }

    // 检查是否有用户已签署该协议
    const { db } = require('../../common/db');
    const { count } = await db
      .from('contract_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', template_id);

    if (count > 0) {
      return response.error('该协议模板已有用户签署，不能删除，只能停用');
    }

    // 软删除（更新状态为0）
    await update('contract_templates',
      { status: 0 },
      { id: template_id }
    );

    return response.success({
      template_id,
      message: '协议模板已删除'
    }, '删除成功');

  } catch (error) {
    console.error(`[deleteContractTemplate] 失败:`, error);
    return response.error('删除协议模板失败', error);
  }
};
