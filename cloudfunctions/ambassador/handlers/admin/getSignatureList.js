/**
 * 管理端接口：获取签署列表
 * Action: getSignatureList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { template_id, level, status, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getSignatureList] 查询签署列表:`, { template_id, level, status, page });

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询
    let queryBuilder = db
      .from('contract_signatures')
      .select(`
        *,
        user:users!fk_contract_signatures_user(id, real_name, phone, avatar),
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version)
      `, { count: 'exact' })
      .order('id', { ascending: true });

    // 模板筛选
    if (template_id) {
      queryBuilder = queryBuilder.eq('contract_template_id', template_id);
    }

    // 等级筛选
    if (level != null && level !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', level);
    }

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据，字段名与前端 contract.html 对齐
    const list = (result.list || []).map(sig => {
      const contractName = sig.template?.contract_name || sig.contract_name || '';
      const version = sig.contract_version || '';
      return {
        id: sig.id,
        user_id: sig.user_id,
        user_name: sig.user?.real_name || '',
        ambassador_name: sig.user?.real_name || '',     // 前端 contract.html 使用 ambassador_name
        phone: sig.user?.phone || '',
        avatar: sig.user?.avatar || '',
        template_id: sig.contract_template_id,
        contract_name: contractName,
        contract_no: `${contractName}${version ? ' v' + version : ''}`,  // 前端 contract_no 列
        ambassador_level: sig.ambassador_level,
        contract_level: sig.ambassador_level,           // 别名
        contract_version: version,
        sign_time: sig.sign_time,
        signed_at: sig.sign_time,                       // 前端使用 signed_at
        contract_start: sig.contract_start,
        contract_end: sig.contract_end,
        expires_at: sig.contract_end,                   // 前端使用 expires_at
        status: sig.status,
        status_text: sig.status === 1 ? '有效' : sig.status === 2 ? '已过期' : sig.status === 3 ? '已续签' : '已作废',
        sign_ip: sig.sign_ip,
        sign_device: sig.sign_device
      };
    });

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getSignatureList] 失败:`, error);
    return response.error('查询签署列表失败', error);
  }
};
