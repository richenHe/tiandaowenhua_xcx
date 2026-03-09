/**
 * 管理端接口：手动新增用户课程
 * Action: adminAddUserCourse
 *
 * 用于老学员课程数据补录，直接写入 user_courses，不触发推荐人奖励，不关联订单
 *
 * 参数：
 * - userId: 用户ID（必填）
 * - courseId: 课程ID（必填）
 * - validityDays: 剩余有效天数（必填）
 * - needContract: 是否需要合同（bool，默认 false）
 * - contractImages: 合同照片 fileID 数组（可选，needContract=true 时可传）
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, courseId, validityDays, needContract = false, contractImages } = event;

  try {
    // ── 参数校验 ──
    if (!userId || !courseId) {
      return response.paramError('缺少必要参数: userId, courseId');
    }
    if (!validityDays || validityDays <= 0) {
      return response.paramError('剩余有效天数必须大于 0');
    }

    console.log(`[admin:adminAddUserCourse] 管理员 ${admin.id} 为用户 ${userId} 手动新增课程 ${courseId}`);

    // ── 重复检查：该用户是否已拥有此课程 ──
    const { data: existing } = await db.from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('status', [1, 3])
      .limit(1);

    if (existing && existing.length > 0) {
      return response.error('该用户已拥有此课程，不可重复新增');
    }

    // ── 查询用户信息 ──
    const { data: userInfo, error: userErr } = await db.from('users')
      .select('id, uid, _openid, real_name')
      .eq('id', userId)
      .single();

    if (userErr || !userInfo) {
      return response.error('用户不存在');
    }

    // ── 查询课程信息 ──
    const { data: courseInfo, error: courseErr } = await db.from('courses')
      .select('id, name, type, need_contract')
      .eq('id', courseId)
      .single();

    if (courseErr || !courseInfo) {
      return response.error('课程不存在');
    }

    // ── 计算有效期 ──
    const now = new Date();
    const nowStr = formatDateTime(now);
    const chinaTime = new Date(now.getTime() + 8 * 3600000);
    const expireDate = new Date(chinaTime.getTime() + validityDays * 86400000);
    const expireAt = [
      expireDate.getUTCFullYear(),
      String(expireDate.getUTCMonth() + 1).padStart(2, '0'),
      String(expireDate.getUTCDate()).padStart(2, '0')
    ].join('-') + ' 23:59:59';

    // ── 插入 user_courses ──
    const { data: newUC, error: insertErr } = await db.from('user_courses')
      .insert({
        user_id:         userId,
        user_uid:        userInfo.uid || null,
        _openid:         userInfo._openid || '',
        course_id:       courseId,
        course_type:     courseInfo.type,
        course_name:     courseInfo.name,
        order_no:        null,
        buy_price:       null,
        buy_time:        null,
        is_gift:         0,
        attend_count:    1,
        expire_at:       expireAt,
        contract_signed: 1,
        pending_days:    0,
        status:          1,
        created_at:      nowStr,
        updated_at:      nowStr
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log(`[admin:adminAddUserCourse] user_courses 创建成功 id=${newUC.id}`);

    // ── 可选：创建合同签署记录 ──
    let signatureId = null;
    if (needContract) {
      // 查找合同模板
      const { data: template } = await db.from('contract_templates')
        .select('*')
        .eq('course_id', courseId)
        .eq('contract_type', 4)
        .eq('status', 1)
        .is('deleted_at', null)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (template) {
        const contractStart = [
          chinaTime.getUTCFullYear(),
          String(chinaTime.getUTCMonth() + 1).padStart(2, '0'),
          String(chinaTime.getUTCDate()).padStart(2, '0')
        ].join('-');

        const contractEnd = [
          expireDate.getUTCFullYear(),
          String(expireDate.getUTCMonth() + 1).padStart(2, '0'),
          String(expireDate.getUTCDate()).padStart(2, '0')
        ].join('-');

        const insertData = {
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
          contract_start:       contractStart,
          contract_end:         contractEnd,
          sign_time:            nowStr,
          sign_type:            3,
          admin_id:             admin.id,
          status:               1,
          created_at:           nowStr,
          updated_at:           nowStr
        };

        // 合同照片（可选）
        if (Array.isArray(contractImages) && contractImages.length > 0) {
          insertData.contract_images = JSON.stringify(contractImages);
        }

        const { data: sig, error: sigErr } = await db.from('contract_signatures')
          .insert(insertData)
          .select()
          .single();

        if (sigErr) {
          console.error('[admin:adminAddUserCourse] 合同创建失败（不影响课程）:', sigErr);
        } else {
          signatureId = sig.id;
          console.log(`[admin:adminAddUserCourse] 合同签署记录创建成功 id=${sig.id}`);
        }
      } else {
        console.log('[admin:adminAddUserCourse] 课程无合同模板，跳过合同创建');
      }
    }

    return response.success({
      user_course_id: newUC.id,
      expire_at: expireAt,
      signature_id: signatureId
    }, '用户课程新增成功');

  } catch (error) {
    console.error('[admin:adminAddUserCourse] 失败:', error);
    return response.error('新增用户课程失败', error);
  }
};
