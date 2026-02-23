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

    const { db } = require('../../common/db');

    // 查询接收人（phone 非唯一键，取第一条）
    const { data: receiverList, error: receiverError } = await db
      .from('users')
      .select('*')
      .eq('phone', receiver_phone)
      .limit(1);

    if (receiverError) throw receiverError;
    const receiver = receiverList?.[0] || null;

    if (!receiver) {
      return response.error('接收人不存在');
    }

    if (receiver.id === user.id) {
      return response.error('不能赠送给自己');
    }

    // 查询可用名额（使用实际列名 total_quantity / used_quantity / remaining_quantity）
    const { data: quotas, error: quotaError } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 1);

    if (quotaError) throw quotaError;

    let availableQuotas = 0;
    (quotas || []).forEach(quota => {
      availableQuotas += quota.remaining_quantity;
    });

    if (availableQuotas < quota_count) {
      return response.error(`可用名额不足，当前可用: ${availableQuotas}`);
    }

    // 扣减名额（从最早的记录开始扣），并记录使用的 quota_id
    let remainingToDeduct = quota_count;
    let usedQuotaId = null;
    for (const quota of quotas || []) {
      if (remainingToDeduct <= 0) break;

      const available = quota.remaining_quantity;
      if (available > 0) {
        const deductCount = Math.min(available, remainingToDeduct);
        if (!usedQuotaId) usedQuotaId = quota.id;

        await update('ambassador_quotas',
          {
            used_quantity: quota.used_quantity + deductCount,
            remaining_quantity: quota.remaining_quantity - deductCount
          },
          { id: quota.id }
        );

        remainingToDeduct -= deductCount;
      }
    }

    // 创建使用记录（使用实际列名）
    const [usageRecord] = await insert('quota_usage_records', {
      quota_id: usedQuotaId,
      ambassador_id: user.id,
      _openid: OPENID || '',
      recipient_id: receiver.id,
      recipient_name: receiver.real_name || '',
      recipient_phone: receiver_phone,
      usage_type: 3,
      remark: note || ''
    });

    // 给接收人增加名额（查找已有的礼赠名额记录）
    const { data: receiverQuotas } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', receiver.id)
      .eq('source_type', 3)
      .limit(1);

    const receiverQuota = receiverQuotas?.[0] || null;

    if (receiverQuota) {
      await update('ambassador_quotas',
        {
          total_quantity: receiverQuota.total_quantity + quota_count,
          remaining_quantity: receiverQuota.remaining_quantity + quota_count
        },
        { id: receiverQuota.id }
      );
    } else {
      const expireDate = new Date();
      expireDate.setFullYear(expireDate.getFullYear() + 1);
      const expireDateStr = expireDate.toISOString().slice(0, 10);

      await insert('ambassador_quotas', {
        user_id: receiver.id,
        _openid: '',
        ambassador_level: user.ambassador_level,
        quota_type: 1,
        source_type: 3,
        total_quantity: quota_count,
        used_quantity: 0,
        remaining_quantity: quota_count,
        expire_date: expireDateStr,
        status: 1
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
