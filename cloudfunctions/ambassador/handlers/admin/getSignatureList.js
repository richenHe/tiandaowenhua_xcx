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
        user:users!user_id(real_name, phone, avatar_url),
        template:contract_templates(title, level, version)
      `, { count: 'exact' })
      .order('signed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 模板筛选
    if (template_id) {
      queryBuilder = queryBuilder.eq('template_id', template_id);
    }

    // 等级筛选
    if (level !== undefined && level !== null) {
      queryBuilder = queryBuilder.eq('template_level', level);
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
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
      avatar_url: sig.user?.avatar_url,
      template_id: sig.template_id,
      template_title: sig.template?.title,
      template_level: sig.template_level,
      template_version: sig.template_version,
      signed_at: sig.signed_at,
      status: sig.status,
      status_text: sig.status === 1 ? '已签署' : sig.status === 2 ? '已过期' : '已撤销',
      ip_address: sig.ip_address,
      device_info: sig.device_info
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
