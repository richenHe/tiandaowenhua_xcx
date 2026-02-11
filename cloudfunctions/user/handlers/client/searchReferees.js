/**
 * 客户端接口：搜索推荐人列表
 * Action: searchReferees
 */
const { query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { keyword } = event;

  try {
    console.log('[searchReferees] 搜索推荐人:', { keyword });

    // 验证参数
    if (!keyword || keyword.trim() === '') {
      return response.paramError('搜索关键词不能为空');
    }

    const searchKeyword = keyword.trim();

    // 构建查询条件：搜索姓名或手机号，且必须是大使（ambassador_level >= 1）
    const whereConditions = [
      'ambassador_level >= 1',
      '(real_name LIKE ? OR phone LIKE ?)'
    ];

    const params = [
      `%${searchKeyword}%`,
      `%${searchKeyword}%`
    ];

    // 查询推荐人列表
    const referees = await query(
      'users',
      whereConditions.join(' AND '),
      params,
      {
        fields: [
          'id',
          'uid',
          'real_name',
          'phone',
          'avatar',
          'ambassador_level',
          'referee_code'
        ],
        orderBy: 'ambassador_level DESC, created_at DESC',
        limit: 50 // 最多返回50条
      }
    );

    // 格式化返回数据
    const formattedReferees = referees.map(referee => {
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

    console.log('[searchReferees] 搜索成功，找到', formattedReferees.length, '个推荐人');
    return response.success({
      list: formattedReferees,
      total: formattedReferees.length
    }, '查询成功');

  } catch (error) {
    console.error('[searchReferees] 搜索失败:', error);
    return response.error('搜索失败', error);
  }
};
