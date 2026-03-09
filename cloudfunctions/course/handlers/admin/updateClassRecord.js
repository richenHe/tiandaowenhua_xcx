/**
 * 取消上课排期（管理端接口）
 *
 * 排期创建后不可编辑，仅支持取消操作（status → 0）
 * 取消时自动处理：批量取消该排期下所有待上课预约，复训预约触发复训资格保留
 *
 * @param {Object} event
 * @param {number} event.id     - 排期 ID（必填）
 * @param {number} event.status - 必须为 0（取消）
 */
const { db, findOne, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id, status } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const record = await findOne('class_records', { id });
    if (!record) {
      return response.notFound('上课排期不存在');
    }

    // 排期创建后不可编辑，仅允许取消（status=0）
    if (status !== 0) {
      return response.error('排期创建后不可编辑，如需修改请取消后重新创建');
    }

    if (record.status === 0) {
      return response.error('该排期已取消');
    }

    const now = formatDateTime(new Date());

    // 1. 查询该排期下所有待上课的预约
    const { data: pendingAppointments } = await db
      .from('appointments')
      .select('id, is_retrain, order_no')
      .eq('class_record_id', parseInt(id))
      .eq('status', 0);

    const cancelledCount = pendingAppointments ? pendingAppointments.length : 0;

    if (cancelledCount > 0) {
      // 2. 批量取消所有待上课预约
      await db
        .from('appointments')
        .update({ status: 3, cancel_time: now })
        .eq('class_record_id', parseInt(id))
        .eq('status', 0);

      // 3. 复训预约 → 保留复训资格（retrain_credit_status=1）
      const retrainOrderNos = pendingAppointments
        .filter(a => a.is_retrain === 1 && a.order_no)
        .map(a => a.order_no);

      for (const orderNo of retrainOrderNos) {
        await db
          .from('orders')
          .update({ retrain_credit_status: 1 })
          .eq('order_no', orderNo)
          .eq('order_type', 2)
          .eq('pay_status', 1);
      }

      if (retrainOrderNos.length > 0) {
        console.log(`[Course/updateClassRecord] 已保留 ${retrainOrderNos.length} 笔复训资格`);
      }
    }

    // 4. 更新排期状态为已取消，booked_quota 归零
    await update('class_records', { status: 0, booked_quota: 0 }, { id });

    console.log(`[Course/updateClassRecord] 排期 ${id} 已取消，连带取消 ${cancelledCount} 条预约`);

    return response.success({
      success: true,
      cancelled_appointments: cancelledCount,
      message: `排期已取消，${cancelledCount} 条待上课预约已自动取消`
    });

  } catch (error) {
    console.error('[Course/updateClassRecord] 取消失败:', error);
    return response.error('取消排期失败', error);
  }
};
