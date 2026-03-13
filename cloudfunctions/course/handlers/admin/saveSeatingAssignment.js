/**
 * 保存座位分配变更（管理端接口）
 *
 * 支持三种操作：assign（入座）、remove（移回备选）、swap（交换）
 * 自动保存模式：每次拖拽/点击操作后前端立即调用
 */
const { db, response, findOne, query, validateRequired, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, operations } = event;

  const check = validateRequired({ classRecordId, operations }, ['classRecordId', 'operations']);
  if (!check.valid) return response.paramError(check.message);

  if (!Array.isArray(operations) || operations.length === 0) {
    return response.paramError('operations 必须为非空数组');
  }

  const crId = parseInt(classRecordId);

  try {
    const schedule = await findOne('class_records', { id: crId });
    if (!schedule) return response.notFound('排期不存在');

    for (const op of operations) {
      switch (op.type) {
        case 'assign': {
          const { userId, deskNumber, seatNumber } = op;
          if (!userId || !deskNumber || !seatNumber) {
            return response.paramError('assign 操作需要 userId, deskNumber, seatNumber');
          }

          // 先移除该用户原有分配（如有）
          const { error: delErr } = await db
            .from('seating_assignments')
            .delete()
            .eq('class_record_id', crId)
            .eq('user_id', parseInt(userId));
          if (delErr) throw delErr;

          // 移除目标座位上的人（如有）
          const { error: delSeatErr } = await db
            .from('seating_assignments')
            .delete()
            .eq('class_record_id', crId)
            .eq('desk_number', parseInt(deskNumber))
            .eq('seat_number', parseInt(seatNumber));
          if (delSeatErr) throw delSeatErr;

          // 插入新分配
          const { error: insErr } = await db
            .from('seating_assignments')
            .insert({
              class_record_id: crId,
              user_id: parseInt(userId),
              desk_number: parseInt(deskNumber),
              seat_number: parseInt(seatNumber),
              created_at: formatDateTime(new Date()),
              updated_at: formatDateTime(new Date())
            });
          if (insErr) throw insErr;
          break;
        }

        case 'remove': {
          const { userId } = op;
          if (!userId) return response.paramError('remove 操作需要 userId');

          const { error: delErr } = await db
            .from('seating_assignments')
            .delete()
            .eq('class_record_id', crId)
            .eq('user_id', parseInt(userId));
          if (delErr) throw delErr;
          break;
        }

        case 'swap': {
          const { userId1, userId2 } = op;
          if (!userId1 || !userId2) {
            return response.paramError('swap 操作需要 userId1, userId2');
          }

          // 查两人的当前分配
          const assignments = await query('seating_assignments', {
            where: { class_record_id: crId }
          });

          const a1 = (assignments || []).find(a => a.user_id === parseInt(userId1));
          const a2 = (assignments || []).find(a => a.user_id === parseInt(userId2));

          if (!a1 || !a2) {
            return response.paramError('交换的两个用户必须都已有座位');
          }

          // 先删除两条记录再重新插入（避免唯一键冲突）
          const { error: del1 } = await db
            .from('seating_assignments')
            .delete()
            .eq('id', a1.id);
          if (del1) throw del1;

          const { error: del2 } = await db
            .from('seating_assignments')
            .delete()
            .eq('id', a2.id);
          if (del2) throw del2;

          const now = formatDateTime(new Date());
          const { error: ins1 } = await db
            .from('seating_assignments')
            .insert({
              class_record_id: crId,
              user_id: parseInt(userId1),
              desk_number: a2.desk_number,
              seat_number: a2.seat_number,
              created_at: now,
              updated_at: now
            });
          if (ins1) throw ins1;

          const { error: ins2 } = await db
            .from('seating_assignments')
            .insert({
              class_record_id: crId,
              user_id: parseInt(userId2),
              desk_number: a1.desk_number,
              seat_number: a1.seat_number,
              created_at: now,
              updated_at: now
            });
          if (ins2) throw ins2;
          break;
        }

        default:
          return response.paramError(`未知操作类型: ${op.type}`);
      }
    }

    return response.success({ message: '座位分配已保存' });

  } catch (error) {
    console.error('[Course/saveSeatingAssignment] 保存失败:', error);
    return response.error('保存座位分配失败', error);
  }
};
