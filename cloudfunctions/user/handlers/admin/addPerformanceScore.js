/**
 * 管理端接口：加表现分
 * Action: addPerformanceScore
 *
 * 参数：
 * - userId: 用户ID（必填）
 * - positionTypeId: 岗位类型ID（必填）
 * - positionName: 岗位名称（必填）
 * - score: 加分分值（必填，正数）
 * - reason: 原因/备注（可选）
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, positionTypeId, positionName, score, reason = '' } = event;

  try {
    if (!userId || !positionTypeId || !positionName) {
      return response.paramError('缺少必要参数: userId, positionTypeId, positionName');
    }

    const numScore = parseFloat(score);
    if (!numScore || numScore <= 0) {
      return response.paramError('加分分值必须为正数');
    }

    // 校验用户存在
    const { data: userList } = await db.from('users').select('id, real_name').eq('id', userId).limit(1);
    if (!userList || userList.length === 0) {
      return response.error('用户不存在');
    }

    // 校验岗位类型存在
    const { data: positionList } = await db.from('ambassador_position_types').select('id, name').eq('id', positionTypeId).limit(1);
    if (!positionList || positionList.length === 0) {
      return response.error('岗位类型不存在');
    }

    console.log(`[admin:addPerformanceScore] 管理员 ${admin.id} 给用户 ${userId} 加分: 岗位=${positionName}, 分值=${numScore}`);

    const now = formatDateTime(new Date());

    const { data: record, error: insertError } = await db.from('performance_scores').insert({
      user_id: userId,
      type: 1,
      position_type_id: positionTypeId,
      position_name: positionName,
      score: numScore,
      reason,
      operator_id: admin.id,
      operator_name: admin.username || admin.real_name || '',
      created_at: now
    }).select().single();

    if (insertError) throw insertError;

    return response.success({ id: record.id }, '加分成功');

  } catch (error) {
    console.error('[admin:addPerformanceScore] 失败:', error);
    return response.error('加分操作失败', error);
  }
};
