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

    const { data: existingList } = await db.from('users').select('id').eq('phone', phone).limit(1);
    if (existingList && existingList.length > 0) {
      return response.error('该手机号已存在');
    }

    // 生成唯一 UID（格式与小程序注册保持一致：大写字母+数字，19位）
    const uid = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 9).toUpperCase();
    // 生成推荐码
    const refereeCode = 'TD' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: newUser, error } = await db.from('users').insert({
      uid,
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
