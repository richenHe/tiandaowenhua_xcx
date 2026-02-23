/**
 * 前端字段使用检查脚本
 * 扫描所有 .vue 页面，检查 API 字段是否真正被使用
 * 运行：node admin/field-usage-check.js
 */

const fs = require('fs');
const path = require('path');

// ===== 工具 =====
function toCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function toSnake(s) {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}
function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function fieldUsedInContent(field, content) {
  const names = new Set([
    field.name,
    toCamel(field.name),
    toSnake(field.name),
    ...(field.aliases || [])
  ]);
  for (const name of names) {
    if (new RegExp('\\b' + escapeReg(name) + '\\b').test(content)) return true;
  }
  return false;
}

// ===== API 字段定义 =====
// match: 在 .vue 文件内容中匹配该 API 调用的正则列表（任一匹配即触发）
// fields: 预期字段，critical=true 表示关键字段（显示用）
const API_DEFS = [

  // ---------- 课程模块 ----------
  {
    match: ['CourseApi\\.getList', 'action.*getList.*course', "name.*'course'"],
    label: '课程列表 (CourseApi.getList)',
    fields: [
      { name: 'cover_image',   aliases: ['coverImage'],     critical: true,  note: '课程封面图' },
      { name: 'name',          aliases: ['title'],          critical: false },
      { name: 'current_price', aliases: ['currentPrice', 'price'], critical: false },
      { name: 'sold_count',    aliases: ['soldCount'],      critical: false },
      { name: 'type',          aliases: [],                 critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getDetail'],
    label: '课程详情 (CourseApi.getDetail)',
    fields: [
      { name: 'cover_image',   aliases: ['coverImage'],     critical: true,  note: '课程封面图' },
      { name: 'name',          aliases: [],                 critical: false },
      { name: 'current_price', aliases: ['currentPrice', 'price'], critical: false },
      { name: 'sold_count',    aliases: ['soldCount'],      critical: false },
      { name: 'description',   aliases: [],                 critical: false },
      { name: 'outline',       aliases: [],                 critical: false },
      { name: 'teacher',       aliases: ['instructor'],     critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getClassRecords'],
    label: '课程排期 (CourseApi.getClassRecords)',
    fields: [
      { name: 'start_time',      aliases: ['startTime'],      critical: true,  note: '开始时间' },
      { name: 'course_name',     aliases: ['courseName'],     critical: false },
      { name: 'class_date',      aliases: ['classDate'],      critical: false },
      { name: 'location',        aliases: [],                 critical: false },
      { name: 'teacher',         aliases: [],                 critical: false },
      { name: 'available_quota', aliases: ['availableQuota'], critical: false },
      { name: 'is_appointed',    aliases: ['isAppointed'],    critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getMyAppointments'],
    label: '我的预约 (CourseApi.getMyAppointments)',
    fields: [
      { name: 'course_name',  aliases: ['courseName'],  critical: false },
      { name: 'start_time',   aliases: ['startTime'],   critical: true, note: '预约开始时间' },
      { name: 'location',     aliases: [],              critical: false },
      { name: 'status',       aliases: [],              critical: false },
      { name: 'status_text',  aliases: ['statusText'],  critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getCaseList'],
    label: '案例列表 (CourseApi.getCaseList)',
    fields: [
      { name: 'title',         aliases: [],             critical: false },
      { name: 'student_name',  aliases: ['studentName'], critical: false },
      { name: 'summary',       aliases: [],             critical: false },
      { name: 'cover_image',   aliases: ['coverImage'], critical: true, note: '案例封面' },
      { name: 'category',      aliases: [],             critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getAcademyList'],
    label: '商学院列表 (CourseApi.getAcademyList)',
    fields: [
      { name: 'title',       aliases: [],             critical: false },
      { name: 'cover_image', aliases: ['coverImage'], critical: true, note: '商学院封面' },
      { name: 'type',        aliases: [],             critical: false },
    ]
  },
  {
    match: ['CourseApi\\.getMaterialList'],
    label: '资料列表 (CourseApi.getMaterialList)',
    fields: [
      { name: 'title',     aliases: [],          critical: false },
      { name: 'image_url', aliases: ['imageUrl'], critical: true, note: '资料图片' },
      { name: 'category',  aliases: [],          critical: false },
      { name: 'content',   aliases: [],          critical: false },
    ]
  },

  // ---------- 用户模块 ----------
  {
    match: ['UserApi\\.getProfile'],
    label: '用户资料 (UserApi.getProfile)',
    fields: [
      { name: 'real_name',  aliases: ['realName', 'name'],  critical: false },
      { name: 'phone',      aliases: [],                    critical: false },
      { name: 'avatar',     aliases: ['avatarUrl', 'avatar_url'], critical: false },
      { name: 'referee_id', aliases: ['refereeId'],         critical: false },
      { name: 'referee_name', aliases: ['refereeName'],     critical: false },
      { name: 'ambassador_level', aliases: ['ambassadorLevel', 'level'], critical: false },
    ]
  },
  {
    match: ['UserApi\\.getMyCourses'],
    label: '我的课程 (UserApi.getMyCourses)',
    fields: [
      { name: 'title',        aliases: ['name'],         critical: false },
      { name: 'cover_image',  aliases: ['coverImage'],   critical: false, note: '课程封面（my-courses页已处理）' },
      { name: 'purchase_date', aliases: ['purchaseDate', 'buy_time', 'buyTime'], critical: false },
      { name: 'progress',     aliases: [],               critical: false },
    ]
  },
  {
    match: ['UserApi\\.getMyOrders'],
    label: '我的订单 (UserApi.getMyOrders)',
    fields: [
      { name: 'order_no',     aliases: ['orderNo'],      critical: false },
      { name: 'course_title', aliases: ['courseTitle', 'course_name'], critical: false },
      { name: 'total_amount', aliases: ['totalAmount', 'final_amount'], critical: false },
      { name: 'status',       aliases: [],               critical: false },
      { name: 'created_at',   aliases: ['createdAt'],    critical: false },
    ]
  },
  {
    match: ['UserApi\\.getMeritPoints'],
    label: '功德分余额 (UserApi.getMeritPoints)',
    fields: [
      { name: 'balance',      aliases: [],              critical: true, note: '功德分余额' },
      { name: 'total_earned', aliases: ['totalEarned'], critical: false },
      { name: 'total_spent',  aliases: ['totalSpent'],  critical: false },
    ]
  },
  {
    match: ['UserApi\\.getMeritPointsHistory'],
    label: '功德分明细 (UserApi.getMeritPointsHistory)',
    fields: [
      { name: 'change_amount', aliases: ['changeAmount'], critical: false },
      { name: 'balance_after', aliases: ['balanceAfter'], critical: false },
      { name: 'change_type',   aliases: ['changeType'],   critical: false },
      { name: 'remark',        aliases: [],               critical: false },
      { name: 'created_at',    aliases: ['createdAt'],    critical: false },
    ]
  },
  {
    match: ['UserApi\\.getCashPoints'],
    label: '积分余额 (UserApi.getCashPoints)',
    fields: [
      { name: 'available',    aliases: [],              critical: true, note: '可用积分' },
      { name: 'frozen',       aliases: [],              critical: false },
      { name: 'total_earned', aliases: ['totalEarned'], critical: false },
    ]
  },
  {
    match: ['UserApi\\.getCashPointsHistory'],
    label: '积分明细 (UserApi.getCashPointsHistory)',
    fields: [
      { name: 'change_amount', aliases: ['changeAmount'], critical: false },
      { name: 'balance_after', aliases: ['balanceAfter'], critical: false },
      { name: 'change_type',   aliases: ['changeType'],   critical: false },
      { name: 'remark',        aliases: [],               critical: false },
      { name: 'created_at',    aliases: ['createdAt'],    critical: false },
    ]
  },
  {
    match: ['UserApi\\.getWithdrawRecords'],
    label: '提现记录 (UserApi.getWithdrawRecords)',
    fields: [
      { name: 'withdraw_no',   aliases: ['withdrawNo'],  critical: false },
      { name: 'amount',        aliases: [],              critical: false },
      { name: 'status',        aliases: [],              critical: false },
      { name: 'created_at',    aliases: ['createdAt'],   critical: false },
      { name: 'withdraw_type', aliases: ['withdrawType'], critical: false },
    ]
  },
  {
    match: ['UserApi\\.getMyReferees', 'UserApi\\.getReferralStats'],
    label: '推荐人列表/统计 (UserApi.getMyReferees/getReferralStats)',
    fields: [
      { name: 'real_name',       aliases: ['realName', 'name'], critical: false },
      { name: 'ambassador_level', aliases: ['ambassadorLevel', 'level'], critical: false },
      { name: 'created_at',      aliases: ['createdAt'],       critical: false },
      { name: 'total_referrals', aliases: ['totalReferrals'],  critical: false },
    ]
  },
  {
    match: ['UserApi\\.searchReferees'],
    label: '搜索推荐人 (UserApi.searchReferees)',
    fields: [
      { name: 'name',           aliases: ['real_name', 'realName'], critical: false },
      { name: 'phone',          aliases: [],                        critical: false },
      { name: 'ambassador_level', aliases: ['ambassadorLevel', 'level'], critical: false },
      { name: 'referee_code',   aliases: ['refereeCode'],           critical: false },
    ]
  },

  // ---------- 系统模块 ----------
  {
    match: ['SystemApi\\.getUserPoints'],
    label: '用户积分 (SystemApi.getUserPoints)',
    fields: [
      { name: 'meritPoints',         aliases: ['merit_points'],          critical: true, note: '功德分' },
      { name: 'cashPointsAvailable', aliases: ['cash_points_available'], critical: true, note: '可用积分' },
    ]
  },
  {
    match: ['SystemApi\\.getBannerList'],
    label: 'Banner列表 (SystemApi.getBannerList)',
    fields: [
      { name: 'title',       aliases: [],                       critical: false },
      { name: 'cover_image', aliases: ['coverImage', 'image'],  critical: true, note: 'Banner图片' },
      { name: 'link',        aliases: [],                       critical: false },
    ]
  },
  {
    match: ['SystemApi\\.getAnnouncementList'],
    label: '公告列表 (SystemApi.getAnnouncementList)',
    fields: [
      { name: 'title',      aliases: [],              critical: false },
      { name: 'content',    aliases: [],              critical: false },
      { name: 'created_at', aliases: ['createdAt'],   critical: false },
    ]
  },
  {
    match: ['SystemApi\\.getSystemConfig'],
    label: '系统配置 (SystemApi.getSystemConfig)',
    fields: [
      { name: 'config',  aliases: [],  critical: false },
    ]
  },

  // ---------- 订单模块 ----------
  {
    match: ['OrderApi\\.getMallGoods'],
    label: '商城商品 (OrderApi.getMallGoods)',
    fields: [
      { name: 'goods_name',         aliases: ['goodsName', 'name'],    critical: false },
      { name: 'goods_image',        aliases: ['goodsImage', 'image'],  critical: true, note: '商品图片' },
      { name: 'merit_points_price', aliases: ['meritPointsPrice', 'points'], critical: false },
      { name: 'stock_quantity',     aliases: ['stockQuantity', 'stock'], critical: false },
      { name: 'can_exchange',       aliases: ['canExchange'],          critical: false },
    ]
  },
  {
    match: ['OrderApi\\.getMallCourses'],
    label: '商城课程 (OrderApi.getMallCourses)',
    fields: [
      { name: 'name',         aliases: [],                          critical: false },
      { name: 'coverImage',   aliases: ['cover_image', 'coverImg'], critical: true, note: '课程封面图' },
      { name: 'currentPrice', aliases: ['current_price', 'price'],  critical: false },
      { name: 'soldCount',    aliases: ['sold_count'],              critical: false },
    ]
  },
  {
    match: ['OrderApi\\.getExchangeRecords'],
    label: '兑换记录 (OrderApi.getExchangeRecords)',
    fields: [
      { name: 'exchange_no',       aliases: ['exchangeNo'],      critical: false },
      { name: 'goods_name',        aliases: ['goodsName'],       critical: false },
      { name: 'quantity',          aliases: [],                  critical: false },
      { name: 'merit_points_used', aliases: ['meritPointsUsed'], critical: false },
      { name: 'status_name',       aliases: ['statusName'],      critical: false },
      { name: 'created_at',        aliases: ['createdAt'],       critical: false },
    ]
  },
  {
    match: ['OrderApi\\.getDetail', "action.*'getDetail'.*order", "action.*getOrderDetail"],
    label: '订单详情 (OrderApi.getDetail)',
    fields: [
      { name: 'order_no',      aliases: ['orderNo'],       critical: false },
      { name: 'order_name',    aliases: ['orderName', 'course_name'], critical: false },
      { name: 'final_amount',  aliases: ['finalAmount', 'total_amount'], critical: false },
      { name: 'pay_status',    aliases: ['payStatus', 'status'], critical: false },
      { name: 'created_at',    aliases: ['createdAt'],     critical: false },
      { name: 'expires_at',    aliases: ['expiresAt'],     critical: false },
    ]
  },

  // ---------- 大使模块 ----------
  {
    match: ['AmbassadorApi\\.getLevelSystem', 'AmbassadorApi\\.getUpgradeGuide'],
    label: '大使等级体系 (AmbassadorApi.getLevelSystem/getUpgradeGuide)',
    fields: [
      { name: 'level',           aliases: [],             critical: false },
      { name: 'level_name',      aliases: ['levelName'],  critical: false },
      { name: 'benefits',        aliases: [],             critical: false },
      { name: 'upgrade_options', aliases: ['upgradeOptions'], critical: false },
      { name: 'current_stats',   aliases: ['currentStats'], critical: false },
    ]
  },
  {
    match: ['AmbassadorApi\\.getActivityStats', 'AmbassadorApi\\.getActivityRecords'],
    label: '活动记录 (AmbassadorApi.getActivityRecords)',
    fields: [
      { name: 'activity_name',  aliases: ['activityName'],  critical: false },
      { name: 'activity_type',  aliases: ['activityType'],  critical: false },
      { name: 'merit_points',   aliases: ['meritPoints'],   critical: false },
      { name: 'start_time',     aliases: ['startTime'],     critical: false },
      { name: 'total_count',    aliases: ['totalCount'],    critical: false },
      { name: 'created_at',     aliases: ['createdAt'],     critical: false },
    ]
  },
  {
    match: ['AmbassadorApi\\.getContractTemplate'],
    label: '协议模板 (AmbassadorApi.getContractTemplate)',
    fields: [
      { name: 'title',          aliases: [],  critical: false },
      { name: 'content',        aliases: [],  critical: true, note: '协议内容' },
      { name: 'version',        aliases: [],  critical: false },
      { name: 'effective_date', aliases: ['effectiveDate'], critical: false },
    ]
  },
  {
    match: ['AmbassadorApi\\.getContractDetail'],
    label: '协议详情 (AmbassadorApi.getContractDetail)',
    fields: [
      { name: 'contract_no', aliases: ['contractNo'],  critical: false },
      { name: 'title',       aliases: [],              critical: false },
      { name: 'content',     aliases: [],              critical: true, note: '协议内容' },
      { name: 'status',      aliases: [],              critical: false },
      { name: 'signed_at',   aliases: ['signedAt'],    critical: false },
      { name: 'expire_at',   aliases: ['expireAt'],    critical: false },
    ]
  },
  {
    match: ['AmbassadorApi\\.generateQRCode'],
    label: '大使二维码 (AmbassadorApi.generateQRCode)',
    fields: [
      { name: 'qrcode_url',   aliases: ['qrcodeUrl', 'qrCode'],  critical: true, note: '二维码图片' },
      { name: 'referee_code', aliases: ['refereeCode'],          critical: false },
    ]
  },
];

// ===== 扫描逻辑 =====
const PAGES_DIR = path.join(__dirname, '../universal-cloudbase-uniapp-template/src/pages');

function scanVueFiles(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...scanVueFiles(f));
    else if (e.name.endsWith('.vue')) r.push(f);
  }
  return r;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

  const matchedApis = API_DEFS.filter(def =>
    def.match.some(pat => {
      try { return new RegExp(pat).test(content); } catch { return false; }
    })
  );
  if (matchedApis.length === 0) return null;

  const issues = [];
  for (const apiDef of matchedApis) {
    for (const field of apiDef.fields) {
      if (!fieldUsedInContent(field, content)) {
        issues.push({ api: apiDef.label, field: field.name, critical: field.critical, note: field.note || '' });
      }
    }
  }
  return { file: relPath, apis: matchedApis.map(a => a.label), issues };
}

// ===== 主输出 =====
console.log('='.repeat(72));
console.log('前端字段使用检查报告（全量）');
console.log('='.repeat(72));
console.log();

const vueFiles = scanVueFiles(PAGES_DIR);
let totalIssues = 0, criticalIssues = 0, coveredPages = 0;

for (const file of vueFiles) {
  const result = checkFile(file);
  if (!result) continue;
  coveredPages++;

  const hasCritical = result.issues.some(i => i.critical);
  const icon = result.issues.length === 0 ? '✅' : (hasCritical ? '🔴' : '🟡');
  console.log(`${icon} ${result.file}`);
  console.log(`   APIs: ${result.apis.join(' | ')}`);
  for (const issue of result.issues) {
    const tag = issue.critical ? '[CRITICAL]' : '[warn]    ';
    const note = issue.note ? ` — ${issue.note}` : '';
    console.log(`   ${tag} "${issue.field}" 未被使用${note}`);
    totalIssues++;
    if (issue.critical) criticalIssues++;
  }
  console.log();
}

console.log('='.repeat(72));
console.log(`扫描总页面：${vueFiles.length}  命中页面：${coveredPages}`);
console.log(`发现问题：${totalIssues} 个（关键字段 ${criticalIssues} 个）`);
console.log('='.repeat(72));
