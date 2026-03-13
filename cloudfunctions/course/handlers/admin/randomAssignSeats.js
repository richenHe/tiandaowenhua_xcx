/**
 * 随机分配座位（管理端接口）
 *
 * 将指定用户随机分配到空座位，使用 Fisher-Yates 洗牌算法
 */
const { db, response, findOne, query, validateRequired, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, userIds } = event;

  const check = validateRequired({ classRecordId, userIds }, ['classRecordId', 'userIds']);
  if (!check.valid) return response.paramError(check.message);

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return response.paramError('userIds 必须为非空数组');
  }

  const crId = parseInt(classRecordId);

  try {
    const config = await findOne('seating_configs', { class_record_id: crId });
    const deskCount = config ? config.desk_count : 4;
    const seatsPerDesk = config ? config.seats_per_desk : 8;

    // 获取已有分配
    const existing = await query('seating_assignments', {
      where: { class_record_id: crId }
    });
    const occupiedSet = new Set(
      (existing || []).map(a => `${a.desk_number}-${a.seat_number}`)
    );
    const assignedUserSet = new Set(
      (existing || []).map(a => a.user_id)
    );

    // 收集所有空座位
    const emptySeats = [];
    for (let d = 1; d <= deskCount; d++) {
      for (let s = 1; s <= seatsPerDesk; s++) {
        if (!occupiedSet.has(`${d}-${s}`)) {
          emptySeats.push({ desk_number: d, seat_number: s });
        }
      }
    }

    // Fisher-Yates 洗牌
    for (let i = emptySeats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptySeats[i], emptySeats[j]] = [emptySeats[j], emptySeats[i]];
    }

    // 过滤掉已有座位的用户
    const toAssign = userIds
      .map(id => parseInt(id))
      .filter(id => !assignedUserSet.has(id));

    if (toAssign.length === 0) {
      return response.success({ message: '所有用户已有座位', assigned: 0 });
    }

    if (emptySeats.length === 0) {
      return response.paramError('没有空座位可用');
    }

    const assignCount = Math.min(toAssign.length, emptySeats.length);
    const now = formatDateTime(new Date());

    // 逐条插入
    const records = [];
    for (let i = 0; i < assignCount; i++) {
      records.push({
        class_record_id: crId,
        user_id: toAssign[i],
        desk_number: emptySeats[i].desk_number,
        seat_number: emptySeats[i].seat_number,
        created_at: now,
        updated_at: now
      });
    }

    // 批量插入
    const { error } = await db
      .from('seating_assignments')
      .insert(records);
    if (error) throw error;

    return response.success({
      message: `成功分配 ${assignCount} 个座位`,
      assigned: assignCount,
      skipped: toAssign.length - assignCount
    });

  } catch (error) {
    console.error('[Course/randomAssignSeats] 分配失败:', error);
    return response.error('随机分配座位失败', error);
  }
};
