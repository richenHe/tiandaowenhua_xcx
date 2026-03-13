/**
 * 保存排座配置（管理端接口）
 *
 * UPSERT 排座配置，桌数/座位数减少时清理超出范围的座位分配
 */
const { db, response, findOne, upsert, deleteRecord, query, validateRequired, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, deskCount, seatsPerDesk, displayColumns, tableClothColor } = event;

  const check = validateRequired({ classRecordId }, ['classRecordId']);
  if (!check.valid) return response.paramError(check.message);

  const crId = parseInt(classRecordId);
  const desks = parseInt(deskCount) || 4;
  const seats = parseInt(seatsPerDesk) || 8;
  const cols = parseInt(displayColumns) || 3;
  const color = tableClothColor || '#228B22';

  if (desks < 1 || desks > 50) return response.paramError('桌数范围：1-50');
  if (seats < 4 || seats > 12) return response.paramError('每桌座位数范围：4-12');
  if (cols < 3 || cols > 10) return response.paramError('显示列数范围：3-10');

  try {
    const schedule = await findOne('class_records', { id: crId });
    if (!schedule) return response.notFound('排期不存在');

    // 查询当前配置，判断是否需要清理超范围的分配
    const oldConfig = await findOne('seating_configs', { class_record_id: crId });

    if (oldConfig) {
      const oldDesks = oldConfig.desk_count;
      const oldSeats = oldConfig.seats_per_desk;

      if (desks < oldDesks || seats < oldSeats) {
        const assignments = await query('seating_assignments', {
          where: { class_record_id: crId }
        });

        for (const a of (assignments || [])) {
          if (a.desk_number > desks || a.seat_number > seats) {
            await deleteRecord('seating_assignments', { id: a.id });
          }
        }
      }
    }

    // UPSERT 配置
    const configData = {
      class_record_id: crId,
      desk_count: desks,
      seats_per_desk: seats,
      display_columns: cols,
      table_cloth_color: color,
      updated_at: formatDateTime(new Date())
    };

    if (oldConfig) {
      const { data, error } = await db
        .from('seating_configs')
        .update(configData)
        .eq('class_record_id', crId)
        .select();
      if (error) throw error;
    } else {
      configData.created_at = formatDateTime(new Date());
      const { data, error } = await db
        .from('seating_configs')
        .insert(configData)
        .select();
      if (error) throw error;
    }

    return response.success({ message: '配置保存成功' });

  } catch (error) {
    console.error('[Course/saveSeatingConfig] 保存失败:', error);
    return response.error('保存排座配置失败', error);
  }
};
