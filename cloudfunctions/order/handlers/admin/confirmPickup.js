/**
 * 管理端接口：确认领取
 * Action: confirmPickup
 *
 * 管理员现场核对用户兑换单号与商品后，将 status=1(已兑换/待领取) 改为 status=2(已领取)
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { exchange_no, remark } = event;

  try {
    console.log(`[confirmPickup] 确认领取:`, { admin_id: admin.id, exchange_no });

    // 1. 参数验证
    if (!exchange_no) {
      return response.paramError('兑换单号不能为空');
    }

    // 2. 查询兑换记录
    const record = await findOne('mall_exchange_records', { exchange_no });

    if (!record) {
      return response.notFound('兑换记录不存在');
    }

    // 3. 状态验证
    if (record.status === 2) {
      return response.error('该订单已确认领取，请勿重复操作');
    }
    if (record.status === 3) {
      return response.error('该订单已取消，无法操作');
    }
    if (record.status !== 1) {
      return response.error('当前状态不支持该操作');
    }

    // 4. 查询关联用户（仅用于返回展示，不影响逻辑）
    const user = await findOne('users', { id: record.user_id });

    // 5. 更新兑换状态为已领取（字段以实际表结构为准：pickup_time / remark）
    const pickupTime = utils.formatDateTime(new Date());
    await update('mall_exchange_records', {
      status: 2,
      pickup_admin_id: admin.id,
      pickup_time: pickupTime,
      remark: remark || ''
    }, { exchange_no });

    console.log(`[confirmPickup] 确认领取成功:`, exchange_no);

    return response.success({
      exchange_no,
      goods_name: record.goods_name,
      user_name: user?.real_name || '',
      status: 2,
      status_name: '已领取',
      pickup_time: pickupTime
    }, '确认领取成功');

  } catch (error) {
    console.error(`[confirmPickup] 失败:`, error);
    return response.error(error.message || '确认领取失败', error);
  }
};
