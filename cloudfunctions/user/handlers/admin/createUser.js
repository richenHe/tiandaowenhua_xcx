/**
 * 管理端接口：创建学员
 * Action: createUser
 *
 * 参数：
 * - realName: 真实姓名（必填）
 * - phone: 手机号（必填）
 * - city: 城市（可选）
 * - ambassadorLevel: 大使等级（可选，默认0）
 * - refereeId: 推荐人ID（可选）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { realName, phone, city = '', ambassadorLevel = 0, refereeId = null } = event;

  try {
    if (!realName || !phone) {
      return response.paramError('缺少必要参数: realName, phone');
    }

    console.log(`[admin:createUser] 管理员 ${admin.id} 创建学员: ${realName}, ${phone}`);

    // 检查手机号是否已存在
    const { data: existing } = await db.from('users').select('id').eq('phone', phone).single();
    if (existing) {
      return response.error('该手机号已存在');
    }

    // 生成推荐码
    const refereeCode = 'TD' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: newUser, error } = await db.from('users').insert({
      real_name: realName,
      phone,
      city,
      ambassador_level: ambassadorLevel,
      referee_id: refereeId,
      referee_code: refereeCode,
      merit_points: 0,
      cash_points_available: 0,
      cash_points_frozen: 0,
      profile_completed: 0,
      _openid: ''
    }).select().single();

    if (error) throw error;

    return response.success({ id: newUser.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createUser] 失败:', error);
    return response.error('创建学员失败', error);
  }
};
