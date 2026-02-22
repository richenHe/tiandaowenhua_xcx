/**
 * 管理端接口：获取合约列表
 * Action: getContractList
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { level, status, keyword, page = 1, page_size = 20, pageSize } = event;

  try {
    console.log(`[getContractList] 查询合约列表:`, { level, status, keyword, page });

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询
    let queryBuilder = db
      .from('contract_signatures')
      .select('*', { count: 'exact' })
      .order('sign_time', { ascending: false });

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

    // 查询用户信息并格式化列表数据
    const list = await Promise.all((result.list || []).map(async (item) => {
      // 查询用户信息
      const { data: user } = await db
        .from('users')
        .select('real_name, phone')
        .eq('id', item.user_id)
        .single();

      return {
        id: item.id,
        user_id: item.user_id,
        real_name: item.user_name || user?.real_name || '',
        phone: user?.phone || '',
        contract_level: item.ambassador_level,
        contract_name: item.contract_name,
        contract_version: item.contract_version,
        status: item.status,
        sign_time: item.sign_time,
        contract_start: item.contract_start,
        contract_end: item.contract_end,
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
