/**
 * 管理端接口：获取协议模板列表
 * Action: getContractTemplateList
 */
const { query } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level, status, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getContractTemplateList] 查询协议模板列表:`, { level, status, page });

    const { limit, offset } = getPagination(page, page_size);
    const { db } = require('../../common/db');

    // 构建查询
    let queryBuilder = db
      .from('contract_templates')
      .select('*', { count: 'exact' })
      .order('level', { ascending: true })
      .order('version', { ascending: false })
      .range(offset, offset + limit - 1);

    // 等级筛选
    if (level !== undefined && level !== null) {
      queryBuilder = queryBuilder.eq('level', level);
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data: templates, error, count } = await queryBuilder;

    if (error) throw error;

    // 统计每个模板的签署数量
    const list = await Promise.all((templates || []).map(async (template) => {
      const { count: signatureCount } = await db
        .from('contract_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', template.id);

      return {
        id: template.id,
        title: template.title,
        level: template.level,
        version: template.version,
        effective_date: template.effective_date,
        expiry_date: template.expiry_date,
        status: template.status,
        signature_count: signatureCount || 0,
        created_at: template.created_at
      };
    }));

    return response.success({
      total: count || 0,
      page,
      page_size,
      list
    });

  } catch (error) {
    console.error(`[getContractTemplateList] 失败:`, error);
    return response.error('查询协议模板列表失败', error);
  }
};
