/**
 * 管理端接口：拉黑用户
 * Action: setBlacklist
 *
 * 参数：
 * - userId: 用户ID（必填）
 * - blacklistType: 拉黑类型（必填，1=课程拉黑, 2=活动拉黑）
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, blacklistType } = event;

  try {
    if (!userId || !blacklistType) {
      return response.paramError('缺少必要参数: userId, blacklistType');
    }

    if (![1, 2].includes(blacklistType)) {
      return response.paramError('拉黑类型无效，1=课程拉黑, 2=活动拉黑');
    }

    // 校验用户存在
    const { data: userList } = await db.from('users').select('id, real_name').eq('id', userId).limit(1);
    if (!userList || userList.length === 0) {
      return response.error('用户不存在');
    }

    // 检查是否已在拉黑中
    const { data: existingList } = await db.from('user_blacklist')
      .select('id, blacklist_end_time')
      .eq('user_id', userId)
      .eq('blacklist_type', blacklistType)
      .eq('status', 1)
      .limit(1);

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      if (new Date(existing.blacklist_end_time) > new Date()) {
        return response.error('该用户已在拉黑状态中，无需重复操作');
      }
    }

    // 读取阈值配置中的拉黑月数
    const configKey = blacklistType === 1 ? 'student_blacklist_months' : 'activity_blacklist_months';
    const { data: configList } = await db.from('blacklist_config')
      .select('config_value')
      .eq('config_key', configKey)
      .limit(1);

    const months = configList && configList.length > 0 ? parseInt(configList[0].config_value) : 3;

    const typeName = blacklistType === 1 ? '课程' : '活动';
    console.log(`[admin:setBlacklist] 管理员 ${admin.id} 拉黑用户 ${userId} ${typeName}，${months}个月`);

    const now = new Date();
    const endTime = new Date(now);
    endTime.setMonth(endTime.getMonth() + months);

    const { data: record, error: insertError } = await db.from('user_blacklist').insert({
      user_id: userId,
      blacklist_type: blacklistType,
      blacklist_months: months,
      blacklist_start_time: formatDateTime(now),
      blacklist_end_time: formatDateTime(endTime),
      status: 1,
      operator_id: admin.id,
      operator_name: admin.username || admin.real_name || '',
      created_at: formatDateTime(now)
    }).select().single();

    if (insertError) throw insertError;

    return response.success({ id: record.id, months }, `已拉黑该用户的${typeName}权限，时长${months}个月`);

  } catch (error) {
    console.error('[admin:setBlacklist] 失败:', error);
    return response.error('拉黑操作失败', error);
  }
};
