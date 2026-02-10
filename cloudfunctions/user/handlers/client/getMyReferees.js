/**
 * 客户端接口：获取我推荐的用户列表
 * Action: client:getMyReferees
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, pageSize = 20 } = event;

  try {
    console.log('[getMyReferees] 获取推荐用户:', user.id);

    const { offset, limit } = utils.getPagination(page, pageSize);

    // 查询推荐的用户列表
    const { data: referees, error, count: total } = await db
      .from('users')
      .select('id, real_name, phone, avatar, ambassador_level, created_at', { count: 'exact' })
      .eq('referee_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    console.log('[getMyReferees] 查询成功，共', total, '条');
    return response.success({
      total,
      page,
      pageSize,
      list: referees || []
    });

  } catch (error) {
    console.error('[getMyReferees] 查询失败:', error);
    return response.error('获取推荐用户列表失败', error);
  }
};
