/**
 * 删除上课排期（管理端接口）
 */
const { findOne, softDelete, query } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询排期是否存在
    const record = await findOne('class_records', { id });
    if (!record) {
      return response.notFound('上课排期不存在');
    }

    // 检查是否有预约记录（appointments 表没有 deleted_at 字段）
    const { db } = require('../../common/db');
    const { data: appointments, error: queryError } = await db
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('class_record_id', parseInt(id))
      .in('status', [0, 1, 2]);

    if (queryError) {
      throw queryError;
    }

    if (appointments && appointments.length > 0) {
      return response.error('该排期已有预约记录，无法删除');
    }

    // 删除排期（class_records 表没有 deleted_at 字段，使用状态标记）
    const { update } = require('../../common/db');
    await update('class_records', { status: 0 }, { id });

    return response.success({
      success: true,
      message: '上课排期删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteClassRecord] 删除失败:', error);
    return response.error('删除上课排期失败', error);
  }
};
