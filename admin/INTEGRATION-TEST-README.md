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

### 规则 4：跨流程数据一致性追踪清单（每次新增测试信息时必须更新）

> **此清单记录在某个流程测试时发现的、需要在后续流程中再次核验的数据状态。**  
> AI 在执行每个流程验证时，**必须主动检查此清单**，对所有涉及当前流程的条目执行数据库验证。  
> 每当新测试发现跨流程依赖时，**必须立即将其追加到此清单**，不可遗漏。

#### 当前已知跨流程数据依赖

| # | 数据依赖描述 | 发现于 | 需在哪里验证 | 验证 SQL / 说明 | 状态 |
|---|------------|--------|------------|----------------|------|
| 1 | **密训班赠课 is_gift=1 完整性**：购买密训班(type=2)后，user_courses 中应同时有 is_gift=1 的初探班记录。当前 user_id=30 的 user_courses 仅 1 条(is_gift=0)，无赠送记录，说明尚未触发密训班购买场景 | F2 S2.3（我的课程 is_gift 计数=0） | **F10 S10.3** ★必验 | `SELECT uc_main.id as 主课程, uc_gift.id as 赠送课程 FROM orders o JOIN courses c ON o.related_id=c.id LEFT JOIN user_courses uc_main ON uc_main.order_id=o.id AND uc_main.is_gift=0 LEFT JOIN user_courses uc_gift ON uc_gift.source_order_id=o.id AND uc_gift.is_gift=1 WHERE o.pay_status=1 AND c.type=2` | ⏳ 待触发密训班购买后验 |
| 2 | **排期 booked_quota 一致性**：class_records.booked_quota 应与实际 appointments 表预约数一致。当前 booked_quota=0 且无预约记录，一致；但每次预约/取消后需重新验证 | F2 S2.4（排期日历 booked_quota=0） | **F7 S7.1/S7.2** ★必验 | `SELECT cr.booked_quota, COUNT(a.id) as 实际预约数 FROM class_records cr LEFT JOIN appointments a ON a.class_record_id=cr.id AND a.status IN (0,1) WHERE cr.status=1 GROUP BY cr.id` | ⏳ 每次预约操作后重验 |
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
getList → getDetail → getMyCourses → getCalendarSchedule → getCaseList → getMaterialList
```

**测试目的**：验证课程从列表到详情的完整浏览链路，确认购买状态标记、密训班包含关系正确。

**涉及表**：`courses`, `user_courses`, `class_records`, `academy_cases`, `academy_materials`

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
```

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
