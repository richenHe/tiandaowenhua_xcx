/**
 * 客户端接口：搜索推荐人列表
 * Action: searchReferees
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { keyword, page = 1, page_size = 50, pageSize } = event;

  try {
    console.log('[searchReferees] 搜索推荐人:', { keyword });

    // 验证参数
    if (!keyword || keyword.trim() === '') {
      return response.paramError('搜索关键词不能为空');
    }

    const searchKeyword = keyword.trim();
    // 兼容 pageSize 参数
    const finalPageSize = Math.min(page_size || pageSize || 50, 50); // 最多50条

    // 构建查询（搜索姓名或手机号，且必须是大使 ambassador_level >= 1）
    let queryBuilder = db
      .from('users')
      .select('id, uid, real_name, phone, avatar, ambassador_level, referee_code', { count: 'exact' })
      .gte('ambassador_level', 1)
      .or(`real_name.like.%${searchKeyword}%,phone.like.%${searchKeyword}%`)
      .order('ambassador_level', { ascending: false })
      .order('created_at', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据
    const formattedReferees = (result.list || []).map(referee => {
      // 手机号脱敏
      const maskedPhone = referee.phone
        ? referee.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : '';

      // 大使等级映射
      const levelMap = {
        0: '普通用户',
        1: '准青鸾大使',
        2: '青鸾大使',
        3: '鸿鹄大使',
        4: '金凤大使'
      };

      // 推荐限制说明
      const limitation = referee.ambassador_level === 1 ? '仅限初探班' : '';

      return {
        id: referee.id,
        uid: referee.uid,
        name: referee.real_name || '未设置',
        phone: maskedPhone,
        avatar: referee.avatar || '',
        level: levelMap[referee.ambassador_level] || '普通用户',
        ambassador_level: referee.ambassador_level,
        limitation: limitation,
        referee_code: referee.referee_code
      };
    });

    console.log('[searchReferees] 搜索成功，找到', result.total, '个推荐人');
    return response.success({
      ...result,
      list: formattedReferees
    }, '查询成功');

  } catch (error) {
    console.error('[searchReferees] 搜索失败:', error);
    return response.error('搜索失败', error);
  }
};
