/**
 * 管理端接口：扣表现分
 * Action: deductPerformanceScore
 *
 * 参数：
 * - userId: 用户ID（必填）
 * - deductType: 扣分类型（必填，2=学员扣分, 3=活动扣分）
 * - score: 扣分分值（必填，正数，系统自动取负存储）
 * - reason: 原因/备注（可选）
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, deductType, score, reason = '' } = event;

  try {
    if (!userId || !deductType) {
      return response.paramError('缺少必要参数: userId, deductType');
    }

    if (![2, 3].includes(deductType)) {
      return response.paramError('扣分类型无效，2=学员扣分, 3=活动扣分');
    }

    const numScore = parseFloat(score);
    if (!numScore || numScore <= 0) {
      return response.paramError('扣分分值必须为正数');
    }

    // 校验用户存在
    const { data: userList } = await db.from('users').select('id, real_name').eq('id', userId).limit(1);
    if (!userList || userList.length === 0) {
      return response.error('用户不存在');
    }

    const typeName = deductType === 2 ? '学员扣分' : '活动扣分';
    console.log(`[admin:deductPerformanceScore] 管理员 ${admin.id} 给用户 ${userId} ${typeName}: 分值=-${numScore}`);

    const now = formatDateTime(new Date());

    const { data: record, error: insertError } = await db.from('performance_scores').insert({
      user_id: userId,
      type: deductType,
      position_type_id: null,
      position_name: null,
      score: -numScore,
      reason,
      operator_id: admin.id,
      operator_name: admin.username || admin.real_name || '',
      created_at: now
    }).select().single();

    if (insertError) throw insertError;

    return response.success({ id: record.id }, `${typeName}成功`);

  } catch (error) {
    console.error('[admin:deductPerformanceScore] 失败:', error);
    return response.error('扣分操作失败', error);
  }
};
