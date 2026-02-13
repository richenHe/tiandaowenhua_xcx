/**
 * 管理端接口：获取签署列表
 * Action: getSignatureList
 */
const { query } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { template_id, level, status, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getSignatureList] 查询签署列表:`, { template_id, level, status, page });

    const { limit, offset } = getPagination(page, page_size);
    const { db } = require('../../common/db');

    // 构建查询
    let queryBuilder = db
      .from('contract_signatures')
      .select(`
        *,
        user:users!fk_contract_signatures_user(id, real_name, phone, avatar),
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version)
      `, { count: 'exact' })
      .order('sign_time', { ascending: false })
      .range(offset, offset + limit - 1);

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

    const { data: signatures, error, count } = await queryBuilder;

    if (error) throw error;

    // 格式化返回数据
    const list = (signatures || []).map(sig => ({
      id: sig.id,
      user_id: sig.user_id,
      user_name: sig.user?.real_name,
      phone: sig.user?.phone,
      avatar: sig.user?.avatar,
      template_id: sig.contract_template_id,
      contract_name: sig.template?.contract_name || sig.contract_name,
      ambassador_level: sig.ambassador_level,
      contract_version: sig.contract_version,
      sign_time: sig.sign_time,
      contract_start: sig.contract_start,
      contract_end: sig.contract_end,
      status: sig.status,
      status_text: sig.status === 1 ? '有效' : sig.status === 2 ? '已过期' : sig.status === 3 ? '已续签' : '已作废',
      sign_ip: sig.sign_ip,
      sign_device: sig.sign_device
    }));

    return response.success({
      total: count || 0,
      page,
      page_size,
      list
    });

  } catch (error) {
    console.error(`[getSignatureList] 失败:`, error);
    return response.error('查询签署列表失败', error);
  }
};
