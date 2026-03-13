/**
 * 获取排座数据（管理端接口）
 *
 * 返回指定排期的完整排座信息：配置、学员名单、岗位标签、座位分配
 */
const { db, response, findOne, query, validateRequired } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId } = event;

  const check = validateRequired({ classRecordId }, ['classRecordId']);
  if (!check.valid) return response.paramError(check.message);

  const crId = parseInt(classRecordId);

  try {
    // 查询排期基本信息
    const schedule = await findOne('class_records', { id: crId });
    if (!schedule) return response.notFound('排期不存在');

    // 并行查询配置、学员、岗位、分配
    const [config, students, assignments, activities] = await Promise.all([
      findOne('seating_configs', { class_record_id: crId }),

      (async () => {
        const { data, error } = await db
          .from('appointments')
          .select(`
            user_id, user_name, user_phone, is_retrain, status,
            user:users!fk_appointments_user(id, real_name, phone)
          `)
          .eq('class_record_id', crId)
          .in('status', [0, 1]);
        if (error) throw error;
        return (data || []).map(a => ({
          user_id: a.user_id,
          user_name: a.user?.real_name || a.user_name || '',
          user_phone: a.user?.phone || a.user_phone || '',
          is_retrain: a.is_retrain || 0,
          status: a.status
        }));
      })(),

      query('seating_assignments', {
        where: { class_record_id: crId },
        orderBy: { column: 'desk_number', ascending: true }
      }),

      // 用 query 替代 findOne，同一排期可能关联多个活动
      query('ambassador_activities', { where: { schedule_id: crId } })
    ]);

    // 查询岗位标签（合并所有关联活动的报名岗位）
    let positions = {};
    if (activities && activities.length > 0) {
      for (const activity of activities) {
        const regs = await query('ambassador_activity_registrations', {
          where: { activity_id: activity.id }
        });
        const validRegs = (regs || []).filter(r => r.status === 1 || r.status === 2);
        validRegs.forEach(r => {
          positions[r.user_id] = r.position_name;
        });
      }
    }

    // 默认配置
    const seatingConfig = config || {
      desk_count: 4,
      seats_per_desk: 8,
      display_columns: 3,
      table_cloth_color: '#228B22'
    };

    return response.success({
      scheduleInfo: {
        id: schedule.id,
        course_id: schedule.course_id,
        course_name: schedule.course_name || '',
        course_type: schedule.course_type,
        period: schedule.period || '',
        class_date: schedule.class_date,
        class_end_date: schedule.class_end_date,
        class_time: schedule.class_time || '',
        class_location: schedule.class_location || '',
        status: schedule.status
      },
      config: seatingConfig,
      students,
      positions,
      assignments: assignments || []
    });

  } catch (error) {
    console.error('[Course/getSeatingData] 查询失败:', error);
    return response.error('获取排座数据失败', error);
  }
};
