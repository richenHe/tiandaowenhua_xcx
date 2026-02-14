/**
 * 管理端接口：获取协议模板列表
 * Action: getContractTemplateList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level, status, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getContractTemplateList] 查询协议模板列表:`, { level, status, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('contract_templates')
      .select('*', { count: 'exact' })
      .order('level', { ascending: true })
      .order('version', { ascending: false });

    // 等级筛选
    if (level != null && level !== '') {
      queryBuilder = queryBuilder.eq('level', level);
    }

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 统计每个模板的签署数量
    const list = await Promise.all((result.list || []).map(async (template) => {
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
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getContractTemplateList] 失败:`, error);
    return response.error('查询协议模板列表失败', error);
  }
};
