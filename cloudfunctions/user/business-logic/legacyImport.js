/**
 * 历史学员数据导入模块
 *
 * 在用户填写真实姓名后触发，自动从 legacy_students 表中匹配
 * 并导入历史课程、绑定推荐人、升级大使等级。
 *
 * 调用方：updateProfile.js（在姓名更新成功后异步调用）
 */

const { db, findOne, query, insert, update } = require('../common/db');
const { formatDateTime } = require('../common');

// ───────────────────────── 工具函数 ─────────────────────────

/**
 * 清理姓名：去除所有空白字符
 */
function cleanName(name) {
  if (!name) return '';
  return name.replace(/\s+/g, '');
}

/**
 * 生成唯一 6 位推荐码
 */
async function generateUniqueRefereeCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await findOne('users', { referee_code: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
}

/**
 * 计算课程到期时间和状态
 * @param {string} startDateStr - 课程开始日期 'YYYY-MM-DD'
 * @param {number} validityDays - 有效天数
 * @returns {{ expireAt: string|null, status: number }} - status: 1=正常 2=已过期
 */
function calcCourseExpiry(startDateStr, validityDays) {
  if (!startDateStr || !validityDays) {
    return { expireAt: null, status: 2 };
  }
  const start = new Date(startDateStr);
  const expire = new Date(start.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const status = expire < now ? 2 : 1;
  return {
    expireAt: formatDateTime(expire),
    status
  };
}

// ───────────────────────── 主入口 ─────────────────────────

/**
 * 处理历史学员数据导入
 *
 * @param {number} userId - 当前用户的 DB id
 * @param {string} realName - 用户填写的真实姓名（原始值，含空格）
 * @param {string} openid - 用户 openid
 * @returns {Promise<Object|null>} 导入结果摘要，或 null（跳过）
 */
async function processLegacyImport(userId, realName, openid) {
  // ── 1. 防重守卫：该用户是否已触发过历史导入 ──────────────────
  const alreadyImported = await findOne('legacy_students', { linked_user_id: userId });
  if (alreadyImported) {
    console.log(`[legacyImport] userId=${userId} 已有历史导入记录，跳过`);
    return null;
  }

  // ── 2. 清理姓名 ────────────────────────────────────────────
  const cleanedName = cleanName(realName);
  if (!cleanedName) {
    return null;
  }

  // ── 3. 名字匹配：先精确匹配 student_name，再匹配 aliases ────
  let legacyRecord = null;

  // 精确匹配主名
  const { data: exactMatches, error: exactErr } = await db
    .from('legacy_students')
    .select('*')
    .eq('student_name', cleanedName)
    .neq('is_duplicate', 2)
    .eq('import_status', 0)
    .limit(1);

  if (exactErr) throw exactErr;
  if (exactMatches && exactMatches.length > 0) {
    legacyRecord = exactMatches[0];
  }

  // 若未找到，尝试通过 student_aliases JSON 数组模糊匹配
  if (!legacyRecord) {
    const { data: aliasMatches, error: aliasErr } = await db
      .from('legacy_students')
      .select('*')
      .like('student_aliases', `%"${cleanedName}"%`)
      .neq('is_duplicate', 2)
      .eq('import_status', 0)
      .limit(1);

    if (aliasErr) throw aliasErr;
    if (aliasMatches && aliasMatches.length > 0) {
      legacyRecord = aliasMatches[0];
    }
  }

  if (!legacyRecord) {
    console.log(`[legacyImport] userId=${userId} 姓名"${cleanedName}"未找到历史记录`);
    return null;
  }

  console.log(`[legacyImport] userId=${userId} 匹配到历史记录 id=${legacyRecord.id} student_name=${legacyRecord.student_name}`);

  // ── 4. 标记为已导入（先锁定，防止并发重复触发） ─────────────
  await update(
    'legacy_students',
    {
      import_status: 1,
      linked_user_id: userId,
      imported_at: formatDateTime(new Date())
    },
    { id: legacyRecord.id }
  );

  const result = { legacyId: legacyRecord.id, courses: [], ambassador: false, recommender: false };

  // ── 5. 导入历史课程 ─────────────────────────────────────
  await importCourses(userId, openid, legacyRecord, result);

  // ── 6. 绑定推荐人 ──────────────────────────────────────
  await bindRecommender(userId, legacyRecord, result);

  // ── 7. 大使升级 + 合同 ─────────────────────────────────
  if (legacyRecord.is_ambassador === 1) {
    await upgradeAmbassador(userId, openid, legacyRecord, result);
    // 8. 追溯绑定：该大使已注册的学员
    await retroactivelyBindStudents(userId, legacyRecord);
  }

  console.log(`[legacyImport] userId=${userId} 历史导入完成:`, JSON.stringify(result));
  return result;
}

// ───────────────────────── 步骤实现 ─────────────────────────

/**
 * 导入历史课程记录
 */
async function importCourses(userId, openid, legacyRecord, result) {
  // 获取课程模板：初探班(type=1) 和 密训班(type=2)，取最早创建的一条
  const getCourseTemplate = async (type) => {
    const { data, error } = await db
      .from('courses')
      .select('id, name, validity_days, type')
      .eq('type', type)
      .eq('is_deleted', 0)
      .eq('status', 1)
      .order('id', { ascending: true })
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  };

  const coursesToImport = [];

  if (legacyRecord.chutan_date) {
    const template = await getCourseTemplate(1);
    if (template) {
      coursesToImport.push({ template, startDate: legacyRecord.chutan_date });
    }
  }

  if (legacyRecord.mixin_date) {
    const template = await getCourseTemplate(2);
    if (template) {
      coursesToImport.push({ template, startDate: legacyRecord.mixin_date });
    }
  }

  for (const { template, startDate } of coursesToImport) {
    const { expireAt, status } = calcCourseExpiry(startDate, template.validity_days);
    const now = formatDateTime(new Date());

    const { data: newCourse, error } = await db
      .from('user_courses')
      .insert({
        _openid: openid,
        user_id: userId,
        course_id: template.id,
        purchase_time: now,
        start_date: startDate,
        expire_at: expireAt,
        status: status,
        attend_count: 1,
        source: 3,        // source=3: 管理员线下录入
        remark: '历史数据导入'
      })
      .select()
      .single();

    if (error) {
      console.error('[legacyImport] 导入课程失败:', error);
    } else {
      console.log(`[legacyImport] 导入课程成功: user_course_id=${newCourse.id} type=${template.type}`);
      result.courses.push({ courseId: template.id, type: template.type, status });
    }
  }
}

/**
 * 绑定推荐人关系
 * 只在当前用户尚未有已确认推荐人（referee_confirmed_at IS NULL）时执行
 */
async function bindRecommender(userId, legacyRecord, result) {
  if (!legacyRecord.recommender_alias) return;

  // 查当前用户推荐人状态
  const currentUser = await findOne('users', { id: userId });
  if (!currentUser) return;

  // 如果已有已确认的推荐人，不覆盖
  if (currentUser.referee_id && currentUser.referee_confirmed_at) {
    console.log(`[legacyImport] userId=${userId} 已有确认推荐人，跳过绑定`);
    return;
  }

  // 查找推荐人（大使）的 linked_user_id -> users 表 id
  const recommendLegacy = await findRecommenderLegacy(legacyRecord.recommender_alias);
  if (!recommendLegacy || !recommendLegacy.linked_user_id) {
    console.log(`[legacyImport] 推荐人 ${legacyRecord.recommender_alias} 尚未注册，待追溯绑定`);
    return;
  }

  const referrerId = recommendLegacy.linked_user_id;
  const referrer = await findOne('users', { id: referrerId });
  if (!referrer) return;

  await update(
    'users',
    {
      referee_id: referrerId,
      referee_uid: referrer.uid || null,
      referee_updated_at: formatDateTime(new Date())
    },
    { id: userId }
  );

  await insert('referee_change_logs', {
    _openid: currentUser._openid || '',
    user_id: userId,
    old_referee_id: currentUser.referee_id || null,
    new_referee_id: referrerId,
    change_type: 1,      // 1=管理员设置
    change_source: 1,    // 1=系统自动
    remark: `历史数据自动绑定推荐人：${legacyRecord.recommender_alias}`
  });

  console.log(`[legacyImport] userId=${userId} 推荐人绑定成功 referrerId=${referrerId}`);
  result.recommender = true;
}

/**
 * 查找推荐人在 legacy_students 中的记录（通过大使别名）
 */
async function findRecommenderLegacy(recommenderAlias) {
  const { data, error } = await db
    .from('legacy_students')
    .select('linked_user_id, ambassador_alias, ambassador_real_name')
    .eq('ambassador_alias', recommenderAlias)
    .not('linked_user_id', 'is', null)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * 大使升级：更新用户等级、生成推荐码、插入升级日志、创建合同记录
 */
async function upgradeAmbassador(userId, openid, legacyRecord, result) {
  const targetLevel = legacyRecord.ambassador_level;
  if (!targetLevel || targetLevel === 0) return;

  const user = await findOne('users', { id: userId });
  if (!user) return;

  // 不降级：若已是同等或更高等级则跳过
  if (user.ambassador_level >= targetLevel) {
    console.log(`[legacyImport] userId=${userId} 当前等级${user.ambassador_level} >= 目标${targetLevel}，跳过升级`);
  } else {
    const today = formatDateTime(new Date()).split(' ')[0]; // YYYY-MM-DD

    // 生成推荐码（若无）
    let refereeCode = user.referee_code;
    if (!refereeCode) {
      refereeCode = await generateUniqueRefereeCode();
    }

    // 更新用户等级
    await update(
      'users',
      {
        ambassador_level: targetLevel,
        ambassador_start_date: today,
        referee_code: refereeCode
      },
      { id: userId }
    );

    // 记录升级日志
    await insert('ambassador_upgrade_logs', {
      _openid: openid,
      user_id: userId,
      old_level: user.ambassador_level || 0,
      new_level: targetLevel,
      upgrade_type: 3,     // 3=管理员操作
      remark: `历史数据导入，大使别名：${legacyRecord.ambassador_alias || ''}`,
      created_at: formatDateTime(new Date())
    });

    console.log(`[legacyImport] userId=${userId} 大使升级至等级 ${targetLevel}`);
    result.ambassador = true;
  }

  // 无论是否升级，都创建历史合同记录（仅当无有效合同时）
  await createLegacyContract(userId, openid, legacyRecord, targetLevel);
}

/**
 * 创建历史合同记录（sign_type=3 管理员线下录入）
 * 仅在用户没有该等级的有效合同时创建
 */
async function createLegacyContract(userId, openid, legacyRecord, targetLevel) {
  // 查合同模板
  const { data: templates, error: tplErr } = await db
    .from('contract_templates')
    .select('id, contract_name, version')
    .eq('ambassador_level', targetLevel)
    .eq('status', 1)
    .is('deleted_at', null)
    .limit(1);

  if (tplErr) throw tplErr;
  if (!templates || templates.length === 0) {
    console.warn(`[legacyImport] 等级${targetLevel}无合同模板，跳过合同创建`);
    return;
  }

  const template = templates[0];

  // 检查是否已有该等级的活跃合同
  const { data: existingContracts, error: existErr } = await db
    .from('contract_signatures')
    .select('id')
    .eq('user_id', userId)
    .eq('ambassador_level', targetLevel)
    .eq('status', 1)
    .limit(1);

  if (existErr) throw existErr;
  if (existingContracts && existingContracts.length > 0) {
    console.log(`[legacyImport] userId=${userId} 等级${targetLevel}已有活跃合同，跳过创建`);
    return;
  }

  const user = await findOne('users', { id: userId });
  const now = new Date();
  const contractStart = formatDateTime(now).split(' ')[0];
  const contractEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const contractEnd = formatDateTime(contractEndDate).split(' ')[0];

  await insert('contract_signatures', {
    _openid: openid,
    user_id: userId,
    user_name: user ? (user.real_name || '') : '',
    contract_template_id: template.id,
    ambassador_level: targetLevel,
    contract_name: template.contract_name,
    contract_version: template.version || 1,
    contract_content: '',
    contract_file_id: '',
    signature_image_id: '',
    contract_start: contractStart,
    contract_end: contractEnd,
    sign_time: formatDateTime(now),
    status: 1,
    sign_type: 3,       // 3=管理员线下录入
    sign_ip: '',
    sign_device: null,
    remark: `历史数据导入，大使别名：${legacyRecord.ambassador_alias || ''}`
  });

  console.log(`[legacyImport] userId=${userId} 历史合同创建成功，等级=${targetLevel} 有效期365天`);
}

/**
 * 追溯绑定：已注册但尚未绑定推荐人的学员
 * 当一个大使注册时，找出其已在 legacy_students 中有记录且已注册的学员，自动绑定
 */
async function retroactivelyBindStudents(ambassadorUserId, legacyRecord) {
  const ambassadorAlias = legacyRecord.ambassador_alias;
  if (!ambassadorAlias) return;

  // 查找以该大使为推荐人、且已注册（linked_user_id 不为空）的学员记录
  const { data: studentRecords, error } = await db
    .from('legacy_students')
    .select('linked_user_id, student_name')
    .eq('recommender_alias', ambassadorAlias)
    .not('linked_user_id', 'is', null);

  if (error) {
    console.error('[legacyImport] retroactivelyBindStudents 查询失败:', error);
    return;
  }

  if (!studentRecords || studentRecords.length === 0) return;

  const ambassador = await findOne('users', { id: ambassadorUserId });
  if (!ambassador) return;

  for (const sr of studentRecords) {
    const studentUserId = sr.linked_user_id;
    if (studentUserId === ambassadorUserId) continue;

    const student = await findOne('users', { id: studentUserId });
    if (!student) continue;

    // 只绑定尚未确认推荐人的学员
    if (student.referee_id && student.referee_confirmed_at) continue;

    await update(
      'users',
      {
        referee_id: ambassadorUserId,
        referee_uid: ambassador.uid || null,
        referee_updated_at: formatDateTime(new Date())
      },
      { id: studentUserId }
    );

    await insert('referee_change_logs', {
      _openid: student._openid || '',
      user_id: studentUserId,
      old_referee_id: student.referee_id || null,
      new_referee_id: ambassadorUserId,
      change_type: 1,
      change_source: 1,
      remark: `历史数据追溯绑定推荐人：${ambassadorAlias}`
    });

    console.log(`[legacyImport] 追溯绑定：studentUserId=${studentUserId} -> ambassadorUserId=${ambassadorUserId}`);
  }
}

module.exports = { processLegacyImport };
