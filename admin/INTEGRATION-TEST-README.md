# 小程序端 · 端到端业务流程集成测试指南

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
3. 按流程 F1→F10 顺序，对每个步骤（S1.1、S1.2、...、S10.6）逐一执行该步骤对应的验证 SQL
   - 每个步骤的验证 SQL 见本文档"10 大业务流程详解"各节中的"多表验证 SQL"/"★ 核心验证 SQL"
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
getList → getDetail → getMyCourses → getCalendarSchedule → getCaseList → getMaterialList
```

**测试目的**：验证课程从列表到详情的完整浏览链路，确认购买状态标记、密训班包含关系正确。

**涉及表**：`courses`, `user_courses`, `class_records`, `academy_cases`, `academy_materials`

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
getMyOrders → getDetail → getMallGoods → getExchangeRecords
```

**测试目的**：验证订单全链路，特别是已支付订单的推荐人确认状态、奖励发放状态，以及商城兑换的库存一致性。

**涉及表**：`orders`, `user_courses`, `merit_points_records`, `cash_points_records`, `mall_goods`, `mall_exchange_records`

**关键业务规则**：
| # | 规则 | 来源 |
|---|------|------|
| 1 | 已支付订单 `referee_confirmed_at` 应有值 | 需求 2.3 阶段3 |
| 2 | 订单详情应含推荐人信息和奖励发放状态 | 需求 3.2.5 |
| 3 | 商城兑换后 sold_quantity 应正确递增 | 需求 3.1.7.2 |

**多表验证 SQL**：
```sql
-- 订单 + 推荐人 + 奖励记录关联验证
SELECT o.order_no, o.final_amount, o.pay_status, o.referee_id, o.is_reward_granted,
  r.real_name as 推荐人, r.ambassador_level as 推荐人等级,
  (SELECT COUNT(*) FROM tiandao_culture.merit_points_records mp WHERE mp.order_no=o.order_no) as 功德分记录,
  (SELECT COUNT(*) FROM tiandao_culture.cash_points_records cp WHERE cp.order_no=o.order_no) as 积分记录
FROM tiandao_culture.orders o
LEFT JOIN tiandao_culture.users r ON o.referee_id=r.id
WHERE o.user_id=30 AND o.pay_status=1
```

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
| 5 | **users.cash_points_frozen = 冻结获得 - 解冻总计** | 数据一致性 |
| 6 | **users.cash_points_available = 解冻 + 直接发放 - 提现** | 数据一致性 |

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

-- 积分各字段 vs 明细分类汇总
SELECT u.id,
  u.cash_points_frozen as 冻结, u.cash_points_available as 可用,
  SUM(CASE WHEN cp.type=1 THEN cp.amount ELSE 0 END) as 冻结获得,
  SUM(CASE WHEN cp.type=2 THEN cp.amount ELSE 0 END) as 解冻,
  SUM(CASE WHEN cp.type=3 THEN cp.amount ELSE 0 END) as 直接发放,
  SUM(CASE WHEN cp.type=4 THEN cp.amount ELSE 0 END) as 提现
FROM tiandao_culture.users u
LEFT JOIN tiandao_culture.cash_points_records cp ON cp.user_id=u.id
WHERE u.id = 30 GROUP BY u.id
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

```
getClassRecords → getMyAppointments → getAcademyProgress
```

**测试目的**：验证预约系统的排期-预约-学习进度链路，特别是 `class_records.booked_quota` 与实际预约数的一致性。

**涉及表**：`class_records`, `appointments`, `user_courses`, `academy_progress`

**★ 核心验证 SQL**：
```sql
-- 排期预约数一致性
SELECT cr.id, cr.class_date, cr.class_time, cr.class_location, cr.booked_quota,
  (SELECT COUNT(*) FROM tiandao_culture.appointments a
   WHERE a.class_record_id=cr.id AND a.status IN (0,1)) as 实际预约数
FROM tiandao_culture.class_records cr WHERE cr.status=1
```

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

## 常见问题

### Q: 自动化测试与手动场景的区别？

自动化测试（HTML脚本）覆盖所有 **只读 API** 的连通性和数据一致性验证。涉及支付回调、管理员操作等 **写入操作** 的复杂链路需要手动辅助测试（见"复杂业务流程手动测试场景"章节）。

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
