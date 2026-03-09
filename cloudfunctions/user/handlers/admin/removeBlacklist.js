/**
 * 管理端接口：解除拉黑
 * Action: removeBlacklist
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

    // 查找生效中的拉黑记录
    const { data: blacklistRecords } = await db.from('user_blacklist')
      .select('id')
      .eq('user_id', userId)
      .eq('blacklist_type', blacklistType)
      .eq('status', 1)
      .limit(1);

    if (!blacklistRecords || blacklistRecords.length === 0) {
      return response.error('未找到生效中的拉黑记录');
    }

    const recordId = blacklistRecords[0].id;
    const typeName = blacklistType === 1 ? '课程' : '活动';
    console.log(`[admin:removeBlacklist] 管理员 ${admin.id} 解除用户 ${userId} 的${typeName}拉黑`);

    const now = formatDateTime(new Date());

    const { error: updateError } = await db.from('user_blacklist')
      .update({
        status: 0,
        released_at: now,
        release_operator_id: admin.id,
        release_operator_name: admin.username || admin.real_name || ''
      })
      .eq('id', recordId);

    if (updateError) throw updateError;

    return response.success(null, `已解除该用户的${typeName}拉黑`);

  } catch (error) {
    console.error('[admin:removeBlacklist] 失败:', error);
    return response.error('解除拉黑失败', error);
  }
};
