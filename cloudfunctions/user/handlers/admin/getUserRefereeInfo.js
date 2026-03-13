/**
 * 管理端接口：按用户名字/ID/手机号查询伯乐（推荐人）和千里马（我推荐的人）列表
 * Action: admin:getUserRefereeInfo
 *
 * 支持三种查询方式：
 * - 纯数字且 ≤ 11 位：优先按 id 精确匹配，其次按 phone 精确匹配
 * - 纯数字且 > 11 位：按 id 精确匹配
 * - 非纯数字：按 real_name 模糊匹配（LIKE %keyword%）
 */
const { db, response, findOne, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { keyword } = event;

  try {
    if (!keyword || typeof keyword !== 'string') {
      return response.paramError('请输入用户名字、ID 或手机号');
    }

    const trimmed = keyword.trim();
    if (!trimmed) {
      return response.paramError('请输入用户名字、ID 或手机号');
    }

    console.log('[admin:getUserRefereeInfo] 查询推荐关系:', { keyword: trimmed });

    let user = null;

    // 1. 纯数字：优先 id，其次 phone（11 位）
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      // 先按 id 精确匹配
      user = await findOne('users', { id: num });
      if (!user && trimmed.length === 11) {
        // 11 位数字按手机号匹配
        user = await findOne('users', { phone: trimmed });
      }
    } else {
      // 2. 非纯数字：按 real_name 模糊匹配
      const { data: users } = await db
        .from('users')
        .select('*')
        .like('real_name', `%${trimmed}%`)
        .limit(10);
      if (users && users.length > 0) {
        user = users[0];
        if (users.length > 1) {
          console.log('[admin:getUserRefereeInfo] 姓名模糊匹配到多人，取第一条');
        }
      }
    }

    if (!user) {
      return response.success(null, '未找到相关用户');
    }

    // 3. 查询伯乐（推荐人）
    let referee = null;
    if (user.referee_id) {
      referee = await findOne('users', { id: user.referee_id });
      if (referee) {
        referee.avatar = cloudFileIDToURL(referee.avatar || '');
      }
    }

    // 4. 查询千里马（我推荐的人）— 只展示 contract_signed=1 的正式推荐关系
    const { data: allReferrals } = await db
      .from('users')
      .select('id, real_name, phone, avatar, ambassador_level, created_at')
      .eq('referee_id', user.id)
      .order('id', { ascending: false });

    let referralsList = [];
    if (allReferrals && allReferrals.length > 0) {
      const refIds = allReferrals.map(u => u.id);
      const { data: confirmedRecords } = await db
        .from('user_courses')
        .select('user_id')
        .in('user_id', refIds)
        .eq('contract_signed', 1);
      const confirmedSet = new Set((confirmedRecords || []).map(r => r.user_id));

      referralsList = allReferrals
        .filter(u => confirmedSet.has(u.id))
        .map(u => ({ ...u, avatar: cloudFileIDToURL(u.avatar || '') }));
    }

    const result = {
      user: {
        id: user.id,
        uid: user.uid,
        real_name: user.real_name,
        phone: user.phone,
        avatar: cloudFileIDToURL(user.avatar || ''),
        referee_code: user.referee_code,
        ambassador_level: user.ambassador_level
      },
      referee, // 伯乐（推荐人），无则为 null
      referrals: referralsList // 千里马（我推荐的人）列表
    };

    console.log('[admin:getUserRefereeInfo] 查询成功:', {
      userId: user.id,
      refereeCount: referralsList.length
    });

    return response.success(result);
  } catch (error) {
    console.error('[admin:getUserRefereeInfo] 查询失败:', error);
    return response.error('查询推荐关系失败', error);
  }
};
