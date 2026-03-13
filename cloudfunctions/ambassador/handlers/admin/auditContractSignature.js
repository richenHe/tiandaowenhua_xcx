/**
 * 管理端接口：审核合同签署记录
 * Action: auditContractSignature
 *
 * 参数：
 * - signatureId: 签署记录ID（必填）
 * - action: 'approve'（通过）| 'reject'（驳回）（必填）
 * - remark: 审核备注/驳回原因（驳回时必填，通过时可选）
 *
 * 通过时触发的业务逻辑：
 * - 课程合同（course_id IS NOT NULL）：
 *     更新 user_courses.contract_signed=1 + expire_at + pending_days=0
 *     发放推荐人奖励（若订单未发放）
 * - 大使合同（course_id IS NULL，ambassador_level > 0）：
 *     升级 users.ambassador_level
 *     若需付费升级且已支付，发放冻结积分
 *
 * 驳回时：status=6（已驳回），记录 reject_reason，用户需重新签署
 */

const { db, update, insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

const STATUS_PENDING  = 5; // 待审核
const STATUS_VALID    = 1; // 有效
const STATUS_REJECTED = 6; // 已驳回

module.exports = async (event, context) => {
  const { admin } = context;
  // auditAction 避免与路由 action 字段冲突（扩展参数通过 ...data 展开可能覆盖 action）
  const { signatureId, auditAction, remark = '' } = event;

  try {
    if (!signatureId || !auditAction) {
      return response.paramError('缺少必要参数: signatureId, auditAction');
    }
    if (!['approve', 'reject'].includes(auditAction)) {
      return response.paramError('auditAction 只能是 approve 或 reject');
    }
    if (auditAction === 'reject' && !remark) {
      return response.paramError('驳回时必须填写驳回原因');
    }

    console.log(`[admin:auditContractSignature] 管理员 ${admin.id} ${auditAction} 签署记录 ${signatureId}`);

    // 查询签署记录
    const { data: sig, error: fetchErr } = await db
      .from('contract_signatures')
      .select('*')
      .eq('id', signatureId)
      .single();

    if (fetchErr || !sig) {
      return response.error('签署记录不存在');
    }
    if (sig.status !== STATUS_PENDING) {
      return response.error(`该记录当前状态不可审核（status=${sig.status}）`);
    }

    const now = new Date();
    const nowStr = formatDateTime(now);

    // ── 驳回 ────────────────────────────────────────────────────────────────
    if (auditAction === 'reject') {
      await db.from('contract_signatures').update({
        status:         STATUS_REJECTED,
        audit_admin_id: admin.id,
        audit_time:     nowStr,
        reject_reason:  remark,
        updated_at:     nowStr
      }).eq('id', signatureId);

      console.log(`[admin:auditContractSignature] 已驳回签署记录 ${signatureId}，原因: ${remark}`);
      return response.success({}, '已驳回，用户需重新签署');
    }

    // ── 通过 ────────────────────────────────────────────────────────────────
    await db.from('contract_signatures').update({
      status:         STATUS_VALID,
      audit_admin_id: admin.id,
      audit_time:     nowStr,
      updated_at:     nowStr
    }).eq('id', signatureId);

    const isCourseContract  = sig.course_id != null;
    const isAmbassadorContract = !isCourseContract && sig.ambassador_level > 0;

    // ── 课程合同通过：更新 user_courses，发推荐人奖励 ────────────────────────
    if (isCourseContract) {
      await approveCourseContract(sig, now, nowStr);
    }

    // ── 大使合同通过：升级等级，发放冻结积分 ────────────────────────────────
    if (isAmbassadorContract) {
      await approveAmbassadorContract(sig, now, nowStr);
    }

    return response.success({
      signature_id:    signatureId,
      is_course:       isCourseContract,
      is_ambassador:   isAmbassadorContract,
    }, '审核通过');

  } catch (error) {
    console.error('[admin:auditContractSignature] 失败:', error);
    return response.error('审核操作失败', error);
  }
};

// ── 课程合同通过后的业务逻辑 ─────────────────────────────────────────────────
async function approveCourseContract(sig, now, nowStr) {
  const userId   = sig.user_id;
  const courseId = sig.course_id;

  // 查找待签合同的 user_courses 记录
  const { data: userCourseRecord } = await db
    .from('user_courses')
    .select('id, pending_days')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('contract_signed', 0)
    .eq('status', 1)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!userCourseRecord) {
    console.warn(`[auditContractSignature] 未找到待签合同的 user_courses 记录 userId=${userId} courseId=${courseId}`);
    return;
  }

  // 以审核通过时间为起点计算有效期
  const { data: courseInfo } = await db
    .from('courses')
    .select('validity_days')
    .eq('id', courseId)
    .single();

  const totalDays = (userCourseRecord.pending_days > 0)
    ? userCourseRecord.pending_days
    : (courseInfo?.validity_days || 365);

  // approve 当天北京时间
  const approveDate = new Date(now.getTime() + 8 * 3600000);
  const contractEndDate = new Date(approveDate.getTime() + totalDays * 86400000);
  const contractEnd = [
    contractEndDate.getUTCFullYear(),
    String(contractEndDate.getUTCMonth() + 1).padStart(2, '0'),
    String(contractEndDate.getUTCDate()).padStart(2, '0')
  ].join('-');
  const expireAt = `${contractEnd} 23:59:59`;

  await db.from('user_courses').update({
    contract_signed: 1,
    expire_at:       expireAt,
    pending_days:    0,
    updated_at:      nowStr
  }).eq('id', userCourseRecord.id);

  // 回写 contract_signatures.contract_end（用审核通过日期覆盖签约日期）
  await db.from('contract_signatures').update({
    contract_end: contractEnd,
    updated_at:   nowStr
  }).eq('id', sig.id);

  console.log(`[auditContractSignature] user_courses 更新完成 expire_at=${expireAt} userId=${userId} courseId=${courseId}`);

  // 锁定推荐人：首次 contract_signed=1 时永久锁定
  await confirmRefereeIfNeeded(userId, nowStr);

  // 发放推荐人奖励（支付时已跳过即时发放，签约通过后再发）
  await grantRefereeRewardAfterSign(userId, courseId);
}

// ── 大使合同通过后的业务逻辑 ─────────────────────────────────────────────────
async function approveAmbassadorContract(sig, now, nowStr) {
  const userId      = sig.user_id;
  const targetLevel = sig.ambassador_level;

  const today = nowStr.slice(0, 10);

  // 升级等级
  await update('users',
    { ambassador_level: targetLevel, ambassador_start_date: today },
    { id: userId }
  );
  console.log(`[auditContractSignature] 用户 ${userId} 升级至等级 ${targetLevel}`);

  // 查看等级配置，判断是否需发冻结积分
  const { data: levelConfig } = await db
    .from('ambassador_level_configs')
    .select('upgrade_payment_amount, frozen_points')
    .eq('level', targetLevel)
    .single();

  const needsPayment = levelConfig && Number(levelConfig.upgrade_payment_amount) > 0;
  if (!needsPayment) return;

  // 检查是否已支付升级费
  const { count: paidCount } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('order_type', 4)
    .eq('related_id', targetLevel)
    .eq('pay_status', 1);

  if ((paidCount || 0) === 0) return;

  const frozenPoints = Number(levelConfig.frozen_points || 0);
  if (frozenPoints <= 0) return;

  const { data: currentUser } = await db
    .from('users')
    .select('cash_points_frozen')
    .eq('id', userId)
    .single();

  const currentFrozen = Number(currentUser?.cash_points_frozen || 0);

  await update('users',
    { cash_points_frozen: currentFrozen + frozenPoints },
    { id: userId }
  );

  const levelNameMap = { 2: '青鸾', 3: '鸿鹄', 4: '金凤' };
  const levelLabel = levelNameMap[targetLevel] || `等级${targetLevel}`;

  await insert('cash_points_records', {
    user_id:   userId,
    _openid:   '',
    type:      1,
    amount:    frozenPoints,
    remark:    `升级${levelLabel}大使升级费转为冻结积分`,
    created_at: nowStr
  });

  console.log(`[auditContractSignature] 用户 ${userId} 获得 ${frozenPoints} 冻结积分`);
}

// ── 签约通过后发放推荐人奖励（同 signCourseContract.js 逻辑） ─────────────────
async function grantRefereeRewardAfterSign(userId, courseId) {
  try {
    const { data: orders } = await db
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('related_id', courseId)
      .eq('order_type', 1)
      .eq('pay_status', 1)
      .eq('is_reward_granted', 0);

    if (!orders || orders.length === 0) return;

    const order = orders[0];
    if (!order.referee_id) {
      await markRewardGranted(order.order_no);
      return;
    }

    const { data: course } = await db.from('courses').select('*').eq('id', courseId).single();
    if (!course) return;

    const { data: referee } = await db.from('users').select('*').eq('id', order.referee_id).single();
    if (!referee) { await markRewardGranted(order.order_no); return; }

    const { data: config } = await db
      .from('ambassador_level_configs')
      .select('*')
      .eq('level', referee.ambassador_level)
      .single();

    if (!config || !config.can_earn_reward) {
      await markRewardGranted(order.order_no);
      return;
    }

    const { data: buyer } = await db.from('users').select('real_name').eq('id', order.user_id).single();
    const buyerName    = buyer?.real_name || '';
    const baseAmount   = parseFloat(order.final_amount);
    const frozenBal    = parseFloat(referee.cash_points_frozen) || 0;
    const unfreezeAmt  = parseFloat(config.unfreeze_per_referral) || 0;

    // 优先级1：初探班 + 有冻结积分 → 解冻
    if (course.type === 1 && unfreezeAmt > 0 && frozenBal >= unfreezeAmt) {
      const newFrozen    = frozenBal - unfreezeAmt;
      const newAvailable = (parseFloat(referee.cash_points_available) || 0) + unfreezeAmt;
      await db.from('users').update({ cash_points_frozen: newFrozen, cash_points_available: newAvailable }).eq('id', referee.id);
      await db.from('cash_points_records').insert({
        user_id: referee.id, _openid: referee._openid || '', type: 2, amount: unfreezeAmt,
        frozen_after: newFrozen, available_after: newAvailable, order_no: order.order_no,
        referee_user_id: order.user_id, referee_user_name: buyerName,
        remark: `推荐学员购买${course.name}，解冻积分`, created_at: formatDateTime(new Date())
      });
      await markRewardGranted(order.order_no);
      return;
    }

    // 优先级2：按比例发放
    const meritRate = course.type === 1 ? (parseFloat(config.merit_rate_basic) || 0) : (parseFloat(config.merit_rate_advanced) || 0);
    const cashRate  = course.type === 1 ? (parseFloat(config.cash_rate_basic) || 0)  : (parseFloat(config.cash_rate_advanced) || 0);

    if (meritRate > 0) {
      const meritPoints = Math.round(baseAmount * meritRate * 100) / 100;
      if (meritPoints > 0) {
        const { data: r } = await db.from('users').select('merit_points').eq('id', referee.id).single();
        const newBalance = (parseFloat(r?.merit_points) || 0) + meritPoints;
        await db.from('users').update({ merit_points: newBalance }).eq('id', referee.id);
        await db.from('merit_points_records').insert({
          user_id: referee.id, _openid: referee._openid || '', type: 1,
          source: course.type === 1 ? 1 : 2, amount: meritPoints, balance_after: newBalance,
          order_no: order.order_no, referee_user_id: order.user_id, referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(meritRate * 100).toFixed(0)}%功德分`,
          created_at: formatDateTime(new Date())
        });
      }
    } else if (cashRate > 0) {
      const cashPoints = Math.round(baseAmount * cashRate * 100) / 100;
      if (cashPoints > 0) {
        const { data: r } = await db.from('users').select('cash_points_available').eq('id', referee.id).single();
        const newAvailable = (parseFloat(r?.cash_points_available) || 0) + cashPoints;
        await db.from('users').update({ cash_points_available: newAvailable }).eq('id', referee.id);
        await db.from('cash_points_records').insert({
          user_id: referee.id, _openid: referee._openid || '', type: 3, amount: cashPoints,
          available_after: newAvailable, order_no: order.order_no,
          referee_user_id: order.user_id, referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(cashRate * 100).toFixed(0)}%可提现积分`,
          created_at: formatDateTime(new Date())
        });
      }
    }

    await markRewardGranted(order.order_no);

  } catch (err) {
    console.error('[auditContractSignature] 推荐人奖励发放失败（不影响审核结果）:', err);
  }
}

async function markRewardGranted(orderNo) {
  await db.from('orders').update({
    is_reward_granted: 1,
    reward_granted_at: formatDateTime(new Date())
  }).eq('order_no', orderNo);
}

/**
 * 首次 contract_signed=1 时锁定推荐人（设置 referee_confirmed_at）
 * 幂等：已锁定则跳过
 */
async function confirmRefereeIfNeeded(userId, nowStr) {
  try {
    const { data: user } = await db
      .from('users')
      .select('referee_confirmed_at')
      .eq('id', userId)
      .single();

    if (user && !user.referee_confirmed_at) {
      await db.from('users').update({
        referee_confirmed_at: nowStr
      }).eq('id', userId);
      console.log(`[auditContractSignature] 用户${userId} 推荐人已锁定 referee_confirmed_at=${nowStr}`);
    }
  } catch (err) {
    console.error('[auditContractSignature] 锁定推荐人失败（不影响审核结果）:', err);
  }
}
