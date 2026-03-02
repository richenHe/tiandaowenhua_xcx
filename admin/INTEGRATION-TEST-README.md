# 小程序端 · 端到端业务流程集成测试指南

## 🧪 测试执行规范（用户必读）

> **本节为人工测试操作规范，每次开始新流程测试前必须遵守。**

### 规则 0：逐步推进原则（最高优先级）

**⛔ 禁止一次性点击"运行全部业务流程"，禁止跳步骤。**

每次测试必须按以下流程执行：

#### 步骤推进顺序

```
第1步  单流程运行     → 在流程卡片上点击，只运行当前流程
第2步  逐步核查       → 对当前流程每个步骤的结果逐一确认（含 biz 断言）
第3步  DB 交叉验证    → 将当前流程的 SQL 发给 AI，执行 MCP 验证
第4步  用例完善       → AI 根据结果补充/更新 BUSINESS-FLOW-CASES.md
第5步  标注完成       → AI 将该流程的步骤标题加 ✅ 前缀 + 验证日期
第6步  进入下一流程   → 重复第1~5步
─────────────────────────────────────────────
最后一步  全量运行    → 所有流程均 ✅ 后，才能点击"运行全部业务流程"
```

#### 当前测试进度

| 流程 | 状态 | 最后验证日期 |
|------|------|-------------|
| F1 用户资料 · 推荐人 · 资格验证 | ⏳ 重测（修复 updateReferee expectError '已绑定'→'已锁定'；createUser uid 字段缺失修复；ua_createUser 可重新测试） | 2026-03-01 |
| F1B 边界验证 · 未完善资料 · 无推荐人 · 功德分=0 | ✅ 已完成（全通过 3/3） | 2026-02-27 |
| F2 课程浏览 · 详情 · 购买条件验证 | ⏳ 重测（新增 getCaseDetail 验证、补全 getCaseList 全字段断言；manageAcademyContent 补加 summary 列已修复；S2.X4 新增 getMyCourses 返回 expire_at 字段验证） | 2026-03-01 |
| F3 订单 · 商城兑换 · 多表数据一致性 | ⏳ 重测（新增 S3.11 课程有效期 expire_at 验证；courses.validity_days 字段接入，购课/兑换时写入 expire_at；validity_days 改为必填正整数，后台及云函数均强制校验） | 2026-03-01 |
| F4 功德分 · 积分 · 提现 · 余额一致性 | ✅ 已完成（数据清理后全通过） | 2026-02-27 |
| F4B 边界验证 · 无推荐人+完整资料 · 积分余额 | ✅ 已完成（全通过 3/3） | 2026-02-27 |
| F5 大使体系 · 等级配置 · 升级条件 | ⏳ 重测（修复 ac_apply expectError '已申请'→'待审核'） | 2026-03-01 |
| F5B 边界验证 · 普通用户拦截(level=0) · 无申请 · 升级指南0→1 | ✅ 已完成（全通过 4/4） | 2026-02-27 |
| F5C 边界验证 · 准青鸾升级路径(level=1) · target≤current拒绝 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
| F5D 流程5-D: 青鸾大使升级路径(level=2→3) · 名额remaining=0边界 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
| F5E 流程5-E: 申请被拒绝(status=2) · 拒绝原因返回验证 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
| F5F 流程5-F: 申请待审核(status=0) · 升级指南审核中状态 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
| F6 协议模板 · 我的协议 · 签署验证 | ⏳ 重测（修复 signContract .single() 多行失效导致已签检查无效，expectError '已签' 现已正确触发） | 2026-03-01 |
| F7 预约 · 排期 · 学习进度 · 签到 | ⏳ 重测（新增复训费支付流程；禁用取消预约；createAppointment 新增复训校验；payment.js handleRetrainPayment 修复 course_id Bug；前端打通复训支付→自动创建预约链路） | 2026-03-02 |
| F8 反馈 · 类型联动 · 课程关联 | ✅ 已完成（修复3处问题后全通过 8/8，含写操作+边界+分页+reply验证，DB交叉16项一致） | 2026-02-28 |
| F9 系统公共 · 公告 · Banner · 配置 · 通知 | ⏳ 重测（修复 getAnnouncementDetail .single()异常、updateBanner 返回缺 id、createNotificationConfig 唯一约束、createAdminUser .single()异常） | 2026-03-01 |
| F10 跨模块数据完整性终极验证 | ⏳ 待测（需 F1~F9 完成后） | — |
| F11 大使志愿活动 · 岗位管理 · 报名 · 功德分发放 | ⏳ 重测（修复 getAmbassadorDetail .catch异常、createActivity 缺 target_level/reward_config 列已补加、createPositionType 返回 id、manageAcademyContent 缺 summary 列已补加；applyForActivity expectError 改为 '不在报名中'；cancelActivityRegistration expectError 改为 '未找到'；S11.2 修复：getAvailableActivities 不再返回 status=2 报名截止活动） | 2026-03-01 |
| F12 课程学习合同 · 签署拦截 · 合同配置 · 签约流程 · 奖励延迟发放 · 上架校验 | ⏳ 重测（新增 S12.6a 奖励验证 + S12.11/12 上架校验 + B5~B7 边界） | — |
| F13 退款申请 · 合同拦截 · 审核流转 · 业务回滚 | ⏳ 待测 | — |
| F14 沙龙课程 · 免费预约 · 自动签到 · 结束清理 | ⏳ 待测 | — |

> AI 助手在每次完成一个流程验证后，**必须立即更新上表的状态和日期**，不可遗漏。

#### 违规情形

| 违规操作 | 后果 |
|---------|------|
| 直接运行全部流程 | 无法定位具体失败步骤，DB 验证无从下手 |
| 跳过某个流程直接测下一个 | 跨流程依赖（规则4清单）的前置数据未确认 |
| 未等 DB 验证完成就标记 ✅ | 可能掩盖数据库层面的 BUG |
| 未完善用例就进入下一流程 | 弱断言步骤永远得不到改进 |

---

## ⚡ AI 助手强制规则（每次测试报告后必须执行）

> **本节为给 AI 助手的行为约束，优先级最高，不可跳过。**

### 规则 1：收到测试报告后，必须对每个业务流程的每个步骤执行 MCP 数据库验证

每当用户将 `integration-test.html` 的测试结果（截图/JSON/文字报告）发送给 AI 时，AI **必须立即**、**无需用户再次提醒**，通过 MCP `executeReadOnlySQL` 工具，对 **10 个业务流程中的每一个步骤**逐一执行数据库验证。

**禁止**仅凭接口 `success=true` 就认定测试通过；**必须**用 SQL 交叉验证数据库中的实际值。  
**不存在"可选验证"或"优先级"之分，所有步骤的验证 SQL 都必须执行。**

**执行流程：**
```
1. 用户发送测试报告
2. AI 读取报告中的测试用户 ID（默认 id=30）
3. 按流程 F1→F11 顺序，对每个步骤（S1.1、S1.2、...、S11.12）逐一执行该步骤对应的验证 SQL
   - 每个步骤的验证 SQL 见本文档"业务流程详解"各节中的"多表验证 SQL"/"★ 核心验证 SQL"
   - 无对应 SQL 的步骤（仅接口连通性检查）则对比接口返回字段是否符合业务规则
4. AI 对比 SQL 结果与接口返回值，明确报告：
   - ✓ 一致：接口值与数据库值匹配
   - ✗ 不一致：列出差异值，判断是 BUG 还是数据问题
   - ⚠ 无数据：说明该用户暂无相关记录，跳过
5. 汇总输出"数据库交叉验证报告"
```

**验证报告格式（AI 必须输出）：**
```
## 数据库交叉验证报告

测试用户: id=30 (张三)
验证时间: YYYY-MM-DD HH:mm

### F1 用户资料 · 推荐人 · 资格验证
| 步骤 | 验证项 | 接口返回值 | 数据库实际值 | 结论 |
|------|--------|-----------|-------------|------|
| S1.1 | profile_completed | 1 | 1 | ✓ |
| S1.2 | real_name 更新 | OK | DB已更新 | ✓ |
| ...  | ...    | ...       | ...         | ...  |

### F2 课程浏览 · 详情 · 购买条件验证
...（每个流程单独一节）

### F10 跨模块数据完整性
...

---
### 发现的数据不一致问题（汇总所有 ✗ 项）
### 结论（综合判断，是否需要修复）
```

---

### 规则 3：每次验证完成后，必须输出"测试用例覆盖分析"

完成数据库交叉验证报告后，AI **必须紧接着**输出本流程的测试用例覆盖分析，指出哪些场景已被当前测试数据覆盖、哪些场景尚未覆盖，并列出补充测试建议。

**目的**：同一业务流程在不同输入场景下行为不同，仅靠单一用户/单一数据无法验证全部分支，必须明确告知用户还需补充哪些测试用例。

**覆盖分析报告格式（AI 必须输出，紧接在交叉验证报告之后）：**

```
## 测试用例覆盖分析 — FX 流程名称

### 已覆盖场景
| 场景 | 当前测试数据 | 验证结果 |
|------|------------|---------|
| 场景描述 | 具体数据条件 | ✓ 已验证 |

### 未覆盖场景（需补充测试用例）
| # | 缺失场景 | 原因 | 补充方式 |
|---|---------|------|---------|
| 1 | 场景描述 | 当前数据不满足该条件 | 建议操作（补充数据/新增步骤/换测试用户） |

### 建议下一步
（明确告知用户需要执行哪些操作，才能覆盖缺失场景）
```

**各流程必须检查的典型场景维度：**

| 流程 | 必须覆盖的场景维度 |
|------|-----------------|
| F1 用户资料 | 有推荐人 / 无推荐人；推荐人已确认 / 未确认；profile_completed=0 / 1 |
| F2 课程浏览 | 初探班 / 密训班 / 咨询；已购买 / 未购买；has included_course_ids / null |
| F3 订单商城 | 有订单 / 无订单；已支付 / 未支付；有推荐人 / 无推荐人；有兑换记录 / 无 |
| F4 积分 | 功德分>0 / =0；积分有冻结 / 无冻结；有提现记录 / 无 |
| F5 大使体系 | level=0 / 1 / 2 / 3；申请中 / 已通过 / 未申请；有名额 / 无名额 |
| F6 协议 | 有签署协议 / 无；协议在有效期 / 已过期 |
| F7 预约 | 有预约 / 无预约；booked_quota>0 / =0；已签到 / 未签到 |
| F8 反馈 | 已购课程反馈 / 通用反馈；有反馈记录 / 无 |
| F9 系统公共 | 有公告 / 无；有 Banner / 无；系统配置存在 |
| F10 数据完整性 | 推荐人正常 / 循环引用；奖励已发 / 未发；密训班赠课完整 / 缺失 |

---

### 规则 M（手动测试）：凡需真机/人工操作的场景，必须登记到待办清单，由用户自行完成

> **本规则最高优先级，AI 不得跳过任何需要真机/人工操作的测试场景。**

#### 核心原则

1. **AI 不可替代人工**：凡涉及以下任意一种情况，AI **不得自行标记为"已完成"**，必须显式登记到"手动测试待办清单"：
   - 微信支付回调（真实付款）
   - 小程序真机扫码（generateQRCode 写 DB 验证）
   - 微信登录（code 换 openid）
   - 小程序端页面交互（滚动、点击、弹窗）
   - 任何需要真实微信 session 的操作

2. **AI 必须做的事**：每当发现需要手动测试的场景时，**立即追加**到下方"手动测试待办清单"，格式如下：
   - 登记编号（MT-序号）
   - 场景描述
   - 前置条件（测试前需满足的状态）
   - 验证步骤（操作步骤）
   - 验证 SQL（操作完成后用 MCP 执行，确认 DB 状态）
   - 状态（⏳ 待测 / ✅ 已测 YYYY-MM-DD）

3. **用户完成后**：将结果（截图/描述）发给 AI，AI 执行对应验证 SQL 后标记 ✅

---

#### 手动测试待办清单

| 编号 | 场景 | 流程 | 前置条件 | 验证步骤 | 验证 SQL | 状态 |
|------|------|------|---------|---------|---------|------|
| MT-01 | **generateQRCode 真实写 DB**：真机生成推广二维码后 `users.qrcode_url` 应回写 cloud:// fileID | F5 S5.8 | 用 level≥1 大使账号登录小程序 | 进入大使中心→我的推广码→点击生成 | `SELECT id, referee_code, qrcode_url FROM tiandao_culture.users WHERE id=30` | ✅ 通过（2026-02-27，id=32 真机验证，qrcode_url 写入 cloud://fileID） |
| MT-02 | **新用户扫码绑定推荐人**：新用户扫大使二维码注册后 `users.referee_id` 应绑定到该大使 | F1 扫码场景 | 准备一个从未注册过的新微信账号 | 用新账号手机扫大使推广码，完成登录注册 | `SELECT id, referee_id, referee_confirmed_at FROM tiandao_culture.users WHERE referee_id=32 ORDER BY created_at DESC LIMIT 3` | ⏳ 待测（需新微信账号；`login.js` 代码逻辑已审查确认正确） |
| MT-03 | **已购课+已有推荐人用户扫码不可修改推荐人** | F1 扫码边界 | 准备已购课且已有 referee_id 的用户 | 用该用户扫其他大使的推广码并登录 | `SELECT id, referee_id FROM tiandao_culture.users WHERE id=<该用户id>` — referee_id 应不变 | ⏳ 待测 |
| MT-04 | **微信支付回调全链路**：真实支付后 is_reward_granted=1、推荐人积分入账 | F3 S3.2 / F4 奖励验证 | 使用真实微信支付购买课程（user_id=30 或测试账号） | 完成支付 → 等待支付回调 | `SELECT o.order_no, o.is_reward_granted, o.pay_status FROM tiandao_culture.orders o WHERE o.user_id=30 AND o.pay_status=1 ORDER BY o.pay_time DESC LIMIT 3` | ⏳ 待测 |
| MT-05 | **预约操作后 booked_quota 递增**：调用 createAppointment 后 class_records.booked_quota 应+1，且 appointments 新增 status=0 记录 | F7 S7.1/S7.2 | user_id=30 有 user_courses，选 status=1 排期 | 小程序进入课程详情→选择排期→点击预约 | `SELECT cr.id, cr.booked_quota, (SELECT COUNT(*) FROM tiandao_culture.appointments a WHERE a.class_record_id=cr.id AND a.status IN(0,1)) as cnt FROM tiandao_culture.class_records cr WHERE cr.id=<排期id>` | ⏳ 待测 |
| MT-06 | ~~**取消预约后 booked_quota 递减**~~ **已废弃**（2026-03-02：取消预约功能已移除） | F7 | — | — | — | ❌ 废弃 |
| MT-07 | **后台批量签到**：batchCheckin 后 appointments.status 从 0→1，checkin_time 有值，attend_count+1 | F7 S7.2d | 存在 status=0 的预约记录 | 后台→预约管理→勾选多条待上课→批量签到 | `SELECT a.id, a.status, a.checkin_time, uc.attend_count FROM tiandao_culture.appointments a JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id WHERE a.user_id=30 AND a.status=1 ORDER BY a.checkin_time DESC LIMIT 5` | ⏳ 待测 |
| MT-07b | **后台单次签到**：点击签到按钮后 appointments.status=1，checkin_time 有值，attend_count+1（修复前 Bug：attend_count 不更新） | F7 S7.2c | 存在 status=0 的预约记录 | 后台→预约管理→找到单条待上课记录→点击"签到" | `SELECT a.id, a.status, a.checkin_time, uc.attend_count FROM tiandao_culture.appointments a JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id WHERE a.user_id=30 AND a.status=1 ORDER BY a.checkin_time DESC LIMIT 3` | ⏳ 待测 |
| MT-07c | **attend_count 初始值验证**：新购买课程后 user_courses.attend_count=0（修复前 Bug：初始值为 1） | F3 S3.10 | 有新购买课程记录（buy_time ≥ 2026-03-01） | 购买任意课程→支付回调触发→查询 user_courses | `SELECT id, course_id, attend_count, buy_time FROM tiandao_culture.user_courses WHERE user_id=30 ORDER BY id DESC LIMIT 3` — attend_count 应为 0 | ⏳ 待测 |
| MT-08 | **推荐初探班奖励-解冻场景**：推荐人有frozen>0时购买初探班，应解冻unfreeze_per_referral到available，不发功德分/积分 | 奖励验证 | 推荐人frozen>0，购买初探班 | 小程序购买初探班→等待支付回调 | `SELECT u.cash_points_frozen, u.cash_points_available, u.merit_points FROM tiandao_culture.users u WHERE u.id=<推荐人id>` + `SELECT type, amount FROM tiandao_culture.cash_points_records WHERE order_no='<订单号>' AND user_id=<推荐人id>` — type应为2(解冻) | ⏳ 待测 |
| MT-09 | **推荐初探班奖励-功德分场景**：推荐人frozen=0且merit_rate_basic>0时购买初探班，应按比例发功德分 | 奖励验证 | 推荐人frozen=0，等级配置merit_rate_basic>0 | 小程序购买初探班→等待支付回调 | `SELECT merit_points FROM tiandao_culture.users WHERE id=<推荐人id>` + `SELECT source, amount FROM tiandao_culture.merit_points_records WHERE order_no='<订单号>'` | ⏳ 待测 |
| MT-10 | **推荐密训班奖励-不消耗冻结**：推荐人有frozen>0时购买密训班，应按比例发奖励（功德分或积分），frozen不变 | 奖励验证 | 推荐人frozen>0，购买密训班 | 小程序购买密训班→等待支付回调 | `SELECT cash_points_frozen, cash_points_available, merit_points FROM tiandao_culture.users WHERE id=<推荐人id>` — frozen应不变 | ⏳ 待测 |
| MT-11 | **奖励互斥验证**：不应同时产生功德分记录和积分记录 | 奖励验证 | 任意等级推荐人，购买任意课程 | 支付完成后查询 | `SELECT COUNT(*) as merit_cnt FROM tiandao_culture.merit_points_records WHERE order_no='<订单号>'` + `SELECT COUNT(*) as cash_cnt FROM tiandao_culture.cash_points_records WHERE order_no='<订单号>'` — 两者不应同时>0 | ⏳ 待测 |
| MT-12 | **密训班赠课验证**：购买密训班后user_courses应同时有is_gift=1的初探班记录 | 赠课验证 | 购买密训班(type=2, included_course_ids=[1]) | 小程序购买密训班→等待支付回调 | `SELECT course_id, is_gift, source_order_id FROM tiandao_culture.user_courses WHERE user_id=<uid> ORDER BY id DESC LIMIT 5` — 应有is_gift=1,course_id=1 | ⏳ 待测 |
| MT-13 | **后台等级配置互斥校验**：初探班功德率和积分率同时>0时应报错 | 后台校验 | 登录admin后台 | 等级配置→编辑→同时填功德率和积分率→保存 | 应提示"不能同时大于0" | ⏳ 待测 |
| MT-14 | **后台等级配置倍数校验**：frozen_points不是unfreeze_per_referral整数倍时应报错 | 后台校验 | 登录admin后台 | 等级配置→编辑→设置非倍数关系→保存 | 应提示"必须是整数倍" | ⏳ 待测 |
| MT-15 | **大使申请写操作（F5B apply）**：调用 `ambassador.apply` 应创建 status=0 申请，has_application 变为 true | F5B `apply` | user_id=34 (level=0，无待审核申请) | 使用 F5B openid 调用 apply (targetLevel=1, real_name='孙海荣', phone填真实值) | `SELECT id, user_id, target_level, status FROM tiandao_culture.ambassador_applications WHERE user_id=34 ORDER BY id DESC LIMIT 1` — 应出现 status=0 记录 | ⏳ 待测 |
| MT-16 | **还原 MT-15 数据（驳回申请）**：驳回 MT-15 产生的申请，使 user_id=34 回到无申请状态，F5B 方可再次正常运行 | F5B 数据还原 | MT-15 完成后 | 后台→大使管理→申请列表→找 user_id=34 待审核→驳回 | `SELECT status FROM tiandao_culture.ambassador_applications WHERE user_id=34 ORDER BY id DESC LIMIT 1` — status 应为 2 | ⏳ 待测 |

| MT-17 | **小程序申请退款（未签合同）**：用户在智能客服页点击"退款"→ 选择已支付未签合同的课程 → 填写原因 → 提交，`orders.refund_status` 应变为 1 | F13 S13.1 | user_id=30，存在 pay_status=1 且 contract_signed=0 的课程订单 | 小程序智能客服页→退款→选课程→填原因→提交 | `SELECT order_no, refund_status, refund_reason, refund_amount FROM tiandao_culture.orders WHERE user_id=30 AND refund_status=1 ORDER BY id DESC LIMIT 3` | ⏳ 待测 |
| MT-18 | **退款合同拦截验证**：已签署学习合同的课程申请退款应被拦截，`refund_status` 不变 | F13 S13.2 | user_id=30，存在 contract_signed=1 的 user_courses | 小程序退款申请页→选择已签合同的课程 | 应弹出提示"已签署学习合同，无法退款"；`SELECT refund_status FROM tiandao_culture.orders WHERE user_id=30 AND order_no='<该订单号>'` — refund_status 应仍为 0 | ⏳ 待测 |
| MT-19 | **后台驳回退款**：管理员在退款管理页驳回 refund_status=1 的申请，`refund_status` 变为 4，小程序状态页显示"已驳回" | F13 S13.3 | 存在 refund_status=1 的订单（依赖 MT-17） | 后台→订单管理→退款管理→找到待审核记录→驳回→填写驳回原因 | `SELECT refund_status, refund_reject_reason, refund_audit_admin_id, refund_audit_time FROM tiandao_culture.orders WHERE refund_status=4 ORDER BY refund_audit_time DESC LIMIT 3` | ⏳ 待测 |
| MT-20 | **后台标记已转账（完成退款）**：上传发票后标记已转账，`refund_status=3`、`pay_status=4`，业务数据自动回滚（user_courses 失效） | F13 S13.4 | 存在 refund_status=1 的订单（依赖 MT-17），准备一张测试发票图片/PDF | 后台→退款管理→找到待审核记录→标记已转账→上传发票→保存 | `SELECT refund_status, pay_status, refund_time, refund_invoice_file_id FROM tiandao_culture.orders WHERE order_no='<订单号>'` + `SELECT status FROM tiandao_culture.user_courses WHERE order_id=<order_id>` — refund_status=3, pay_status=4, user_courses.status=2 | ⏳ 待测 |
| MT-21 | **退款后业务回滚验证**：course_type=1 退款后 user_courses.status 应变为 2，待上课预约 appointments.status 应变为 4（已取消） | F13 S13.5 | MT-20 完成后 | 执行 MT-20 后立即查询 | `SELECT uc.status, uc.course_id FROM tiandao_culture.user_courses uc WHERE uc.order_id=(SELECT id FROM tiandao_culture.orders WHERE order_no='<订单号>')` + `SELECT a.id, a.status FROM tiandao_culture.appointments a WHERE a.user_id=30 AND a.status=4 ORDER BY a.id DESC LIMIT 5` | ⏳ 待测 |
| MT-22 | **排课状态自动更新（定时任务）**：`autoUpdateScheduleStatus` 每天 0 点触发，验证排课状态流转：未开始(1)→进行中(2)、进行中(2)→已结束(3)，以及已结束排期中待上课预约自动标记为缺席(status=2) | 定时任务验证 | 存在 `class_date <= 今天` 且 `status=1` 的排期；存在 `class_date < 今天` 且 `status=2` 的排期；存在对应的 `status=0` 预约记录 | 等待次日 0 点后查询，或后台手动触发 `autoUpdateScheduleStatus` 云函数一次 | `SELECT id, class_date, class_end_date, status FROM tiandao_culture.class_records WHERE class_date <= CURDATE() ORDER BY id DESC LIMIT 10` — status 应已更新；`SELECT a.id, a.status FROM tiandao_culture.appointments a JOIN tiandao_culture.class_records cr ON a.class_record_id=cr.id WHERE cr.status=3 AND a.status=2 ORDER BY a.id DESC LIMIT 5` — 应有缺席记录 | ⏳ 待测 |
| MT-23 | **订单级推荐人修改（支付前）**：在订单确认页修改推荐人，`orders.referee_id` 应更新，`referee_change_logs` 新增一条 change_type=3 的记录，支付后奖励发给**订单推荐人** | F3 支付前改推荐人 | user_id=30，存在 pay_status=0 的待支付订单（或先创建一个）；准备两个 level≥1 的大使账号作为推荐人A和B | 小程序订单确认页→点击更换推荐人→选择新推荐人B→确认 | `SELECT order_no, referee_id FROM tiandao_culture.orders WHERE user_id=30 AND pay_status=0 ORDER BY id DESC LIMIT 1` — referee_id 应已变为 B 的 id；`SELECT change_type, old_referee_id, new_referee_id FROM tiandao_culture.referee_change_logs WHERE user_id=30 AND change_type=3 ORDER BY id DESC LIMIT 3` — 应有 change_type=3 记录 | ⏳ 待测 |
| MT-24 | **推荐人资格验证失败（准青鸾推荐密训班）**：level=1（准青鸾）大使作为推荐人，用户尝试购买 type=2（密训班）课程，系统应拒绝创建订单并提示"该推荐人暂时只能推荐初探班课程" | F3 / F1 资格验证边界 | 存在 ambassador_level=1 的大使账号（可用 user_id=34，需先升至 level=1）；user_id=30 的 referee_id 设为该准青鸾大使 | 小程序→密训班课程详情→立即购买→系统验证推荐人资格 | 应弹出错误提示，`orders` 表不应新增任何记录：`SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND order_no LIKE 'ORD%' ORDER BY id DESC LIMIT 1`（条数不变）| ⏳ 待测 |
| MT-25 | **课程续期兑换（exchangeCourse）**：使用功德分兑换课程复训名额，`quota_exchange_records` 表新增记录，`users.merit_points` 相应减少 | 商城兑换-课程 | user_id=30 功德分余额充足（`merit_points >= 兑换价格`）；商城中存在课程类型商品（`mall_goods.goods_type=2`） | 小程序商学院→商城→选择课程续期商品→确认兑换 | `SELECT * FROM tiandao_culture.quota_exchange_records WHERE user_id=30 ORDER BY id DESC LIMIT 3` — 应有新记录；`SELECT merit_points FROM tiandao_culture.users WHERE id=30` — 余额减少 | ⏳ 待测 |
| MT-26 | **签到二维码生成与扫码签到全链路（管理员+学员）**：管理员为排期生成签到二维码，学员扫码后 `appointments.status=1`，`checkin_qrcodes` 表有生成记录，`user_courses.attend_count+1` | F7 签到二维码 | 存在 status=1（招募中）的排期；user_id=30 对该排期有 status=0 的预约记录 | ① 后台→排课管理→选择排期→生成签到码→下载；② 学员扫码进入小程序签到页→确认签到 | `SELECT id, class_record_id, qrcode_url, status FROM tiandao_culture.checkin_qrcodes ORDER BY id DESC LIMIT 3` — 应有新记录；`SELECT status, checkin_time FROM tiandao_culture.appointments WHERE user_id=30 AND status=1 ORDER BY checkin_time DESC LIMIT 3` — status=1，checkin_time 非 NULL | ⏳ 待测 |
| MT-27 | **复训预约流程**：`attend_count >= 1` 的用户再次预约同一课程，应触发复训费支付（`is_retrain=1`），支付成功后 `appointments` 新增记录，`attend_count` 再次 +1 | F7 复训预约 | user_id=30 对某课程已有 `attend_count >= 1`（已上过课）；存在该课程的 status=1 排期；课程设置了 `retrain_price > 0` | 小程序→课程计划→选择已上过课的课程排期→点击预约→系统提示需支付复训费→完成支付 | `SELECT attend_count FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=<course_id>` — attend_count 增加；`SELECT is_retrain, status FROM tiandao_culture.appointments WHERE user_id=30 ORDER BY id DESC LIMIT 3` — 应有 is_retrain=1 记录 | ⏳ 待测 |
| MT-28 | **预览模式功能拦截验证**：`profile_completed=0` 的用户尝试购买课程/预约/申请大使，系统应拒绝并提示"请先完善个人资料" | F1 预览模式边界 | 准备一个 profile_completed=0 的测试账号（或将某账号临时设为0）| 用预览模式账号：① 点击购买课程→应被拦截；② 点击预约→应被拦截；③ 点击申请大使→应被拦截 | 三个操作均应弹出"请先完善个人资料"提示；`orders`、`appointments`、`ambassador_applications` 表均无新增记录 | ⏳ 待测 |
| MT-29 | **协议到期与续约**：管理员在协议管理页查看 30 天内到期的大使协议，并为到期大使手动续签 1 年，`contract_signatures.contract_end` 应更新，发送续签成功通知 | 协议到期管理 | 存在 `contract_end` 在未来 30 天内的 `contract_signatures` 记录 | 后台→协议管理→到期提醒→找到即将到期记录→点击"手动续签"→确认 1 年 | `SELECT id, user_id, contract_end, status FROM tiandao_culture.contract_signatures WHERE user_id=<大使id> ORDER BY id DESC LIMIT 1` — contract_end 应延长约 365 天 | ⏳ 待测 |

> ⚠️ **为什么 F5 apply 不自动化**：`ambassador.apply` 创建的申请需要管理员人工审批才能还原状态，无法自动清理。若自动化运行，第一次执行后 user_id=34 就会处于"待审核"状态，导致 F5B S5B.1 断言 `has_application===false` 永久失败。凡写操作无自动清理路径的场景，均应登记为 MT 手动项而非强行自动化。

---

### 规则 4：跨流程数据一致性追踪清单（每次新增测试信息时必须更新）

> **此清单记录在某个流程测试时发现的、需要在后续流程中再次核验的数据状态。**  
> AI 在执行每个流程验证时，**必须主动检查此清单**，对所有涉及当前流程的条目执行数据库验证。  
> 每当新测试发现跨流程依赖时，**必须立即将其追加到此清单**，不可遗漏。

#### 当前已知跨流程数据依赖

| # | 数据依赖描述 | 发现于 | 需在哪里验证 | 验证 SQL / 说明 | 状态 |
|---|------------|--------|------------|----------------|------|
| 1 | **密训班赠课 is_gift=1 完整性**：购买密训班(type=2)后，user_courses 中应同时有 is_gift=1 的初探班记录。当前 user_id=30 的 user_courses 仅 1 条(is_gift=0)，无赠送记录，说明尚未触发密训班购买场景 | F2 S2.3（我的课程 is_gift 计数=0） | **F10 S10.3** ★必验 | `SELECT uc_main.id as 主课程, uc_gift.id as 赠送课程 FROM orders o JOIN courses c ON o.related_id=c.id LEFT JOIN user_courses uc_main ON uc_main.order_id=o.id AND uc_main.is_gift=0 LEFT JOIN user_courses uc_gift ON uc_gift.source_order_id=o.id AND uc_gift.is_gift=1 WHERE o.pay_status=1 AND c.type=2` | ⏳ 待触发密训班购买后验 |
| 2 | **排期 booked_quota 一致性**：class_records.booked_quota 应与实际 appointments 表预约数一致。F7 验证时 id=10 booked_quota=1/actual=1 一致，其余均 0/0，全表 HAVING diff≠0 返回 0 行 | F2 S2.4（排期日历 booked_quota=0） | **F7 S7.1/S7.2** ★必验 | `SELECT cr.booked_quota, COUNT(a.id) as 实际预约数 FROM class_records cr LEFT JOIN appointments a ON a.class_record_id=cr.id AND a.status IN (0,1) WHERE cr.status=1 GROUP BY cr.id` | ✅ F7 已验证（2026-02-27），每次预约操作后仍需重验 |
| 3 | **密训班 included_course_ids 与实际赠课记录匹配**：courses.included_course_ids=[1] 已确认，但实际购买后 user_courses 中的赠课 course_id 必须与 included_course_ids 一致 | F2 S2.2b（密训班 included_course_ids=[1] 已确认） | **F10 S10.3** ★必验 | 与条目1同步验证：确认赠送的 user_courses.course_id 在 included_course_ids 数组内 | ⏳ 待触发密训班购买后验 |
| 4 | **用户30存在手动插入的已支付订单（奖励未发放）**：F3 数据库验证（2026-02-23）确认 user_id=30 存在 `TEST20260215001`（pay_status=1，支付时间 2026-02-15），但该订单号格式不符规范（应为 ORD+日期+8位随机数），为手动插入测试数据，未经支付回调，导致 is_reward_granted=0、无 merit/cash 积分记录、推荐人余额为0。**S3.1 接口因 LIMIT 10 + 时间排序**，该已支付订单排在第11位，未出现在接口返回中。需通过真实支付回调验证：referee_confirmed_at、is_reward_granted=1、merit/cash 积分入账逻辑 | F3 S3.1（订单列表+DB验证） | **F3 S3.2**、**F10 S10.4**、**F10 S10.5**、**F4 奖励验证** | 执行测试场景A（微信支付回调全链路）或手动调用支付回调云函数，验证完整奖励发放链路 | ⚠ 手动插入订单未触发回调，需补充真实支付场景 |

#### 清单使用规则

1. **执行 F7 时**：必须额外执行条目 2 的验证 SQL，确认 booked_quota 与实际预约数一致
2. **执行 F10 时**：必须额外执行条目 1、3 的验证 SQL，确认密训班赠课完整性
3. **执行 F3/F4/F10 时**：必须注意条目 4，user_id=30 存在手动插入的已支付订单 TEST20260215001（pay_status=1），但未走支付回调，奖励发放逻辑未触发（is_reward_granted=0，推荐人积分=0），需通过真实支付场景 A（支付回调全链路）补充验证；同时注意 S3.1 接口因 LIMIT 10 不返回该历史订单
4. **每次测试发现新的跨流程依赖时**：立即追加到此表，不得推迟

---

### 规则 5：每步验证完成后，必须将测试结果写入业务流程测试用例文档

> **目的**：积累可供与《需求文档-V2.md》逐条对比的完整测试用例记录，确保每条业务规则都有测试覆盖证据。

**文档路径**：`admin/BUSINESS-FLOW-CASES.md`

**触发时机**：每完成一个步骤（Sx.x）的 DB 交叉验证后，**立即**将结果追加/更新到该文档。

**写入格式（每个步骤一个二级标题区块）**：

```markdown
## Fx Sx.x — 步骤名称

| 字段 | 内容 |
|------|------|
| **接口/操作** | 云函数名.action |
| **业务场景** | 用户在什么情景下触发此操作 |
| **前置条件** | 测试数据状态（如 user_id=30, pay_status=0 等） |

### 业务规则 × 需求对照

| # | 业务规则 | 需求章节 | 期望行为 | 实测结果 | 结论 |
|---|---------|---------|---------|---------|------|
| 1 | 规则描述 | 需求X.X.X | 期望值 | 实测值 | ✓/✗/⚠ |

### 数据库验证摘要

| 验证项 | 接口值 | DB 实际值 | 一致性 |
|--------|--------|----------|--------|
| 字段/计数 | 接口返回 | DB查询结果 | ✓/✗ |

### 未覆盖场景（需补充）

- [ ] 场景描述（补充方式）

### 跨流程影响

- 若有跨流程数据依赖，注明「已记录到规则4清单 #N」
```

**写入要求**：
1. 结论列统一使用 ✓（通过）/ ✗（失败）/ ⚠（待定/数据不足）
2. "需求章节"必须填写真实章节号（如`需求3.1.2`），不可留空
3. 同一步骤多次测试时，追加新一行到"数据库验证摘要"，不覆盖历史记录
4. 若当前步骤数据不满足某条规则的前提，在"未覆盖场景"中明确记录

---

### 规则 6：发现未覆盖场景时，必须给出基于《后端API接口文档.md》的完整手动测试步骤

> **触发时机**：规则 3 的"未覆盖场景"列表中出现任意待补充条目时，AI **必须立即**（无需用户再次提问）给出对应的手动测试步骤，不可仅说"建议手动测试"而不给出细节。

**参考文档**：`后端API接口文档.md`（位于仓库根目录）  
涵盖所有云函数接口的请求参数、业务逻辑、响应字段，AI 必须从该文档中找到对应接口后再输出步骤。

#### 步骤输出格式（AI 必须严格遵守）

```
## 手动测试步骤 — [场景名称]

**场景目的**：[用一句话描述要覆盖的业务规则]
**对应 API**：`后端API接口文档.md` § [章节号] [接口名]
**前置条件**：[列出当前 DB 状态，如 merit_points=X, stock_quantity=Y]

### 第 N 步：[操作名称]
- **云函数/接口**：fn='[云函数名]', act='[action名]'
- **入参**（基于当前 DB 真实数据，不可硬编码）：
  ```json
  {
    "[参数名]": [从 DB 查出的真实值],
    ...
  }
  ```
- **预期行为**（来自 API 文档业务逻辑）：[描述接口应做什么]
- **操作前快照 SQL**（AI 执行，记录变更前基线）：
  ```sql
  [SQL]
  ```

### 操作后验证（用户完成操作后，AI 执行以下 SQL 并比对）
| 验证项 | 期望值（来自 API 文档） | SQL |
|--------|------------------------|-----|
| [字段] | [期望变化，如 merit_points 减少 X] | [SQL] |
| ...    | ...                    | ... |

### 通过标准
- [ ] [条件1，如 exchange_no 已写入 mall_exchange_records]
- [ ] [条件2，如 sold_quantity 正确递增]
```

#### AI 生成手动测试步骤前的必要准备

在输出步骤前，AI **必须先执行以下操作**，不得跳过：

1. **查询当前 DB 状态**：确认涉及的字段当前值（余额、库存等），作为"操作前快照"
2. **从 API 文档中找到对应接口**：确认接口的参数名称、必填项、业务逻辑分支
3. **用真实 DB 数据填充参数**：所有 id 类参数（goods_id、order_no、course_id 等）必须来自数据库查询结果，不得使用示例值

#### 各流程对应的关键手动测试场景及 API 来源

| 流程 | 未覆盖场景 | 对应 API 文档章节 | 云函数调用 |
|------|-----------|-----------------|-----------|
| F3 | 实际支付全链路（pay_status 0→1，奖励发放） | §3.1 创建订单、§3.3 发起支付、§3.4 支付回调 | `order.createOrder` → `order.pay` |
|| F3 | ~~商城兑换写操作~~（**已自动化 S3.6**：功德分足时执行，不足时验证错误格式） | §6.13 创建兑换订单 | `order.exchangeGoods` |
| F4 | 功德分余额 = 明细净值交叉验证 | §4.x 积分相关 | `user.getMeritPoints` + DB 验证 |
| F5 | 大使升级（准青鸾→青鸾，协议类型） | §9.x 大使升级 | `ambassador.upgrade` |
| F7 | 预约操作后 booked_quota 正确递增 | §5.1 创建预约 | `course.createAppointment` |
| F10 | 密训班赠课 is_gift=1 完整性 | §3.4 支付回调 type=1 | 购买密训班后验证 |

---

### 规则 8：测试用例复用与优化原则

> **目的**：避免重复验证已通过的场景，同时确保弱覆盖步骤持续加强。

#### 原则 A：已手动验证的写操作场景不必重复自动化

若某个写操作场景已在 `BUSINESS-FLOW-CASES.md` 中标记为 `✅ 已验证 YYYY-MM-DD`，则：
- **无需**在 `integration-test.html` 中新增对应的条件写步骤
- 已验证记录即为永久测试证据
- 例外：若该写操作有**清理路径**（如兑换→撤销），可保留自动化

#### 原则 B：单断言步骤（仅1条 biz）属于覆盖不足，优先补充

当某个步骤只有1条 biz 断言（`p:raw.success===true`）时，须按如下优先级补充：
1. **字段存在性** — 关键字段不为 null/undefined
2. **枚举合法性** — status/type 等枚举字段在合法值域内
3. **业务规则** — 与需求文档对应的具体数值约束（如冻结积分=1688）
4. **跨流程追踪** — 补充规则4清单中指定该步骤的验证

#### 原则 C：优化已验证流程的测试用例，指向未覆盖场景

对于某个流程已完成手动验证后：
- 将原有"只验证接口连通性"的 biz 断言，**替换或补充**为真正的业务规则验证
- 调整 `rules` 计数反映实际覆盖数

#### 判断表

| 场景 | 处理方式 |
|------|---------|
| 写操作已手动验证（BUSINESS-FLOW-CASES.md 有 ✅） | 不新增自动化，保留手动记录即可 |
| 写操作有完整清理路径 | 可保留/新增自动化 |
| 只读接口只有1条 biz 断言 | 必须补充字段/枚举/业务规则断言 |
| 跨流程追踪条目（规则4）指向当前步骤 | 必须在该步骤 biz 中加入对应验证 |

---

### 规则 7：每次流程验证完成后，必须执行"用例完善检查"和"已完成状态标注"

> **触发时机**：完成规则1（DB验证）+ 规则3（覆盖分析）+ 规则5（用例写入）后，AI **必须立即**执行本规则，无需用户提醒。

本规则包含两项强制动作，缺一不可：

#### 动作 A：完善 `integration-test.html` 测试步骤

当规则3的"未覆盖场景"中出现**可通过自动化覆盖**的场景时，AI必须：

1. 读取 `integration-test.html` 中对应流程的 `steps` 数组
2. 评估是否可通过新增 `biz` 断言或新增 `step` 来覆盖该场景
3. 若可改进，**立即修改** `integration-test.html`，并告知用户变更了哪些内容
4. 修改后同步更新该流程的 `rules` 计数

**可改进 vs 不可改进判断标准：**

|| 场景类型 | 处理方式 |
||---------|---------|
|| 可通过读接口 + biz 断言覆盖 | 立即追加到对应 step 的 biz 数组 |
|| 需要写操作（CREATE/UPDATE） | 参照 S3.6 模式添加条件写步骤 |
|| 需要真实支付 / 微信回调 | 列入规则6手动测试清单，**不修改** HTML |
|| 需要换测试用户 | 记录到规则4清单，标注"需更换用户验证" |
|| 属于边界异常数据 | 列入规则6手动测试步骤，补充前置条件说明 |

#### 动作 B：在 `BUSINESS-FLOW-CASES.md` 标注已完成状态

对已完成 DB 交叉验证的每个步骤，**立即**将结论更新为下列格式：

```markdown
## ✅ Fx Sx.x — 步骤名称（已验证 YYYY-MM-DD）

### 未覆盖场景（需补充）
- [x] ✅ 已自动化：已在 integration-test.html Sx.x 中覆盖（YYYY-MM-DD）
- [ ] 待覆盖场景描述（补充方式）
```

**标注规则：**

1. 步骤标题加 ✅ 前缀 + `（已验证 YYYY-MM-DD）` 后缀，表示该步骤已完成验证
2. "未覆盖场景"列表中：
   - 已自动化的场景：`- [x]` + ✅ 说明覆盖方式和日期
   - 已手动测试并通过：`- [x]` + 通过日期
   - 仍待覆盖：保留 `- [ ]`，更新补充方式
3. 已完成的步骤的"结论"列统一从 ⚠ 更新为 ✓ 或 ✗

---

### 规则 9：未覆盖场景必须在当前流程内补完，不得跳过进入下一流程

> **优先级最高，与规则0同级。AI 助手和用户均必须遵守。**

#### 核心原则

**⛔ 每个流程的「未覆盖场景汇总」中，凡属于"可自动化"的场景，必须在当前流程验证周期内全部补完（新增 biz 断言或新增 step），并重新运行测试全部通过后，才允许进入下一流程。**

#### 场景分类及处理要求

| 分类 | 判断标准 | 处理方式 | 是否阻塞下一流程 |
|------|---------|---------|:---:|
| **A. 可自动化-读接口** | 能通过现有或新增 step 的 biz 断言覆盖（仅需调用只读 API） | AI 立即在 `integration-test.html` 中新增 biz/step | ✅ 阻塞 |
| **B. 可自动化-条件写** | 能通过条件写步骤覆盖（参照 S3.6 模式，有前置判断和清理路径） | AI 立即新增条件写 step | ✅ 阻塞 |
| **C. 需换测试用户** | 当前 user 数据不满足场景前提，需要换 user_id 或使用边界 user | AI 新增边界子流程（如 F1B/F5B 模式），在同一轮验证中完成 | ✅ 阻塞 |
| **D. 需补充测试数据** | DB 中缺少满足场景的数据（如缺 feedback_type=2~5 的反馈） | AI 通过 MCP `executeWriteSQL` 插入测试数据后，新增断言验证 | ✅ 阻塞 |
| **E. 需真机/人工操作** | 涉及微信支付回调、真机扫码、小程序页面交互等 | 登记到规则 M 手动测试待办清单 | ❌ 不阻塞 |
| **F. 需等待前置流程** | 需其他流程先完成才有数据（如密训班赠课需 F10） | 登记到规则 4 跨流程追踪清单 | ❌ 不阻塞 |

#### 执行流程（AI 必须严格按顺序）

```
1. 完成 DB 交叉验证 + 覆盖分析 → 输出「未覆盖场景汇总」
2. 对每条未覆盖场景进行分类（A/B/C/D/E/F）
3. 对所有 A/B/C/D 类场景：
   a. 若需测试数据 → 先通过 MCP 插入
   b. 在 integration-test.html 中新增 biz 断言或 step
   c. 更新 rules 计数
4. 告知用户「请刷新页面重新运行 FX 流程」
5. 用户发送新报告后，AI 验证新增断言全部通过
6. 在 BUSINESS-FLOW-CASES.md 中将已覆盖场景标记 [x] ✅
7. 确认「未覆盖场景汇总」中仅剩 E/F 类 → 允许进入下一流程
```

#### 违规情形

| 违规操作 | 后果 |
|---------|------|
| A/B/C/D 类场景未补完就标记流程 ✅ | 弱覆盖场景永远得不到验证，回归测试无效 |
| 仅在 BUSINESS-FLOW-CASES.md 中「记录」而不实际新增自动化 | 文档与测试脱节，下次运行仍无覆盖 |
| 跳过 D 类（需补数据）直接进下一流程 | 枚举/边界场景长期空白 |

---

### 规则 2：自动化测试的 Mock 数据必须符合真实数据

`integration-test.html` 中使用的测试参数（`params`）和 CTX 上下文数据必须与数据库中的真实数据匹配，**不可使用不存在的 ID 或过期的值**。

#### 修改 Mock 数据前，AI 必须先查询数据库确认

| Mock 字段 | 当前值 | 验证 SQL |
|-----------|--------|---------|
| `U.id` | `30` | `SELECT id, real_name FROM tiandao_culture.users WHERE id=30` |
| `U._openid` | `2017456901935075328` | `SELECT _openid FROM tiandao_culture.users WHERE id=30` |
| `course_id` 参数 | `1` | `SELECT id, name FROM tiandao_culture.courses WHERE id=1 AND status=1` |
| `getCalendarSchedule` 日期范围 | `2026-03-01~03-31` | `SELECT MIN(class_date),MAX(class_date) FROM tiandao_culture.class_records WHERE status=1` |
| `getContractTemplate` level 参数 | `ambassador_level:1` | `SELECT level FROM tiandao_culture.contract_templates WHERE status=1` |

#### Mock 数据校验规则

1. **测试用户必须存在**：`U.id` 对应的用户必须在 `users` 表中存在且 `profile_completed=1`
2. **课程 ID 必须有效**：`course_id` 参数必须是 `courses` 表中 `status=1` 的记录
3. **日期范围必须有数据**：`getCalendarSchedule` 的日期范围内必须有实际排期
4. **等级参数必须存在配置**：`ambassador_level` 参数必须在 `ambassador_level_configs` 表中有对应行
5. **订单号必须来自真实数据**：`order_no` 参数必须从 `CTX.firstOrder` 动态获取，不可硬编码

#### 发现 Mock 数据与数据库不符时的处理

```
1. AI 查询数据库获取正确值
2. AI 更新 integration-test.html 中对应的 U 对象或 params
3. 重新运行测试
4. 告知用户更新了哪些 Mock 数据及原因
```

---

### 规则 4：跨流程数据一致性追踪清单（每次验证前必须检视）

记录在某流程测试中发现的、必须在指定后续流程中二次确认的数据一致性依赖项。AI 助手在验证任意流程时，必须主动检视本列表中所有目标列包含该流程的行，不可等待用户提醒。每次覆盖分析发现新的跨流程依赖时，AI 必须立即将其追加到本表。

| # | 来源 | 目标 | 追踪项描述 | 状态 |
|---|------|------|-----------|------|
| T1 | F2 S2.2d | F10 S10.3 | user_id=30 的 course_id=1 记录 source_order_id=NULL，订单来源不明。F10 需确认是否有 pay_status=1 的订单，否则影响密训班赠课验证前提 | 待 F10 验证 |
| T2 | F2 S2.3 | F10 S10.3 | 密训班赠课 is_gift=1 完整性：user_id=30 的 user_courses 无 is_gift=1 记录，F10 需验证密训班购买后赠课链路（需补充已支付密训班订单数据） | 待 F10 验证 |
| T3 | F2 S2.4 | F7 S7.1 | 排期 booked_quota 一致性：F2 时所有排期 booked_quota=0，F7 预约后需验证 booked_quota 正确递增，且与 appointments 实际记录数一致 | 待 F7 验证 |
| T4 | F3 S3.1 | F10 S10.4/S10.5 | user_id=30 所有订单均为 pay_status=0（未支付），无法验证 is_referee_confirmed=1 锁定逻辑及推荐人奖励发放，F10 前需补充已支付订单测试数据 | 数据缺失，F10 前需处理 |
| T5 | F3 S3.5 | — | 兑换记录 sold_quantity=3 与 mall_goods.sold_quantity=3 一致，F3 DB 验证已确认 | 已关闭 |

T1/T2/T4 验证 SQL（AI 执行 F10 时直接运行）：

```sql
-- T1/T2: 购买记录溯源（source_order_id 和 is_gift）
SELECT uc.id, uc.course_id, uc.is_gift, uc.source_order_id, o.pay_status, o.order_no
FROM tiandao_culture.user_courses uc
LEFT JOIN tiandao_culture.orders o ON uc.source_order_id = o.id
WHERE uc.user_id = 30;

-- T4: 确认是否存在已支付订单
SELECT order_no, pay_status, order_name
FROM tiandao_culture.orders WHERE user_id = 30 AND pay_status = 1;
```

AI 追加格式：在上表末尾新增一行，格式 `| T{N} | F{来源} S{步} | F{目标} S{步} | 描述 | 状态 |`，状态取值：待 FX 验证 / 数据缺失 / 已关闭 / 发现 BUG。

---

## 概述

`integration-test.html` 是按 **完整业务链路** 组织的端到端集成测试工具，重点验证：

- **跨模块接口串联** — 每个流程串联多个模块的 API，模拟真实用户操作序列
- **多表数据一致性** — 为每步生成关联验证 SQL，交叉校验 users / orders / user_courses / merit_points_records / cash_points_records 等多表数据
- **业务规则合规性** — 基于需求文档 V2.5 和后端 API 文档的业务规则逐项校验

**数据来源文档：**
- `需求文档-V2.md` — 完整业务流程定义、奖励规则、推荐人机制
- `后端API接口文档.md` — API 接口规范、字段定义

---

## 快速开始

### 1. 启动测试页面

```bash
cd admin
npx serve .
# 或
python -m http.server 8000
```

浏览器打开 `http://localhost:8000/integration-test.html`

### 2. 运行测试

- **运行全部流程**：点击 "▶ 运行全部业务流程" 按钮
- **运行单个流程**：在流程卡片上点击，仅运行该流程
- **失败停止**：勾选后遇到第一个失败暂停
- **详情/SQL**：勾选后展开每步的字段校验、业务规则检查、验证 SQL

### 3. 数据库验证

测试完成后点击 "🗄️ DB验证SQL" 按钮打开侧边面板：
- 查看所有步骤生成的关联验证 SQL
- 点击 "复制全部" 一键复制
- 请 AI 助手通过 MCP `executeReadOnlySQL` 执行，比对接口返回与数据库实际值

---

## 10 大业务流程详解

### 流程 1: 👤 用户资料 · 推荐人 · 资格验证

```
getProfile → updateProfile → getRefereeInfo → searchReferees → getReferralStats
```

**测试目的**：验证用户资料的完整 CRUD 链路，以及推荐人搜索的资格过滤。

**涉及表**：`users`, `referee_change_logs`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 已完善资料用户 `profile_completed=1` | 需求 3.1.1 |
| 2 | 推荐人不能是用户自己（防循环引用） | 需求 2.5 |
| 3 | 搜索推荐人列表只返回准青鸾及以上 (`ambassador_level≥1`) | 需求 2.2 |
| 4 | 推荐人必须有效（准青鸾 level=1 只能推荐初探班） | 需求 2.5 |

**多表验证 SQL**：
```sql
-- 用户资料完整性
SELECT id, _openid, real_name, phone, ambassador_level, profile_completed,
  merit_points, cash_points_available, cash_points_frozen,
  referee_id, is_referee_confirmed, referee_updated_at
FROM tiandao_culture.users WHERE id = 30
```

---

### 流程 2: 📚 课程浏览 · 详情 · 购买条件验证

```
getList → getDetail → getMyCourses → getCalendarSchedule → getCaseList → getCaseDetail → getMaterialList
```

**测试目的**：验证课程从列表到详情的完整浏览链路，确认购买状态标记、密训班包含关系正确。新增 getCaseDetail 详情接口验证。

**涉及表**：`courses`, `user_courses`, `class_records`, `academy_cases`, `academy_materials`

**案例模块新增验证步骤（2026-03-01 变更）**：

| 编号 | 类型 | 接口 | 描述 |
|------|------|------|------|
| S2.X1 | 📖 读操作 | `getCaseList` | 验证列表返回全字段（新增 category_label, badge_theme, avatar_theme, student_surname, student_desc, quote, achievements, is_featured, video_url, images, cover_image） |
| | 期望 | `category_label` | 非空字符串（如有 category） |
| | 期望 | `achievements` | Array 类型（已解析 JSON） |
| | 期望 | `cover_image` | 非空字符串（images[0] 或 student_avatar） |
| | 期望 | `student_avatar` | HTTPS CDN URL（非 cloud:// fileID） |
| | 验证 SQL | `SELECT id, category, category_label, student_surname, student_desc, avatar_theme, badge_theme, quote, achievements, is_featured FROM tiandao_culture.academy_cases WHERE status=1 LIMIT 3` | 字段应非 NULL（后台已可设置） |
| S2.X2 | 📖 读操作 | `getCaseDetail` | 用列表第一个案例 ID 调用详情接口 |
| | 期望 | `student_avatar` | HTTPS CDN URL（非 cloud:// fileID） |
| | 期望 | `video_url` | HTTPS CDN URL 或空（非 cloud:// fileID） |
| | 期望 | `images` | Array 类型，每项为 HTTPS URL |
| | 期望 | `achievements` | Array 类型 |
| | 期望 | `view_count` | >= 1（调用详情后自增） |
| | 验证 SQL | `SELECT id, view_count, student_avatar, video_url, images, achievements FROM tiandao_culture.academy_cases WHERE id=<测试id>` | view_count 应比调用前 +1 |
| S2.X3 | 📖 读操作 | `getCaseList` (admin) | 后台案例列表应包含全字段 + courseId 过滤生效 |
| | 期望 | courseId 过滤 | 传入 courseId 后返回列表仅含该课程的案例 |
| S2.X4 | 📖 读操作 | `getMyCourses` | 验证返回数据包含 `expire_at` 字段 |
| | 期望 | `expire_at` | 字段存在（datetime 或 NULL），NULL 表示永久有效 |
| | 验证 SQL | `SELECT id, course_id, expire_at, buy_time FROM tiandao_culture.user_courses WHERE user_id=30 AND status=1` | expire_at 与接口返回一致 |

> ⚠️ **跨流程追踪提示（验证此流程后必须更新规则4清单）**  
> - S2.3 `is_gift` 统计为 0 → 说明尚无密训班购买场景，**密训班赠课 is_gift=1 完整性验证已延至 F10 S10.3**  
> - S2.4 `booked_quota=0` 基线已记录 → **F7 执行预约操作后须重新验证 booked_quota 一致性（见规则4 条目2）**

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 课程必含 id/name/type/current_price | 需求 3.1.2 |
| 2 | 课程类型 type 仅为 1(初探)/2(密训)/3(咨询) | 需求 4.2 |
| 3 | 密训班(type=2) 应有 `included_course_ids` 标记包含初探班 | 需求 3.1.2 |
| 4 | 我的课程应关联 user_courses 与 courses 表 | 需求 3.1.3 |

**多表验证 SQL**：
```sql
-- 课程购买状态交叉验证
SELECT c.id, c.name, c.type, c.current_price,
  (SELECT COUNT(*) FROM tiandao_culture.user_courses uc
   WHERE uc.course_id=c.id AND uc.user_id=30 AND uc.status=1) as is_purchased
FROM tiandao_culture.courses c WHERE c.status=1
```

---

### 流程 3: 🛒 订单 · 商城兑换 · 多表数据一致性

```
getMyOrders → getDetail(已支付优先) → getMallCourses → getMallGoods → getExchangeRecords
  → [写]exchangeGoods → [写]cancelExchange → [后台]getExchangeList → [后台写]confirmPickup
```

**测试目的**：验证兑换全状态链路——创建兑换(status=1)、撤销兑换(status=3)、后台查看记录、后台确认领取(status=2)，以及各步骤的多表一致性。

**涉及表**：`orders`, `user_courses`, `merit_points_records`, `cash_points_records`, `mall_goods`, `mall_exchange_records`

> ⚠️ **跨流程追踪提示（见规则4 条目4）**  
> S3.2 现已优先取 `pay_status=1` 的已支付订单（`firstPaidOrder`）验证；若无已支付订单，规则1/2自动跳过并提示。  
> S3.6 `exchangeGoods` 为**条件写操作**：功德分不足时验证错误信息格式；功德分充足时验证多表一致性（source=6、sold_quantity 递增）。  
> S3.7 `cancelExchange` 需要 status=1 记录；撤销后 status=3，积分/功德分回滚，库存恢复。  
> S3.8 后台 `getExchangeList` 为只读查询，验证 user_name、user_phone 字段完整性。  
> S3.9 `confirmPickup` 需要 status=1 记录；确认后 status=2，pickup_time/pickup_admin_id 应有值。

**关键业务规则**：
|| # | 规则 | 来源 |
||---|------|------|
|| 1 | 已支付订单 `referee_confirmed_at` 应有值 | 需求 2.3 阶段3 |
|| 2 | 已支付订单 `is_reward_granted` 应为 0 或 1 | 需求 2.4 |
|| 3 | 订单详情应含推荐人信息和奖励发放状态 | 需求 3.2.5 |
|| 4 | 商城商品 `merit_points_price > 0` | 需求 3.1.7.2 |
|| 5 | 商品 `stock_quantity ≥ -1`（-1 表示无限库存） | 需求 3.1.7.2 |
|| 6 | **[BUG-1 回归]** 兑换记录对应 `merit_points_records.source = 6` | 数据一致性 |
|| 7 | 兑换记录 `status` 应为 1(已兑换)/2(已领取)/3(已取消) | 需求 3.1.7.2 |
|| 8 | `merit_points_used + cash_points_used = total_cost` | 需求 3.1.7.2 |
|| 9 | 功德分不足时应返回明确错误信息（非 500） | 需求 3.1.7.2 |
| 10 | 兑换成功后 `sold_quantity` 正确递增、`stock_quantity` 正确递减 | 需求 3.1.7.2 |
| 11 | 撤销兑换后 status=3，积分/功德分回滚，库存恢复 | §6.13b |
| 12 | 撤销后 merit_points_records/cash_points_records 应新增退还记录 | §6.13b |
| 13 | 后台 getExchangeList 返回字段应含 user_name、user_phone | §6.20 |
| 14 | 后台确认领取后 status=2，pickup_time/pickup_admin_id 应有值 | §6.21 |
| 15 | status=2(已领取) 和 status=3(已取消) 不可再次操作 | §6.21 |

**多表验证 SQL**：
```sql
-- 订单 + 推荐人 + 奖励记录（已支付订单）
SELECT o.order_no, o.final_amount, o.pay_status, o.referee_id, o.is_reward_granted, o.referee_confirmed_at,
  r.real_name as 推荐人, r.ambassador_level as 推荐人等级,
  (SELECT COUNT(*) FROM tiandao_culture.merit_points_records mp WHERE mp.order_no=o.order_no) as 功德分记录,
  (SELECT COUNT(*) FROM tiandao_culture.cash_points_records cp WHERE cp.order_no=o.order_no) as 积分记录
FROM tiandao_culture.orders o
LEFT JOIN tiandao_culture.users r ON o.referee_id=r.id
WHERE o.user_id=30 AND o.pay_status=1

-- [BUG-1 回归] 兑换 source=6 验证
SELECT er.exchange_no, er.goods_name, er.merit_points_used, er.status,
  mp.source as 功德分来源_应为6, mp.amount, mp.balance_after
FROM tiandao_culture.mall_exchange_records er
LEFT JOIN tiandao_culture.merit_points_records mp ON mp.exchange_no = er.exchange_no
WHERE er.user_id = 30 ORDER BY er.created_at DESC LIMIT 5

-- 兑换后库存与兑换记录数量一致性（status=3 已取消不计入）
SELECT mg.id, mg.goods_name, mg.sold_quantity,
  COUNT(er.id) as 兑换记录数,
  mg.sold_quantity - COUNT(er.id) as 差额_应为0
FROM tiandao_culture.mall_goods mg
LEFT JOIN tiandao_culture.mall_exchange_records er ON er.goods_id=mg.id AND er.status IN (1,2)
WHERE mg.status=1 GROUP BY mg.id

-- S3.7 撤销兑换后余额回滚验证
SELECT er.exchange_no, er.status, er.merit_points_used, er.cash_points_used,
  (SELECT mp.amount FROM tiandao_culture.merit_points_records mp WHERE mp.exchange_no=er.exchange_no AND mp.type=1 ORDER BY mp.id DESC LIMIT 1) as 功德分退还,
  (SELECT cp.amount FROM tiandao_culture.cash_points_records cp WHERE cp.remark LIKE '%撤销兑换%' AND cp.type=3 ORDER BY cp.id DESC LIMIT 1) as 积分退还
FROM tiandao_culture.mall_exchange_records er
WHERE er.user_id=30 AND er.status=3
ORDER BY er.created_at DESC LIMIT 3

-- S3.9 后台确认领取后 pickup 字段验证
SELECT exchange_no, status, pickup_admin_id, pickup_time, remark
FROM tiandao_culture.mall_exchange_records
WHERE status=2 ORDER BY pickup_time DESC LIMIT 5

-- ✏️ S3.10 [2026-03-01 新增] 购买课程后 attend_count 初始值验证（初始值应为 0）
SELECT uc.id, uc.user_id, uc.course_id, uc.attend_count, uc.is_gift, uc.buy_time
FROM tiandao_culture.user_courses uc
WHERE uc.user_id = 30
ORDER BY uc.id DESC LIMIT 5
-- 期望：attend_count = 0（购买成功后未签到，初始值为 0）
-- ⚠️ 旧数据（2026-03-01 前购买）attend_count=1，属遗留问题，不计入本步骤

-- ✏️ S3.11 [2026-03-01 新增] 课程有效期 expire_at 验证（validity_days 接入）
SELECT c.id, c.name, c.validity_days,
  uc.id as uc_id, uc.buy_time, uc.expire_at,
  CASE
    WHEN c.validity_days IS NULL THEN '永久有效（NULL）'
    WHEN uc.expire_at IS NULL THEN '⚠️ 有效期未写入（Bug）'
    ELSE CONCAT('有效', c.validity_days, '天，截止', DATE_FORMAT(uc.expire_at,'%Y-%m-%d'))
  END as 有效期状态
FROM tiandao_culture.user_courses uc
JOIN tiandao_culture.courses c ON c.id = uc.course_id
WHERE uc.user_id = 30
ORDER BY uc.id DESC LIMIT 5
-- 期望：validity_days 不为 NULL 的课程，expire_at = buy_time + validity_days 天（误差 < 1分钟）
-- validity_days 为 NULL 的课程，expire_at 应为 NULL（永久有效）
```

**⚠️ S3.10 断言说明（attend_count 初始值修复 2026-03-01）**：
> - 修复前：`payment.js` 创建 `user_courses` 时 `attend_count = 1`（Bug）
> - 修复后：`attend_count = 0`，只有签到后才 +1
> - 验证目标：最新购买记录（buy_time ≥ 2026-03-01）的 `attend_count` 应为 **0**
> - 前端"可复训"标签：需 `attend_count >= 1` 才展示，购买后初始不展示

**⚠️ S3.11 断言说明（课程有效期 validity_days 接入 2026-03-01，必填强制 2026-03-01）**：
> - 字段规则：`courses.validity_days` 现为**必填正整数**（天数，禁止 NULL），后台新建/编辑均强制填写
> - 购课写入：支付回调 `payment.js` 写入 `user_courses.expire_at = buy_time + validity_days 天`
> - 兑换课程：`exchangeCourse.js` 同样读取 `courses.validity_days` 计算有效期；`validity_days = NULL` 的旧课程兑换时保留原 `expire_at` 不覆盖
> - 验证目标：所有新购/兑换记录 `expire_at` 应有值且 ≈ `buy_time + validity_days 天`
> - 管理端：`createCourse` / `updateCourse` 云函数如传入 `validityDays <= 0` 或 `null`，返回 `paramError`

**手动测试步骤（S3.7 撤销兑换）**：
> 参考 §6.13b（见 `后端API接口文档.md`）
1. 小程序 `pages/ambassador/exchange-records/index` 找到一条 status=1（已兑换）记录
2. 点击「撤销兑换」→ 确认弹窗
3. 验证 DB：`mall_exchange_records.status=3`，`users` 积分/功德分回滚，`mall_goods.stock_quantity` 恢复

**手动测试步骤（S3.8/S3.9 后台兑换管理）**：
> 参考 §6.20/§6.21（见 `后端API接口文档.md`）
1. 打开后台 `admin/pages/order/exchange-records.html`（侧边栏"订单管理 → 兑换管理"）
2. 默认列出全部记录，验证 `user_name`、`user_phone`、`goods_name`、`exchange_no` 字段完整
3. 筛选"待领取"，找到一条 status=1 记录，现场核对用户姓名与兑换单号
4. 点击「确认领取」→ 填写备注 → 确认
5. 验证 DB：`mall_exchange_records.status=2`，`pickup_time`/`pickup_admin_id`/`remark` 应有值
6. 再次点击「确认领取」→ 应报错"该订单已确认领取，请勿重复操作"（规则15回归）

---

### 流程 4: 💰 功德分 · 积分 · 提现 · 余额一致性验证

```
getMeritPoints → getMeritPointsHistory → getCashPoints → getCashPointsHistory → getWithdrawRecords → [交叉验证x2]
```

**测试目的**：这是最关键的数据一致性验证流程。验证 `users` 表中的余额字段与 `merit_points_records` / `cash_points_records` 明细表的净值是否一致。

**涉及表**：`users`, `merit_points_records`, `cash_points_records`, `withdrawals`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 功德分余额 ≥ 0 | 需求 1.4 |
| 2 | 冻结积分 ≥ 0 | 需求 3.1.7.3 |
| 3 | 可提现积分 ≥ 0 | 需求 3.1.7.3 |
| 4 | **users.merit_points = SUM(merit_points_records.amount)** | 数据一致性 |
| 5 | **users.cash_points_frozen = SUM(type=1) + SUM(type=2)** | 数据一致性 |
| 6 | **users.cash_points_available = SUM(type=2) + SUM(type=3) + SUM(type=5) + SUM(type=6)** | 数据一致性 |
| 7 | 提现申请：写 type=3(amount<0)，available↓，pending↑ | 需求 3.1.7.3 |
| 8 | 标记已转账：写 type=4(amount=0)，pending↓，status=2，invoice_file_id 有值 | 需求 3.1.7.3 |
| 9 | 驳回提现：写 type=5(amount>0)，pending↓，available↑，status=3 | 需求 3.1.7.3 |
| 10 | 工作流简化：管理员可直接从 status=0 发起驳回或标记已转账，无冗余审核步骤 | 业务需求（2026-02-27 简化） |

**★ 核心验证 SQL**：
```sql
-- 功德分余额 vs 明细净值
SELECT u.id, u.real_name,
  u.merit_points as 账户余额,
  COALESCE(SUM(mp.amount), 0) as 明细净值,
  u.merit_points - COALESCE(SUM(mp.amount), 0) as 差额
FROM tiandao_culture.users u
LEFT JOIN tiandao_culture.merit_points_records mp ON mp.user_id=u.id
WHERE u.id = 30 GROUP BY u.id

-- 积分各字段 vs 明细分类汇总（type 含义：1=冻结获得 2=解冻 3=提现申请扣减 4=提现成功通知 5=提现失败退回 6=系统调整）
SELECT u.id,
  u.cash_points_frozen as 冻结余额,
  u.cash_points_available as 可用余额,
  u.cash_points_pending as 提现中余额,
  SUM(CASE WHEN cp.type=1 THEN cp.amount ELSE 0 END) as 冻结获得,
  SUM(CASE WHEN cp.type=2 THEN cp.amount ELSE 0 END) as 解冻,
  SUM(CASE WHEN cp.type=3 THEN cp.amount ELSE 0 END) as 提现申请扣减,
  SUM(CASE WHEN cp.type=4 THEN cp.amount ELSE 0 END) as 提现成功通知,
  SUM(CASE WHEN cp.type=5 THEN cp.amount ELSE 0 END) as 提现失败退回,
  SUM(CASE WHEN cp.type=6 THEN cp.amount ELSE 0 END) as 系统调整
FROM tiandao_culture.users u
LEFT JOIN tiandao_culture.cash_points_records cp ON cp.user_id=u.id
WHERE u.id = 30 GROUP BY u.id

-- 提现全链路验证：申请→成功/驳回流水完整性
SELECT w.withdraw_no, w.amount, w.status,
  w.transfer_time, w.invoice_file_id,
  (SELECT cp.type FROM tiandao_culture.cash_points_records cp
   WHERE cp.withdraw_no=w.withdraw_no AND cp.type=3 LIMIT 1) as 申请扣减记录_type3,
  (SELECT cp.type FROM tiandao_culture.cash_points_records cp
   WHERE cp.withdraw_no=w.withdraw_no AND cp.type IN (4,5) LIMIT 1) as 结果记录_type4或5
FROM tiandao_culture.withdrawals w
WHERE w.user_id = 30 ORDER BY w.id DESC LIMIT 5
```

---

### 流程 5: 🏅 大使体系 · 等级配置 · 升级条件 · 名额 · 活动

```
getApplicationStatus → getLevelSystem → getUpgradeGuide → getMyQuotas → getActivityRecords → generateQRCode
```

**测试目的**：验证大使体系的完整配置链路：等级定义 → 升级条件 → 名额分配 → 活动奖励 → 二维码。特别验证等级配置表 `ambassador_level_configs` 的完整性。

**涉及表**：`users`, `ambassador_applications`, `ambassador_level_configs`, `ambassador_quotas`, `ambassador_activity_records`, `quota_usage_records`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 等级配置应覆盖 0(普通) 到 3(鸿鹄) 各级 | 需求 3.1.7.1 |
| 2 | 准青鸾(level=1)无推荐奖励，可推荐初探班 | 需求 3.1.7.1 |
| 3 | 青鸾(level=2) 冻结积分=1688 | 需求 3.1.7.1 |
| 4 | 鸿鹄(level=3) 冻结积分=16880 | 需求 3.1.7.1 |
| 5 | 二维码生成仅限准青鸾+ (level≥1) | 需求 3.1.7.4 |
| 6 | 活动记录应与功德分记录关联 | 需求 3.1.7.2 |

**多表验证 SQL**：
```sql
-- 活动记录与功德分关联验证
SELECT ar.id, ar.activity_type, ar.merit_points, ar.status,
  (SELECT COUNT(*) FROM tiandao_culture.merit_points_records mp
   WHERE mp.activity_id=ar.id AND mp.user_id=ar.user_id) as 对应功德分记录数
FROM tiandao_culture.ambassador_activity_records ar
WHERE ar.user_id=30
```

---

### 流程 6: 📜 协议模板 · 我的协议 · 详情 · 签署验证

```
getContractTemplate → getMyContracts → getContractDetail
```

**测试目的**：验证协议签署的完整链路，确认合同期正确（约365天）、签署信息完整。

**涉及表**：`contract_templates`, `contract_signatures`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 合同结束日期 > 开始日期 | 需求 3.1.6.6 |
| 2 | 合同期约为 365 天（1年） | 需求 3.1.7.1 |
| 3 | 仅青鸾+(level≥2) 可查看协议 | 需求 3.1.6.6 |

---

### 流程 7: 📅 预约 · 排期 · 学习进度 · 签到验证

> ⚠️ **跨流程依赖（F12 课程合同）**：小程序端 `handleAppointment` 现在会先调用 `checkCourseContract` 检查合同状态。如果课程配置了合同模板且用户未签署，会拦截跳转到签约页面。自动化测试直接调用 API 不受影响，但**手动测试预约流程前需确保 F12 测试通过**或该课程未配置合同模板。

```
getClassRecords → getMyAppointments → getAcademyProgress
```

**测试目的**：验证预约系统的排期-预约-学习进度链路，特别是 `class_records.booked_quota` 与实际预约数的一致性。

**涉及表**：`class_records`, `appointments`, `user_courses`, `academy_progress`

> ⚠️ **跨流程追踪提示（见规则4 条目2）**  
> **F2 S2.4 已记录基线：booked_quota=0，无预约记录。**  
> 执行本流程时，**必须额外运行以下 SQL** 确认 booked_quota 是否与实际预约数一致（即使无新预约操作也须验证当前状态）：  
> ```sql  
> SELECT cr.id, cr.booked_quota,  
>   COUNT(a.id) as 实际预约数,  
>   cr.booked_quota - COUNT(a.id) as 差额  
> FROM tiandao_culture.class_records cr  
> LEFT JOIN tiandao_culture.appointments a ON a.class_record_id=cr.id AND a.status IN (0,1)  
> WHERE cr.status=1 GROUP BY cr.id HAVING 差额 != 0  
> ```  
> 若有差额 ≠ 0 的结果，说明 booked_quota 未同步，属数据不一致 BUG。

**★ 核心验证 SQL**：
```sql
-- 排期预约数一致性
SELECT cr.id, cr.class_date, cr.class_time, cr.class_location, cr.booked_quota,
  (SELECT COUNT(*) FROM tiandao_culture.appointments a
   WHERE a.class_record_id=cr.id AND a.status IN (0,1)) as 实际预约数
FROM tiandao_culture.class_records cr WHERE cr.status=1
```

---

### ✏️ 流程 7 签到验证步骤（2026-03-01 新增：attend_count 三路签到验证）

> **背景**：本次修复了三个签到方式的 `attend_count` 逻辑，需全面补充测试覆盖。
>
> - **S7.2b**：用户扫二维码签到（`client:checkin`）→ `attend_count + 1` ✅（原有逻辑正确）
> - **S7.2c**：后台单次签到按钮（`admin:updateAppointmentStatus` status=1）→ `attend_count + 1`（修复前 **Bug**：不更新）
> - **S7.2d**：后台批量签到（`admin:batchCheckin`）→ `attend_count + 1` ✅（原有逻辑正确）
> - **S7.2e**：标记缺席（`admin:updateAppointmentStatus` status=2）→ `attend_count` **不变**（新增边界验证）

**S7.2b · 用户扫码签到验证 SQL**：
```sql
-- 签到前后 attend_count 变化（步骤：先记录当前值，签到后对比）
SELECT uc.id, uc.course_id, uc.attend_count,
       a.id as 预约id, a.status as 预约状态, a.checkin_time
FROM tiandao_culture.user_courses uc
JOIN tiandao_culture.appointments a ON a.user_id = uc.user_id AND a.course_id = uc.course_id
WHERE uc.user_id = 30
ORDER BY a.checkin_time DESC LIMIT 5
-- 期望：签到后 appointments.status=1，checkin_time 有值，attend_count 比签到前 +1
```

**S7.2c · 后台单次签到按钮验证 SQL**：
```sql
-- 操作步骤：后台"预约管理"页面 → 找到 status=0(待上课) 的预约 → 点击"签到"按钮
-- 验证：appointments.status=1，checkin_time 有值，user_courses.attend_count +1
SELECT a.id, a.user_id, a.course_id, a.status, a.checkin_time,
       uc.attend_count
FROM tiandao_culture.appointments a
JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id
WHERE a.user_id = 30 AND a.status = 1
ORDER BY a.checkin_time DESC LIMIT 5
-- 期望：status=1，checkin_time 不为 NULL，attend_count >= 1
```

**S7.2d · 后台批量签到验证 SQL**：
```sql
-- 操作步骤：后台"预约管理"页面 → 勾选多条 status=0 预约 → 点击"批量签到"
-- 验证：所有被勾选预约的 status=1，checkin_time 有值，每条对应的 user_courses.attend_count +1
SELECT a.id, a.user_id, a.course_id, a.status, a.checkin_time,
       uc.attend_count
FROM tiandao_culture.appointments a
JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id
WHERE a.status = 1 AND a.checkin_time IS NOT NULL
ORDER BY a.checkin_time DESC LIMIT 10
```

**S7.2e · 标记缺席不影响 attend_count 边界验证 SQL**：
```sql
-- 操作步骤（模拟）：后台调用 updateAppointmentStatus status=2（缺席）
-- 验证：appointments.status=2，attend_count 不变（无 checkin_time）
-- ⚠️ status=2 枚举含义为"缺席"，不是签到，不应触发 attend_count+1
SELECT a.id, a.user_id, a.course_id, a.status, a.checkin_time,
       uc.attend_count
FROM tiandao_culture.appointments a
JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id
WHERE a.status = 2 AND a.user_id = 30
ORDER BY a.id DESC LIMIT 5
-- 期望：status=2（缺席），checkin_time 为 NULL，attend_count 与该用户签到前一致
```

**关键业务规则（签到部分）**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 签到后 `appointments.status = 1`（已签到），`checkin_time` 有值 | 需求 3.1.4 |
| 2 | 任意签到方式成功后，`user_courses.attend_count + 1` | Bug 修复 2026-03-01 |
| 3 | 缺席（`status = 2`）不触发 `attend_count` 增加 | 枚举语义 |
| 4 | 购买课程时 `attend_count` 初始值为 **0** | Bug 修复 2026-03-01 |
| 5 | 前端"可复训"标签：`attend_count >= 1` 时展示 | my-courses 页面逻辑 |

---

### ✏️ 流程 7 微信订阅消息提醒验证（2026-03-02 新增）

> **背景**：新增微信订阅消息上课提醒功能。用户确认预约时请求授权，每天 9:00 定时任务查询明天有课的预约并发送消息。
>
> **已修复（2026-03-02）**：
> - 模板 ID 大小写修正（`FjF` → `Fjf`，正确值：`SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc`）
> - 发送实现改用 HTTP API（原 `cloud.openapi.subscribeMessage.send` 因 MCP 部署未激活 openapi 权限报 `-501001` 错误，现改为 APPID+AppSecret 换 access_token 后直接调用微信 HTTP API）

| 编号 | 类型 | 接口/操作 | 描述 |
|------|------|-----------|------|
| S7.3a | ✏️ 前端操作 | `uni.requestSubscribeMessage` | 预约确认页点击"确认预约"后弹出微信订阅授权弹窗 |
| | 期望 | 弹窗显示 | 仅在微信小程序环境弹出，H5/App 环境跳过 |
| | 期望 | 预约流程 | 无论用户允许/拒绝授权，预约流程正常继续 |
| S7.3b | ⏰ 定时任务 | `sendCourseReminder` | 定时触发器 `send-course-reminder` 每日 9:00 执行 |
| | 期望 | 返回 `sent` | >= 0（成功发送数） |
| | 期望 | 返回 `failed` | >= 0（失败/跳过数，包含未授权 43101） |
| | 验证 SQL | `SELECT * FROM tiandao_culture.appointments WHERE class_record_id IN (SELECT id FROM tiandao_culture.class_records WHERE class_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)) AND status=0` | 结果条数应 = 总发送数（sent + failed） |
| S7.3c | ⏰ 定时任务 | `sendCourseReminder` | 验证无排期时的行为 |
| | 期望 | 返回 `sent` | = 0 |
| | 期望 | 返回 `message` | "明天没有排期" |
| S7.3d | ⏰ 定时任务 | `sendCourseReminder` | 验证有排期但无预约时的行为 |
| | 期望 | 返回 `sent` | = 0 |
| | 期望 | 返回 `message` | "没有待上课的预约" |
| S7.3e | ⏰ 定时任务 | `sendCourseReminder` | **Bug fix 验证**：确认 HTTP API 方式正常发送（不再出现 -501001 错误） |
| | 期望 | 云函数日志 | 不包含 `-501001` 或 `invalid wx openapi access_token` 错误 |
| | 期望 | 微信收到消息 | 用户微信收到"上课提醒"服务通知，点击跳转至"我的预约"页面 |

**定时任务验证 SQL**：
```sql
-- 查看明天有课的排期（模拟定时任务查询）
SELECT cr.id, cr.course_name, cr.class_date, cr.class_time, cr.class_location, cr.teacher,
       cr.class_end_date, cr.status
FROM tiandao_culture.class_records cr
WHERE cr.class_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  AND cr.status IN (1, 2)
```

```sql
-- 查看明天排期的待上课预约及用户 openid
SELECT a.id, a.user_id, a.class_record_id, a.status,
       u.openid, u.real_name
FROM tiandao_culture.appointments a
JOIN tiandao_culture.users u ON u.id = a.user_id
WHERE a.class_record_id IN (
  SELECT cr.id FROM tiandao_culture.class_records cr
  WHERE cr.class_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND cr.status IN (1, 2)
) AND a.status = 0
```

**关键业务规则（订阅消息部分）**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 一次性订阅：每次预约授权一次，对应发一条消息 | 微信订阅消息机制 |
| 2 | 用户未授权时发送返回 errcode=43101，静默跳过 | 微信 API |
| 3 | 上课地址超 20 字时截断（末尾加 …） | thing 类型限制 |
| 4 | 学习天数 = `class_end_date - class_date + 1`，无 `class_end_date` 时为 "1天" | 计算规则 |
| 5 | 仅微信小程序环境弹授权，H5/App 跳过 | 条件编译 `#ifdef MP-WEIXIN` |

---

### ✏️ 流程 7 复训费支付流程验证（2026-03-02 新增）

> **背景**：新增复训费功能。attend_count >= 1 的非沙龙课程必须先支付复训费才能预约。
> 
> **变更摘要**：
> - `createAppointment.js`：新增复训校验（非沙龙 + attend_count >= 1 → 查 orders 是否有已支付复训订单）
> - `payment.js handleRetrainPayment`：修复 course_id Bug（从 class_records 取，不再用 order.related_id）；补充 user_course_id 字段
> - `cancelAppointment.js`：已废弃，始终返回"当前不支持取消预约"
> - `order.js business-logic`：修复 attend_count 初始值 1 → 0
> - 前端：预约确认页重写（attend_count 改从 getMyCourses 获取）；订单确认页支持 isRetrain 分支；我的预约页移除取消按钮和"已取消"Tab

| 编号 | 类型 | 接口/操作 | 描述 |
|------|------|-----------|------|
| S7.4a | 🔍 读操作 | `getMyCourses` | 预约确认页通过此接口获取 attend_count 和 retrain_price |
| | 期望 | 返回字段 | 包含 `attend_count`、`retrain_price`、`course_id` |
| S7.4b | ✏️ 写操作 | `createAppointment` | attend_count=0 + 非沙龙：首次预约应成功 |
| | 期望 | 成功返回 | `appointment_id` 有值 |
| | 验证 SQL | `SELECT id, status, is_retrain FROM tiandao_culture.appointments WHERE user_id=? ORDER BY id DESC LIMIT 1` | is_retrain=0, status=0 |
| S7.4c | ✏️ 写操作 | `createAppointment` | attend_count>=1 + 非沙龙 + 未支付复训费：应被拒绝 |
| | 期望 | 返回错误 | "复训课程需先支付复训费" |
| S7.4d | ✏️ 写操作 | 创建复训订单 `order_type=2` | attend_count>=1 时前端跳转订单页创建 order_type=2 订单 |
| | 期望 | 创建成功 | 返回 order_no |
| | 验证 SQL | `SELECT order_no, order_type, related_id, class_record_id, pay_status FROM tiandao_culture.orders WHERE user_id=? AND order_type=2 ORDER BY id DESC LIMIT 1` | order_type=2, class_record_id 有值 |
| S7.4e | ✏️ 写操作 | 支付回调 `handleRetrainPayment` | 复训订单支付成功后自动创建预约 |
| | 期望 | appointments 自动创建 | is_retrain=1, order_no 有值, user_course_id 有值 |
| | 验证 SQL | `SELECT a.id, a.is_retrain, a.order_no, a.user_course_id, a.course_id FROM tiandao_culture.appointments a WHERE a.order_no IS NOT NULL ORDER BY a.id DESC LIMIT 1` | course_id 正确（非 user_course_id），user_course_id 有值 |
| S7.4f | ✏️ 写操作 | `cancelAppointment` | 调用取消预约应返回错误 |
| | 期望 | 返回错误 | "当前不支持取消预约" |
| S7.4g | 🔍 前端验证 | 预约确认页 | 沙龙课程（type=4）不显示复训费，按钮文案为"立即预约" |
| S7.4h | 🔍 前端验证 | 我的预约列表 | 无"取消预约"按钮，Tab 无"已取消"选项 |

**复训费验证 SQL**：
```sql
-- 验证复训预约的 course_id 正确性（不应等于 user_course_id）
SELECT a.id, a.course_id, a.user_course_id, a.is_retrain, a.order_no,
       o.related_id as order_related_id, o.class_record_id as order_class_record_id
FROM tiandao_culture.appointments a
LEFT JOIN tiandao_culture.orders o ON o.order_no = a.order_no
WHERE a.is_retrain = 1
ORDER BY a.id DESC LIMIT 5
-- 期望：a.course_id != a.user_course_id（修复前 Bug：course_id 被错误赋值为 order.related_id 即 user_course_id）
```

```sql
-- 验证 attend_count 初始值（所有新购课程应为 0）
SELECT id, course_id, attend_count, buy_time
FROM tiandao_culture.user_courses
WHERE user_id = 30 AND buy_time >= '2026-03-01'
ORDER BY id DESC LIMIT 5
-- 期望：attend_count = 0
```

**关键业务规则（复训费部分）**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | attend_count >= 1 且非沙龙 → 需支付复训费 | 需求 3.1.4 |
| 2 | 复训费金额从 courses.retrain_price 读取 | 课程配置 |
| 3 | 沙龙课程（type=4）免复训费 | 需求 3.1.4 |
| 4 | 复训订单 order_type=2，item_id=user_course_id | 订单模块 |
| 5 | 支付回调自动创建预约（handleRetrainPayment） | payment.js |
| 6 | 所有预约不可取消，cancelAppointment 已废弃 | 2026-03-02 变更 |
| 7 | 支付成功后跳转我的预约页（非订单详情页） | 前端逻辑 |

---

### 流程 8: 💬 反馈 · 类型联动 · 课程关联

```
getFeedbackCourses → getFeedbackTypes(选课) → getFeedbackTypes(通用) → getMyFeedback
```

**测试目的**：验证反馈系统的类型联动逻辑：选择课程时返回课程相关类型，不选课程时返回通用类型。

**涉及表**：`feedbacks`, `user_courses`, `courses`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 可反馈课程 = 用户已购课程（user_courses） | 需求 3.1.6.3 |
| 2 | 选课程时反馈类型: 课程内容/服务/讲师/场地 | 需求 3.1.6.3 |
| 3 | 不选课程时反馈类型: 功能建议/问题反馈/投诉 | 需求 3.1.6.3 |

---

### 流程 9: ⚙️ 系统公共 · 公告 · Banner · 配置 · 通知

```
getAnnouncementList → getBannerList → getSystemConfig → getNotificationConfigs → getUserPoints
```

**测试目的**：验证系统公共接口的基础连通性。

**涉及表**：`announcements`, `banners`, `system_configs`, `notification_configs`

---

### 流程 10: 🔍 跨模块数据完整性终极验证

```
循环引用检测 → 订单↔课程关联 → 密训班赠送初探 → 推荐人锁定验证 → 奖励↔订单一致 → 变更日志完整
```

**测试目的**：这是最重要的验证流程。不测试新的 API，而是通过现有 API 的返回值 + 数据库 SQL 做全面的跨表交叉验证。

> ⚠️ **跨流程追踪提示（见规则4 条目 1/3/4）**  
> 执行本流程时，**必须从规则4清单中提取所有标记「F10」的条目并优先验证**：  
> - **S10.3（条目1+3）**：密训班赠课 is_gift=1 完整性 + included_course_ids 匹配性。若用户30仍无 pay_status=1 密训班订单，须向用户说明此项暂无法验证，需先触发场景 A。  
> - **S10.4（条目4）**：is_referee_confirmed=1 验证。若仍无已支付订单，须向用户说明并建议触发场景 A。  
> - **S10.5（条目4）**：奖励发放记录验证。同上。

**涉及表**：`users`, `orders`, `user_courses`, `merit_points_records`, `cash_points_records`, `referee_change_logs`

**关键业务规则**：

| # | 规则 | 验证方式 | 来源 |
|---|------|---------|------|
| 1 | 无用户自己推荐自己 | `referee_id ≠ id` | 需求 2.5 |
| 2 | 无互相推荐循环 | `r.referee_id ≠ u.id` | 需求 2.5 |
| 3 | 已支付课程订单都有 user_courses 记录 | LEFT JOIN 无 NULL | 需求 3.1.2 |
| 4 | 密训班购买后同时有初探班记录(is_gift=1) | 检查 uc_gift.id | 需求 3.1.2 |
| 5 | 有已支付订单的用户 `is_referee_confirmed=1` | 条件检查 | 需求 2.3 |
| 6 | 已支付+有推荐人的订单应有对应奖励记录 | COUNT > 0 | 需求 2.4 |
| 7 | 推荐人变更有完整日志 | 日志记录存在 | 需求 2.3 |

**★ 核心验证 SQL**：
```sql
-- 奖励发放完整性: 每笔已支付+有推荐人的订单应有对应奖励记录
SELECT o.order_no, o.final_amount, o.referee_id, o.is_reward_granted,
  r.ambassador_level as 推荐人等级,
  CASE WHEN r.ambassador_level=1 THEN '准青鸾(无奖励)'
       WHEN r.ambassador_level=2 THEN '青鸾(功德分)'
       WHEN r.ambassador_level>=3 THEN '鸿鹄+(积分)'
  END as 预期奖励类型,
  (SELECT COUNT(*) FROM tiandao_culture.merit_points_records mp
   WHERE mp.order_no=o.order_no AND mp.user_id=o.referee_id) as 功德分记录,
  (SELECT COUNT(*) FROM tiandao_culture.cash_points_records cp
   WHERE cp.order_no=o.order_no AND cp.user_id=o.referee_id) as 积分记录
FROM tiandao_culture.orders o
LEFT JOIN tiandao_culture.users r ON o.referee_id=r.id
WHERE o.pay_status=1 AND o.referee_id IS NOT NULL AND o.order_type=1

-- 密训班赠送初探班完整性
SELECT o.order_no, c.name, c.type, c.included_course_ids,
  uc_main.id as 主课程, uc_gift.id as 赠送课程
FROM tiandao_culture.orders o
JOIN tiandao_culture.courses c ON o.related_id=c.id
LEFT JOIN tiandao_culture.user_courses uc_main ON uc_main.order_id=o.id AND uc_main.is_gift=0
LEFT JOIN tiandao_culture.user_courses uc_gift ON uc_gift.source_order_id=o.id AND uc_gift.is_gift=1
WHERE o.pay_status=1 AND c.type=2
```

---

## 复杂业务流程手动测试场景

以下是需要 **手动辅助测试** 的复杂场景（因涉及支付回调等无法在浏览器模拟的操作）：

### 场景 A: 课程购买全链路（含支付回调）

```
用户获取课程详情 → 创建订单 → [微信支付] → 支付回调触发 → 验证:
  1. orders.pay_status = 1
  2. user_courses 新增记录
  3. 密训班: user_courses 同时有初探班记录(is_gift=1)
  4. orders.referee_confirmed_at 有值
  5. 首购: users.is_referee_confirmed = 1
  6. 推荐人奖励已发放: orders.is_reward_granted = 1
  7. merit_points_records 或 cash_points_records 有对应记录
```

**验证 SQL：**
```sql
-- 支付后全链路验证（替换 ORDER_NO）
SELECT
  o.order_no, o.pay_status, o.referee_id, o.is_reward_granted, o.referee_confirmed_at,
  u.is_referee_confirmed, u.referee_confirmed_at as 用户推荐人确认时间,
  (SELECT COUNT(*) FROM tiandao_culture.user_courses WHERE order_id=o.id) as 课程记录数,
  (SELECT COUNT(*) FROM tiandao_culture.user_courses WHERE source_order_id=o.id AND is_gift=1) as 赠送记录数,
  (SELECT SUM(amount) FROM tiandao_culture.merit_points_records WHERE order_no=o.order_no) as 功德分,
  (SELECT SUM(amount) FROM tiandao_culture.cash_points_records WHERE order_no=o.order_no) as 积分
FROM tiandao_culture.orders o
JOIN tiandao_culture.users u ON o.user_id=u.id
WHERE o.order_no = 'ORDER_NO'
```

### 场景 B: 推荐人修改 → 支付锁定全链路

```
扫码注册(临时记录推荐人A) → 个人资料改为推荐人B → 创建订单(推荐人自动为B)
→ 订单页改为推荐人C → 支付成功 → 验证:
  1. users.referee_id = C (锁定为订单最终推荐人)
  2. users.is_referee_confirmed = 1
  3. 奖励发放给 C (不是 A 或 B)
  4. referee_change_logs 有 3 条记录 (A→B, B→C, 支付确认)
  5. 后续订单推荐人自动为 C, 不可修改
```

### 场景 C: 大使升级全链路

```
购买密训班 → 申请准青鸾 → 面试通过(后台) → 推荐初探班 → 学员支付成功 → 签署协议 → 升级青鸾 → 验证:
  1. users.ambassador_level 从 0→1→2
  2. 成为青鸾时: cash_points_frozen = 1688
  3. contract_signatures 有协议记录, 合同期1年
  4. 第1次推荐: 解冻1688 (frozen→available)
  5. 第2次推荐: 发功德分(30%), 不发积分
  6. merit_points_records 和 cash_points_records 记录完整
```

### 场景 D: 鸿鹄积分解冻流程

```
青鸾升级鸿鹄(支付9800) → 获16880冻结积分+10名额 → 推荐初探班x10(逐次解冻1688)
→ 第11次推荐初探班(冻结为0, 按30%直接发放) → 推荐密训班(20%直接发放, 不消耗冻结) → 验证:
  1. cash_points_frozen 逐步递减: 16880→15192→...→0
  2. cash_points_available 逐步递增
  3. 密训班推荐积分不消耗 frozen, 直接加到 available
  4. 冻结积分为0后初探班按30%直接发放到 available
  5. 全程不发功德分(鸿鹄只发积分)
```

---

## 测试配置

### 测试用户

默认使用 `id=30`（张三）：
- `_openid`: `2017456901935075328`
- `ambassador_level`: 2（青鸾大使）
- `profile_completed`: 1（已完善资料）

如需更换，修改 HTML 中的 `U` 对象。

### 认证机制

通过 `test_openid` 参数模拟用户身份：
- 所有云函数支持 `test_openid`
- 传入后云函数使用该值作为当前用户标识
- 不影响真实用户登录态

### 云函数映射

| 模块 | 云函数名 | 说明 |
|------|---------|------|
| 用户 | `user` | 资料、推荐人、积分查询 |
| 课程 | `course` | 课程列表、排期、预约 |
| 订单 | `order` | 订单、商城兑换 |
| 大使 | `ambassador` | 申请、升级、协议、活动 |
| 系统 | `system` | 公告、配置、反馈、通知 |

---

## 测试结果状态

| 状态 | 样式 | 含义 |
|------|------|------|
| ✓ 通过 | 绿色 | 接口正常返回且所有字段、业务规则校验通过 |
| ✗ 失败 | 红色 | 接口异常、HTTP 错误或必需字段缺失 |
| ⚠ 业务异常 | 黄色 | 接口正常返回但业务规则不符（需人工判断） |

---

---

## F11 大业务流程详解：大使志愿活动 · 岗位管理 · 报名 · 功德分发放

### 流程概述

**测试范围**: 新增的大使志愿活动全链路，包含岗位类型查询、活动列表（管理端+客户端）、报名人员查看、功德分发放、活动记录验证、统计汇总，以及取消报名边界测试。

**涉及接口（按执行顺序）**:

| 步骤 | Action | 云函数 | 说明 |
|------|--------|--------|------|
| S11.1 | getPositionTypeList | ambassador | 获取岗位类型列表 |
| S11.2 | getAvailableActivities | ambassador | 客户端获取可报名活动（含 my_registration 字段）；**仅返回 status=1（报名中），不含 status=2（报名截止）**（2026-03-01 Bug修复） |
| S11.3 | getAmbassadorActivityList | ambassador | 管理端获取活动列表 |
| S11.4 | getAmbassadorActivityDetail | ambassador | 获取活动详情（含每岗位 remaining 字段） |
| S11.5 | getActivityRegistrants | ambassador | 获取报名人员列表 |
| S11.6 | getProfile | user | 读取发放前功德分余额（基线值） |
| S11.7 | distributeActivityMeritPoints | ambassador | 发放活动功德分（成功或已发放均通过） |
| S11.8 | getProfile | user | 验证发放后功德分余额变化 |
| S11.9 | getAmbassadorActivityDetail | ambassador | 验证 merit_distributed=1 且 status=0（已结束） |
| S11.10 | getActivityRecords | ambassador | 验证活动记录写入（同时验证附带 stats 统计对象） |
| S11.11 | getActivityStats | ambassador | 验证统计汇总字段（total_count/total_merit_points/type_stats） |
| S11.12 | cancelActivityRegistration | ambassador | 边界测试：活动已结束时应返回"已结束"错误 |
| **S11.2b** | **applyForActivity** | **ambassador** | **【核心写操作】报名活动，取无等级限制岗位（2026-02-28 补充）** |
| **S11.12b** | **cancelActivityRegistration** | **ambassador** | **【清理写操作】取消 S11.2b 报名，保证测试幂等（2026-02-28 补充）** |

**涉及数据库表**:

| 表名 | 验证内容 |
|------|---------|
| ambassador_position_types | 岗位类型列表与状态 |
| ambassador_activities | 活动记录、merit_distributed 标志、status |
| ambassador_activity_registrations | 报名状态流转（1→2） |
| users | merit_points 余额变化 |
| merit_points_records | source=7 的功德分记录写入 |
| ambassador_activity_records | 大使端展示记录写入 |

### ★ 核心验证 SQL

```sql
-- S11.7 发放后状态验证（merit_distributed=1, status=0）
SELECT aa.id, aa.schedule_name, aa.merit_distributed, aa.merit_distributed_at, aa.status,
  COUNT(r.id) as total_reg,
  SUM(CASE WHEN r.status=2 THEN 1 ELSE 0 END) as distributed_reg
FROM tiandao_culture.ambassador_activities aa
LEFT JOIN tiandao_culture.ambassador_activity_registrations r ON r.activity_id=aa.id
GROUP BY aa.id
ORDER BY aa.created_at DESC LIMIT 5;

-- S11.8 功德分记录溯源（source=7 为志愿活动）
SELECT mp.user_id, u.real_name, mp.source, mp.amount, mp.balance_after, mp.activity_name, mp.created_at
FROM tiandao_culture.merit_points_records mp
LEFT JOIN tiandao_culture.users u ON mp.user_id=u.id
WHERE mp.source=7
ORDER BY mp.created_at DESC LIMIT 20;

-- S11.10 ambassador_activity_records 验证（验证 getActivityRecords 返回的 stats 一致）
SELECT activity_type, COUNT(*) as cnt, SUM(merit_points) as total_merit
FROM tiandao_culture.ambassador_activity_records
WHERE user_id=${U.id} AND status=1
GROUP BY activity_type;

-- S11.12 取消报名边界 SQL
SELECT r.id, r.user_id, r.position_name, r.status as reg_status,
  aa.status as activity_status, aa.merit_distributed
FROM tiandao_culture.ambassador_activity_registrations r
JOIN tiandao_culture.ambassador_activities aa ON r.activity_id=aa.id
WHERE r.user_id=${U.id} ORDER BY r.created_at DESC LIMIT 5;
```

### 关键业务规则说明

| 规则 | 描述 |
|------|------|
| `getActivityRecords` 返回 `stats` | 接口同时返回分页列表和统计汇总，stats 含 total_count/total_merit_points/month_count/type_stats |
| `getActivityStats` 独立统计 | 不返回列表，只返回统计数字，适合首页统计展示 |
| `cancelActivityRegistration` 限制 | 活动 status=0（已结束）时不可取消，报名 status≠1 时无记录可取消 |
| `signContract` 签名注入 | 仅 .docx 模板支持注入签名图片，PDF 直接使用原模板作为快照 |
| `auditApplication` 不自动升级 | 审核通过后仅改申请状态，升级在用户签署协议后自动发生 |

### 跨流程依赖

| 流程 | 依赖说明 |
|------|---------|
| F11 → F4 | 发放功德分后用户 merit_points 变化，与 F4 功德分链路共享数据表 |
| F11 → F5 | 大使等级影响岗位报名资格（required_level 字段） |

---

---

## 🔴 规则 10：写操作测试设计规范（2026-02-28 经验总结）

> **背景**：F11 流程曾因"报名"核心写操作完全缺失，导致测试全部通过却掩盖了真实 BUG（`applyForActivity` 静默失败、名额虚减）。以下规则为此次教训的直接产物，必须严格遵守。

### 原则 W1：每个流程的核心写操作必须包含在自动化测试中

| 流程 | 核心写操作 | 自动化状态 | 备注 |
|------|-----------|-----------|------|
| F3 | `exchangeGoods` + `cancelExchange` + `confirmPickup` | ✅ S3.6/S3.7/S3.9 | S3.9 为条件写（依赖 status=1 记录） |
| F7 | `createAppointment`（cancelAppointment 已废弃） | ✅ S7.1b/S7.4f | 创建后无法取消，cancelAppointment 返回错误 |
| F8 | `submitFeedback` | ✅ S8.4 | 每次产生新记录，无 cleanup |
| F11 | **`applyForActivity`** + `cancelActivityRegistration` | ✅ S11.2b/S11.12b | 创建后流程末尾清理，幂等 |
| F5 | `apply`（申请大使） | ❌ MT-15 | 无自动清理路径，登记为手动项 |
| F6 | `signContract`（签署协议） | ❌ MT（需文件上传） | 涉及 .docx/.pdf 文件，不适合自动化 |

**判断标准**：若某流程的名称或 desc 包含"报名"/"创建"/"提交"/"兑换"等动词，但 steps 中全部都是读接口，则**必须**补充写操作步骤，否则该流程标记为 ⏳ 未完成。

### 原则 W2：写操作必须有"操作前快照 → 执行 → 操作后验证"三段结构

```
快照（前置 SQL）: 记录操作前的 DB 状态（余额/计数/状态）
执行（API 调用）: 触发写操作
验证（后置 SQL）: 通过 SQL 交叉确认数据库已正确变更
```

若写操作后不执行 DB SQL 验证，等同于没有写操作测试（如原 F11 S11.7 的"跳过"即为此类失效）。

### 原则 W3：写操作必须有 cleanup（清理路径），使测试可重复执行

| 写操作类型 | Cleanup 方式 | 示例 |
|-----------|------------|------|
| 创建记录（有对应删除/取消接口） | 立即调用 cancel/delete 清理 | ~~S7.1b createAppointment → S7.1c cancelAppointment~~（cancelAppointment 已废弃，需手动清理测试数据） |
| 状态流转（终态不可逆，如 status 2/3） | 接受终态，biz 允许幂等通过 | S3.9 confirmPickup（status=1→2，终态） |
| 余额/计数变更（有反向接口） | 调用反向操作还原 | S11.2b applyForActivity → S11.12b cancelActivityRegistration |
| 无清理路径（需管理员审批） | 登记为 MT 手动项 | MT-15 apply（需后台驳回还原） |

**⛔ 禁止**：写操作成功后不做 cleanup，且下次运行时若数据状态已变就报错——这会让测试变成"一次性"测试，CI 无法重复执行。

### 原则 W4：条件写步骤的 biz 必须覆盖"跳过"和"幂等"两种合法场景

```javascript
// ✅ 正确写法：三种情况均通过
(d, raw, C) => {
  if (!C.precondition) return { r: '[跳过] 前置数据不满足', p: true, a: '⚠跳过' };
  if (!raw.success && raw.message?.includes('已XX')) return { r: '幂等：已存在记录', p: true, a: `⚠${raw.message}` };
  return { r: '写操作应成功', p: raw.success === true, a: ... }
}

// ❌ 错误写法：只有 success 才通过，导致"跳过"时整个流程变红
(d, raw) => ({ r: '写操作应成功', p: raw.success === true, a: raw.message })
```

### 原则 W5：禁止把"跳过"（softFail/暂无数据）当作写操作的通过证明

这是 F11 原始 S11.7 的核心缺陷：
```javascript
// ❌ 原 S11.7 - "暂无报名记录，无法发放" 被视为通过 → 实际上报名功能完全没有测试
const isOk = raw.success === true || msg.includes('已发放') || msg.includes('暂无报名');
```

**正确做法**：如果写操作依赖前置数据，**先用 S11.2b 这样的写步骤创建前置数据**，而不是接受"无数据时跳过"。

---

### Mock 数据说明（integration-test.html 中硬编码值说明）

| Mock 字段 | 当前值 | 数据库验证 | 备注 |
|-----------|--------|-----------|------|
| `U.id` | `30` | `users.id=30` 存在，`ambassador_level=2` | 青鸾大使测试账号 |
| `U._openid` | `2017456901935075328` | `users._openid` 对应 id=30 | |
| F5B 测试用户 | `oJr1c7IzbD3FlbdmeiO1fnYDCaL4` (id=34) | level=0 | 普通用户边界测试 |
| F7 `course_id` | `1` | `user_courses.course_id=1, user_id=30, status=1` 存在 | 确保 createAppointment 不被"未购买"拦截 |
| F11 活动 | 动态从 `getAvailableActivities` 取 | `ambassador_activities.id=2-8, schedule_date=2026-03-01` | 活动 schedule_name 已于 2026-02-28 更新 |
| F11 岗位 | 动态取第一个 `required_level=null` 的岗位 | `会务义工/沙龙组织` | 无等级限制，user_id=30 必然满足 |
| F3 S3.9 exchange_no | 动态从 S3.8 列表取 status=1 记录 | 现有 EX2026022X 系列 | 每次确认领取后减少一条；S3.6 成功时可补充 |

---

---

## 流程 F12：课程学习合同 · 签署拦截 · 合同配置 · 签约流程

> **功能说明**：课程购买后首次预约上课（attend_count=0）时，若该课程配置了学习服务协议且用户未签署（contract_signed=0），需先签署合同才能预约。
>
> **涉及表**：user_courses（contract_signed 字段）、contract_templates（course_id + contract_type=4）、contract_signatures（course_id）
>
> **涉及云函数**：ambassador（checkCourseContract、getContractTemplateByCourse、signCourseContract、adminGetCourseContractTemplate、createContractTemplate、updateContractTemplate）

### 测试步骤

| 步骤 | 类型 | Action / 接口 | 描述 |
|------|------|--------------|------|
| S12.1 | 📖 读操作 | `checkCourseContract` | 检查课程合同状态（课程未配置模板场景） |
| | 期望 | `needSign` | `false`（该课程尚未配置合同模板，不需要签） |
| | 期望 | `hasTemplate` | `false` |
| | 验证 SQL | `SELECT contract_signed FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=1` | contract_signed 应为 0 |
| S12.2 | ✏️ 写操作（Admin） | `adminGetCourseContractTemplate` | 查询课程 1 的合同模板（应为空） |
| | 期望 | `template` | `null`（尚未配置） |
| S12.3 | ✏️ 写操作（Admin） | `createContractTemplate` | 为课程 1 创建学习服务协议模板（contractType='course', courseId=1） |
| | 期望 | 接口返回 | `success: true`，返回 template_id |
| | 验证 SQL | `SELECT id, contract_name, contract_type, course_id, status FROM tiandao_culture.contract_templates WHERE course_id=1 AND contract_type=4` | 应有 1 条记录，status=1 |
| S12.4 | 📖 读操作 | `checkCourseContract` | 再次检查课程合同状态（模板已配置但未签署） |
| | 期望 | `needSign` | `true`（attend_count=0 且 contract_signed=0 且有模板） |
| | 期望 | `templateId` | S12.3 返回的 template_id |
| S12.5 | 📖 读操作 | `getContractTemplateByCourse` (client) | 客户端获取课程学习协议模板 |
| | 期望 | `template` | 非 null，包含 title/version/contract_file_url |
| | 期望 | `signed` | `false` |
| S12.6 | ✏️ 写操作 | `signCourseContract` | 签署课程学习服务协议（courseId=1, templateId=S12.3, signatureFileId=测试签名, agreed=true） |
| | 期望 | `success: true` | 返回 signature_id, signed_at |
| | 验证 SQL | `SELECT contract_signed FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=1` | 结果应为 1 |
| | 验证 SQL | `SELECT id, course_id, contract_name, status FROM tiandao_culture.contract_signatures WHERE user_id=30 AND course_id=1 AND status=1` | 应有 1 条记录 |
| S12.6a | 📖 读操作 | 验证推荐人奖励发放 | 签约后推荐人奖励应自动发放（如果有推荐人且有对应未发放订单） |
| | 验证 SQL | `SELECT is_reward_granted, reward_granted_at FROM tiandao_culture.orders WHERE user_id=30 AND related_id=1 AND order_type=1 AND pay_status=1` | 若有推荐人：is_reward_granted=1, reward_granted_at 非 NULL；若无推荐人：is_reward_granted=0 |
| | 验证 SQL | `SELECT * FROM tiandao_culture.cash_points_records WHERE order_no=(SELECT order_no FROM tiandao_culture.orders WHERE user_id=30 AND related_id=1 AND order_type=1 AND pay_status=1 LIMIT 1) AND referee_user_id=30` | 若推荐人有奖励配置且条件满足，应有对应积分/功德分记录 |
| S12.7 | 📖 读操作 | `checkCourseContract` | 签署后再检查合同状态 |
| | 期望 | `needSign` | `false`（contract_signed=1） |
| S12.8 | ✏️ 写操作 | `signCourseContract` | 重复签署（应被拦截） |
| | 期望 | `success` | `false`（已签署过） |
| S12.9 | 📖 读操作（Admin） | `adminGetCourseContractTemplate` | 验证管理端能正确获取课程合同模板 |
| | 期望 | `template` | 非 null，contract_type=4，course_id=1 |
| S12.10 | ✏️ 写操作（Admin） | `updateContractTemplate` | 更新课程合同模板名称/有效期 |
| | 期望 | `success` | `true` |
| | 验证 SQL | `SELECT contract_name, validity_years FROM tiandao_culture.contract_templates WHERE course_id=1 AND contract_type=4` | 字段已更新 |
| S12.11 | ✏️ 写操作（Admin） | `updateCourse` | 无合同模板的课程尝试上架（status=1）应被拦截 |
| | 前置条件 | 使用一个尚未配置合同模板的课程 ID（如 course_id=999 或新建测试课程） | |
| | 期望 | `success` | `false`，错误信息包含"必须配置学习服务协议模板" |
| S12.12 | ✏️ 写操作（Admin） | `updateCourse` | 已有合同模板的课程上架（status=1）应成功 |
| | 前置条件 | 使用 S12.3 已配置合同模板的课程（course_id=1） | |
| | 期望 | `success` | `true` |

### 边界条件

| 步骤 | 描述 | 期望结果 |
|------|------|----------|
| S12.B1 | attend_count > 0 时调用 checkCourseContract | needSign=false（已上过课，无需签合同） |
| S12.B2 | 缺少 courseId 参数调用 checkCourseContract | 返回参数错误 |
| S12.B3 | 缺少 signatureFileId 调用 signCourseContract | 返回参数错误 |
| S12.B4 | agreed=false 调用 signCourseContract | 返回参数错误 |
| S12.B5 | 课程购买支付成功后，验证推荐人奖励**未**即时发放 | orders.is_reward_granted=0（奖励延迟至签约后） |
| S12.B6 | 签约后验证推荐人无订单的场景（无 referee_id） | is_reward_granted 保持 0，不报错 |
| S12.B7 | 课程已上架（status=1）再次 updateCourse(status=1)，不触发重复校验 | 成功（course.status === 1 时跳过校验） |

### 清理说明

测试完成后需手动清理：
- `DELETE FROM tiandao_culture.contract_signatures WHERE user_id=30 AND course_id=1`
- `UPDATE tiandao_culture.user_courses SET contract_signed=0 WHERE user_id=30 AND course_id=1`
- `UPDATE tiandao_culture.orders SET is_reward_granted=0, reward_granted_at=NULL WHERE user_id=30 AND related_id=1 AND order_type=1`（如测试了奖励发放）
- 可选：`DELETE FROM tiandao_culture.contract_templates WHERE course_id=1 AND contract_type=4`

---

---

## 流程 F13：退款申请 · 合同拦截 · 审核流转 · 业务回滚

> **功能说明**：打通小程序端退款申请到后台审核的完整链路。退款为纯人工财务转账，不调用微信退款 API。已签署学习合同的课程无法退款。
>
> **涉及表**：`orders`（refund_status / refund_amount / refund_reason / refund_reject_reason / refund_invoice_file_id / refund_transfer_no / refund_audit_admin_id / refund_audit_time）、`user_courses`（contract_signed / status）、`appointments`（status）
>
> **涉及云函数**：`order`（requestRefund、getRefundStatus、getRefundList、rejectRefund、markRefundTransferred）

### 测试步骤

| 步骤 | 类型 | Action | 云函数 | 描述 |
|------|------|--------|--------|------|
| S13.1 | 📖 读操作 | `getRefundStatus` | `order` | 查询未退款订单状态（基线确认 refund_status=0） |
| S13.2 | 📖 读操作 | `getMyCourses` | `user` | 获取课程列表，确认 contract_signed、expire_at 字段存在 |
| S13.3 | ✏️ 写操作 | `requestRefund` | `order` | 提交退款申请（未签合同的已支付订单） |
| S13.4 | 📖 读操作 | `getRefundStatus` | `order` | 验证 refund_status 已变为 1 |
| S13.5 | 📖 读操作 | `getRefundList`（管理端） | `order` | 管理端查看退款列表，确认统计和列表字段完整 |
| S13.6 | ✏️ 写操作（Admin） | `rejectRefund` | `order` | 驳回退款申请，填写驳回原因 |
| S13.7 | 📖 读操作 | `getRefundStatus` | `order` | 验证 refund_status=4，refund_reject_reason 有值 |
| **S13.8** | **✏️ 写操作（MT）** | `requestRefund` | `order` | **重新申请退款（需人工：MT-17 完成后补充）** |
| **S13.9** | **✏️ 写操作（Admin+文件）** | `markRefundTransferred` | `order` | **标记已转账+发票（需人工：MT-20）** |
| S13.10 | 📖 读操作 | `getRefundStatus` | `order` | 验证 refund_status=3，pay_status=4 |

### 合同拦截边界条件

| 步骤 | 描述 | 期望结果 |
|------|------|----------|
| S13.B1 | 对 contract_signed=1 的课程调用 requestRefund | 返回错误"已签署学习合同，无法退款" |
| S13.B2 | 对 refund_status=1（审核中）的订单再次调用 requestRefund | 返回错误"该订单退款审核中，无法重复申请" |
| S13.B3 | 对 pay_status≠1 的订单调用 requestRefund | 返回错误"只能对已支付订单申请退款" |
| S13.B4 | markRefundTransferred 不传 invoice_file_id | 返回错误"退款发票为必填" |

### ★ 核心验证 SQL

```sql
-- 退款状态全链路验证
SELECT o.order_no, o.pay_status, o.refund_status, o.refund_amount,
  o.refund_reason, o.refund_reject_reason,
  o.refund_audit_admin_id, o.refund_audit_time,
  o.refund_time, o.refund_transfer_no,
  o.refund_invoice_file_id
FROM tiandao_culture.orders o
WHERE o.user_id = 30 AND o.refund_status > 0
ORDER BY o.id DESC LIMIT 10;

-- 业务回滚验证：退款后 user_courses.status=2（已退款），预约 status=4（已取消）
SELECT uc.id, uc.course_id, uc.status as user_course_status,
  (SELECT COUNT(*) FROM tiandao_culture.appointments a
   WHERE a.user_id=uc.user_id AND a.course_id=uc.course_id AND a.status=4) as cancelled_appointments
FROM tiandao_culture.user_courses uc
JOIN tiandao_culture.orders o ON uc.order_id = o.id
WHERE o.user_id = 30 AND o.refund_status = 3
ORDER BY uc.id DESC LIMIT 5;

-- 退款管理统计验证
SELECT
  SUM(CASE WHEN refund_status=1 THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN refund_status=3 THEN 1 ELSE 0 END) as transferred_count,
  SUM(CASE WHEN refund_status=4 THEN 1 ELSE 0 END) as rejected_count,
  SUM(CASE WHEN refund_status=1 THEN refund_amount ELSE 0 END) as pending_amount
FROM tiandao_culture.orders
WHERE refund_status > 0;
```

### 关键业务规则说明

| 规则 | 描述 |
|------|------|
| 合同拦截 | `user_courses.contract_signed=1` 时 `requestRefund` 返回错误，`refund_status` 不变 |
| 人工转账 | 不调用微信退款 API，财务线下银行转账后在后台上传发票标记 |
| 发票必填 | `markRefundTransferred` 的 `invoice_file_id` 为必填参数 |
| 业务回滚 | 标记已转账后系统自动执行：课程失效(status→2)、预约取消(status→4)、升级降级、奖励回退 |
| 状态幂等 | 同一订单同时只能有一个 refund_status=1 的退款申请 |

### 跨流程依赖

| 流程 | 依赖说明 |
|------|---------|
| F13 → F3 | 退款业务回滚影响 orders.pay_status 和 user_courses.status，与 F3 订单数据共享 |
| F13 → F12 | contract_signed 字段由 F12 课程合同签署流程写入，F13 退款拦截依赖该字段 |
| F13 → F7 | 退款回滚取消预约（appointments.status=4），与 F7 预约流程共享数据表 |

---

## 常见问题

### Q: 自动化测试与手动场景的区别？

自动化测试（HTML脚本）覆盖所有 **只读 API** 的连通性和数据一致性验证，以及有**自动清理路径**的写操作。凡写操作无法自动还原状态（涉及支付回调、管理员审批、文件上传等），均登记为 MT 手动测试待办清单。

### Q: 业务规则异常一定是 BUG 吗？

不一定。可能原因：
1. 后端逻辑尚未实现该规则
2. 测试数据状态不满足规则前提条件
3. 确实存在 BUG

每项异常需结合 DB 验证 SQL 人工判断。

### Q: 数据库验证 SQL 怎么执行？

将 SQL 发给 AI 助手，让它通过 MCP `executeReadOnlySQL` 工具执行。注意所有表名已加 `tiandao_culture.` 前缀。

### Q: 如何验证流程 10 的跨表一致性？

流程 10 的 6 个步骤每个都生成多表关联 SQL。运行完成后：
1. 点击 "DB验证SQL" 打开面板
2. 复制全部 SQL
3. 让 AI 助手逐条执行
4. 检查结果中是否出现 "❌" 标记

---

## F14 沙龙课程 · 免费预约 · 自动签到 · 结束清理（2026-03 新增）

### 前置条件
- 管理端已登录
- 测试用户 user_id=30 可用

### 测试步骤

| 编号 | 类型 | 操作 / Action | 描述 |
|------|------|--------------|------|
| S14.1 | ✏️ 写操作 | `createCourse` | 管理端创建沙龙课程（type=4），不传 currentPrice/validityDays |
| | 期望 | `courses.type=4, current_price=0, original_price=0, validity_days IS NULL` | |
| | 验证 SQL | `SELECT id, type, current_price, original_price, retrain_price, validity_days FROM tiandao_culture.courses WHERE type=4 ORDER BY id DESC LIMIT 1` | current_price=0, validity_days=NULL |
| S14.2 | ✏️ 写操作 | `updateCourse` | 沙龙课程上架（status=1），不检查合同模板 |
| | 期望 | 返回成功，不报"需要配置学习服务协议模板" | |
| S14.3 | ✏️ 写操作 | `createClassRecord` | 为沙龙课程创建第一个排期 |
| | 期望 | 返回成功，class_record_id 有值 | |
| S14.4 | ❌ 异常拦截 | `createClassRecord` | 再次为同一沙龙课程创建排期 |
| | 期望 | 返回错误："该沙龙课程已有排期，无法再次创建" | |
| S14.5 | ✏️ 写操作 | `createAppointment` | 用户预约沙龙课程（无 user_courses 记录） |
| | 期望 | 自动创建 user_courses（buy_price=0, course_type=4），返回预约成功 | |
| | 验证 SQL | `SELECT id, buy_price, course_type, status, attend_count FROM tiandao_culture.user_courses WHERE user_id=30 AND course_type=4 ORDER BY id DESC LIMIT 1` | buy_price=0, status=1, attend_count=0 |
| S14.6 | ❌ 异常拦截 | `createAppointment` | 同一用户再次预约同一沙龙排期 |
| | 期望 | 返回错误："您已预约该课程，请勿重复预约" | |
| S14.7 | ✏️ 写操作 | `autoUpdateScheduleStatus` | 模拟开课当天执行定时任务 |
| | 期望 | 沙龙排期变为进行中(status=2)，预约自动签到(appointments.status=0→1)，checkin_time 有值 | |
| | 验证 SQL | `SELECT a.status, a.checkin_time FROM tiandao_culture.appointments a JOIN tiandao_culture.class_records cr ON a.class_record_id=cr.id JOIN tiandao_culture.courses c ON cr.course_id=c.id WHERE c.type=4 AND a.user_id=30 ORDER BY a.id DESC LIMIT 1` | status=1, checkin_time 不为空 |
| S14.8 | ✏️ 写操作 | `autoUpdateScheduleStatus` | 模拟排期结束次日执行定时任务 |
| | 期望 | 沙龙排期变为已结束(status=3)，然后硬删除 class_records + courses + user_courses，appointments 保留 | |
| | 验证 SQL | `SELECT COUNT(*) as cnt FROM tiandao_culture.courses WHERE type=4 AND id=<课程ID>` | cnt=0（已删除） |
| | 验证 SQL | `SELECT COUNT(*) as cnt FROM tiandao_culture.appointments WHERE course_id=<课程ID> AND user_id=30` | cnt>=1（保留） |
