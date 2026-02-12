/**
 * 客户端接口：获取推荐人信息
 * Action: getRefereeInfo
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { referralCode } = event;

  try {
    console.log('[getRefereeInfo] 查询推荐人:', { referralCode });

    // 验证参数
    if (!referralCode) {
      return response.paramError('推荐码不能为空');
    }

    // 查询推荐人信息
    const referee = await findOne('users', { referee_code: referralCode });

    if (!referee) {
      return response.error('推荐人不存在', null, 404);
    }

    // 只返回必要的信息
    const refereeInfo = {
      id: referee.id,
      uid: referee.uid,
      nickname: referee.nickname || '未设置',
      avatar_url: referee.avatar_url || '',
      referee_code: referee.referee_code
    };

    console.log('[getRefereeInfo] 推荐人查询成功:', referee.id);
    return response.success(refereeInfo, '查询成功');

  } catch (error) {
    console.error('[getRefereeInfo] 查询失败:', error);
    return response.error('查询失败', error);
  }
};







