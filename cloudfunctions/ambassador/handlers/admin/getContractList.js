/**
 * 管理端接口：获取合约列表
 * Action: getContractList
 * 返回字段与前端 contract.html 列定义对齐
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level, status, keyword, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getContractList] 查询合约列表:`, { level, status, keyword, page });

    const finalPageSize = pageSize || page_size || 20;

    let queryBuilder = db
      .from('contract_signatures')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false });

    if (level != null && level !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', level);
    }

    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 关键词搜索（按 user_name 冗余字段或 user_phone 过滤）
    if (keyword) {
      queryBuilder = queryBuilder.or(`user_name.like.%${keyword}%,user_phone.like.%${keyword}%`);
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const list = await Promise.all((result.list || []).map(async (item) => {
      const { data: user } = await db
        .from('users')
        .select('real_name, phone')
        .eq('id', item.user_id)
        .single();

      // 解析线下合同照片 fileID → CDN URL
      let contractImages = [];
      let rawContractImageIds = [];
      try {
        const raw = item.contract_images;
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          rawContractImageIds = Array.isArray(parsed) ? parsed : [];
          contractImages = rawContractImageIds.map(id => cloudFileIDToURL(id));
        }
      } catch (e) { /* 解析失败忽略 */ }

      // 电子合同文件 URL
      const contractFileUrl = item.contract_file_id ? cloudFileIDToURL(item.contract_file_id) : null;

      return {
        id: item.id,
        user_id: item.user_id,
        ambassador_name: item.user_name || user?.real_name || '',
        phone: user?.phone || '',
        ambassador_level: item.ambassador_level,
        contract_no: item.contract_name + ' v' + (item.contract_version || ''),
        contract_name: item.contract_name,
        contract_version: item.contract_version,
        signed_at: item.sign_time,
        expires_at: item.contract_end,
        contract_start: item.contract_start,
        sign_type: item.sign_type || 1,
        status: item.status,
        contract_file_id: item.contract_file_id || null,
        contract_url: contractFileUrl,
        contract_images: contractImages,
        _rawContractImageIds: rawContractImageIds,
        created_at: item.created_at
      };
    }));

    console.log('[getContractList] 查询成功');
    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error(`[getContractList] 失败:`, error);
    return response.error('查询合约列表失败', error);
  }
};
