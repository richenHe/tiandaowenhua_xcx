/**
 * 全量同步座位分配（管理端接口）
 *
 * 删除该排期的所有旧分配，插入前端传来的完整分配列表
 */
const { db, response, validateRequired, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, assignments } = event;

  const check = validateRequired({ classRecordId }, ['classRecordId']);
  if (!check.valid) return response.paramError(check.message);

  if (!Array.isArray(assignments)) {
    return response.paramError('assignments 必须为数组');
  }

  const crId = parseInt(classRecordId);

  try {
    // 1. 删除该排期的所有旧分配
    const { error: delError } = await db
      .from('seating_assignments')
      .delete()
      .eq('class_record_id', crId);
    if (delError) throw delError;

    // 2. 如果有新分配则批量插入
    if (assignments.length > 0) {
      const now = formatDateTime(new Date());
      const records = assignments.map(a => ({
        class_record_id: crId,
        user_id: parseInt(a.user_id),
        desk_number: parseInt(a.desk_number),
        seat_number: parseInt(a.seat_number),
        created_at: now,
        updated_at: now
      }));

      const { error: insError } = await db
        .from('seating_assignments')
        .insert(records);
      if (insError) throw insError;
    }

    return response.success({
      message: `同步完成，共 ${assignments.length} 条分配`,
      count: assignments.length
    });

  } catch (error) {
    console.error('[Course/syncSeatingAssignments] 同步失败:', error);
    return response.error('同步座位分配失败', error);
  }
};
