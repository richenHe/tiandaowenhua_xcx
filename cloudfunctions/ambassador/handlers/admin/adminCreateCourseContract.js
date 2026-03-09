/**
 * 管理端接口：录入课程线下合约
 * Action: adminCreateCourseContract
 *
 * 管理员选择用户 + 已付课程 + 上传合同照片 → 创建合约记录并激活课程有效期
 *
 * 参数：
 * - userId: 用户ID（必填）
 * - courseId: 课程ID（必填）
 * - contractImages: 合同照片 fileID 数组（必填，≥1张）
 *
 * 业务逻辑：
 * 1. 创建 contract_signatures（status=1 直接生效，sign_type=3 管理员录入）
 * 2. 更新 user_courses（contract_signed=1, expire_at, pending_days=0）
 * 3. 发放推荐人奖励
 */

const { db, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');
const { grantRefereeRewardAfterSign } = require('../../common/grantRefereeReward');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, courseId, contractImages } = event;

  try {
    // ── 参数校验 ──
    if (!userId || !courseId) {
      return response.paramError('缺少必要参数: userId, courseId');
    }
    if (!Array.isArray(contractImages) || contractImages.length === 0) {
      return response.paramError('请上传至少一张合同照片');
    }

    console.log(`[admin:adminCreateCourseContract] 管理员 ${admin.id} 为用户 ${userId} 课程 ${courseId} 录入合约`);

    // ── 查询 user_courses 记录 ──
    const { data: userCourse, error: ucError } = await db
      .from('user_courses')
      .select('id, pending_days, course_name')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 1)
      .eq('contract_signed', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (ucError || !userCourse) {
      return response.error('未找到该用户的待签合同课程记录，请确认用户已购买该课程且尚未签署合同');
    }

    // ── 防重复：检查是否已有有效合约 ──
    const { data: existingContracts } = await db
      .from('contract_signatures')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 1)
      .limit(1);

    if (existingContracts && existingContracts.length > 0) {
      return response.error('该用户该课程已存在有效合约，不可重复录入');
    }

    // ── 查询合同模板 ──
    const { data: template, error: tplError } = await db
      .from('contract_templates')
      .select('*')
      .eq('course_id', courseId)
      .eq('contract_type', 4)
      .eq('status', 1)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (tplError || !template) {
      return response.error('该课程未配置启用的合同模板，请先在合同模板管理中创建');
    }

    // ── 查询用户信息 ──
    const { data: userInfo } = await db
      .from('users')
      .select('id, real_name, _openid, uid')
      .eq('id', userId)
      .single();

    if (!userInfo) {
      return response.error('用户不存在');
    }

    // ── 查询课程信息（兜底有效期天数） ──
    const { data: courseInfo } = await db
      .from('courses')
      .select('validity_days')
      .eq('id', courseId)
      .single();

    // ── 计算有效期 ──
    const now = new Date();
    const nowStr = formatDateTime(now);
    const approveDate = new Date(now.getTime() + 8 * 3600000);

    const totalDays = (userCourse.pending_days > 0)
      ? userCourse.pending_days
      : (courseInfo?.validity_days || 365);

    const contractStartDate = new Date(approveDate);
    const contractStart = [
      contractStartDate.getUTCFullYear(),
      String(contractStartDate.getUTCMonth() + 1).padStart(2, '0'),
      String(contractStartDate.getUTCDate()).padStart(2, '0')
    ].join('-');

    const contractEndDate = new Date(approveDate.getTime() + totalDays * 86400000);
    const contractEnd = [
      contractEndDate.getUTCFullYear(),
      String(contractEndDate.getUTCMonth() + 1).padStart(2, '0'),
      String(contractEndDate.getUTCDate()).padStart(2, '0')
    ].join('-');
    const expireAt = `${contractEnd} 23:59:59`;

    // ── 创建签署记录 ──
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id:              userId,
        user_uid:             userInfo.uid || null,
        user_name:            userInfo.real_name || '',
        _openid:              userInfo._openid || '',
        contract_template_id: template.id,
        ambassador_level:     0,
        course_id:            courseId,
        contract_name:        template.contract_name,
        contract_version:     template.version,
        contract_file_id:     template.contract_file_id || null,
        contract_images:      JSON.stringify(contractImages),
        contract_start:       contractStart,
        contract_end:         contractEnd,
        sign_time:            nowStr,
        sign_type:            3,
        admin_id:             admin.id,
        status:               1,
        created_at:           nowStr,
        updated_at:           nowStr
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // ── 更新 user_courses ──
    await db.from('user_courses').update({
      contract_signed: 1,
      expire_at:       expireAt,
      pending_days:    0,
      updated_at:      nowStr
    }).eq('id', userCourse.id);

    console.log(`[admin:adminCreateCourseContract] 合约录入成功 signatureId=${newSignature.id} expire_at=${expireAt}`);

    // ── 发放推荐人奖励 ──
    await grantRefereeRewardAfterSign(userId, courseId);

    return response.success({
      signature_id: newSignature.id,
      contract_start: contractStart,
      contract_end: contractEnd,
      expire_at: expireAt
    }, '合约录入成功');

  } catch (error) {
    console.error('[admin:adminCreateCourseContract] 失败:', error);
    return response.error('合约录入失败', error);
  }
};
