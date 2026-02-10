/**
 * 客户端接口：赠送名额
 * Action: giftQuota
 */
const { findOne, insert, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { receiver_phone, quota_count, note } = event;

  try {
    console.log(`[giftQuota] 赠送名额:`, { user_id: user.id, receiver_phone, quota_count });

    // 参数验证
    if (!receiver_phone || !quota_count) {
      return response.paramError('缺少必要参数: receiver_phone, quota_count');
    }

    if (quota_count <= 0) {
      return response.paramError('赠送数量必须大于0');
    }

    // 验证是否为大使
    if (user.ambassador_level === 0) {
      return response.error('仅大使可以赠送名额');
    }

    // 查询接收人
    const receiver = await findOne('users', { phone: receiver_phone });
    if (!receiver) {
      return response.error('接收人不存在');
    }

    if (receiver.id === user.id) {
      return response.error('不能赠送给自己');
    }

    const { db } = require('../../common/db');

    // 查询可用名额
    const { data: quotas, error: quotaError } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', user.id);

    if (quotaError) throw quotaError;

    let availableQuotas = 0;
    (quotas || []).forEach(quota => {
      availableQuotas += (quota.total_count - quota.used_count);
    });

    if (availableQuotas < quota_count) {
      return response.error(`可用名额不足，当前可用: ${availableQuotas}`);
    }

    // 扣减名额（从最早的记录开始扣）
    let remainingToDeduct = quota_count;
    for (const quota of quotas || []) {
      if (remainingToDeduct <= 0) break;

      const available = quota.total_count - quota.used_count;
      if (available > 0) {
        const deductCount = Math.min(available, remainingToDeduct);

        await update('ambassador_quotas',
          { used_count: quota.used_count + deductCount },
          { id: quota.id }
        );

        remainingToDeduct -= deductCount;
      }
    }

    // 创建使用记录
    const [usageRecord] = await insert('quota_usage_records', {
      giver_id: user.id,
      receiver_id: receiver.id,
      quota_count,
      note: note || '',
      created_at: new Date().toISOString()
    });

    // 给接收人增加名额
    const receiverQuota = await findOne('ambassador_quotas', {
      user_id: receiver.id,
      source_type: 'gift'
    });

    if (receiverQuota) {
      await update('ambassador_quotas',
        { total_count: receiverQuota.total_count + quota_count },
        { id: receiverQuota.id }
      );
    } else {
      await insert('ambassador_quotas', {
        user_id: receiver.id,
        source_type: 'gift',
        source_id: usageRecord.id,
        total_count: quota_count,
        used_count: 0,
        created_at: new Date().toISOString()
      });
    }

    return response.success({
      record_id: usageRecord.id,
      receiver_name: receiver.real_name,
      quota_count,
      remaining_quotas: availableQuotas - quota_count
    }, '名额赠送成功');

  } catch (error) {
    console.error(`[giftQuota] 失败:`, error);
    return response.error('赠送名额失败', error);
  }
};
