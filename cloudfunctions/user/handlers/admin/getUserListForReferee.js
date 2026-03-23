/**
 * 管理端接口：学员列表（含推荐人姓名），用于推荐关系管理页
 * Action: admin:getUserListForReferee
 *
 * 支持搜索（姓名/手机号/ID）和大使等级筛选，返回推荐人姓名。
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { keyword, ambassadorLevel, page = 1, pageSize = 20 } = event;

  try {
    console.log('[admin:getUserListForReferee] 查询学员列表:', { keyword, ambassadorLevel, page, pageSize });

    let queryBuilder = db
      .from('users')
      .select('id, real_name, phone, ambassador_level, referee_id, created_at', { count: 'exact' })
      .order('id', { ascending: false });

    // 关键词搜索
    if (keyword && keyword.trim()) {
      const trimmed = keyword.trim();
      if (/^\d+$/.test(trimmed)) {
        if (trimmed.length === 11) {
          // 11 位纯数字优先按手机号，再按 id
          queryBuilder = queryBuilder.or(`phone.eq.${trimmed},id.eq.${trimmed}`);
        } else {
          queryBuilder = queryBuilder.eq('id', parseInt(trimmed, 10));
        }
      } else {
        queryBuilder = queryBuilder.like('real_name', `%${trimmed}%`);
      }
    }

    // 大使等级筛选
    if (ambassadorLevel !== undefined && ambassadorLevel !== null && ambassadorLevel !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', ambassadorLevel);
    }

    const result = await executePaginatedQuery(queryBuilder, page, pageSize);

    const levelNameMap = { 0: '普通用户', 1: '准青鸾大使', 2: '青鸾大使', 3: '鸿鹄大使' };

    // 批量查推荐人姓名（避免 N+1）
    const refereeIds = [...new Set(
      (result.list || []).map(u => u.referee_id).filter(id => id != null)
    )];
    let refereeNameMap = {};
    if (refereeIds.length > 0) {
      const { data: refereeUsers } = await db
        .from('users')
        .select('id, real_name')
        .in('id', refereeIds);
      (refereeUsers || []).forEach(u => { refereeNameMap[u.id] = u.real_name || ''; });
    }

    const list = (result.list || []).map(u => ({
      id: u.id,
      real_name: u.real_name || '',
      phone: u.phone || '',
      ambassador_level: u.ambassador_level || 0,
      ambassador_level_name: levelNameMap[u.ambassador_level] || '普通用户',
      referee_id: u.referee_id || null,
      referee_name: u.referee_id ? (refereeNameMap[u.referee_id] || '') : '',
      created_at: u.created_at
    }));

    console.log('[admin:getUserListForReferee] 查询成功，共', result.total, '条');

    return response.success({ ...result, list });
  } catch (error) {
    console.error('[admin:getUserListForReferee] 查询失败:', error);
    return response.error('获取学员列表失败', error);
  }
};
