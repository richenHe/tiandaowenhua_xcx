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

  ### 规则 1：首要测试用户

  **所有自动化测试与手动测试，默认使用以下账号：**

  | 项目 | 值 |
  |------|------|
  | 姓名 | 何日琛 |
  | user_id | 32 |
  | _openid | `oJr1c7AODZ6ZocPfFuTeooL9PHXE` |
  | uid | `MM268A6MGGV5W3OPQNO` |
  | 手机号 | 13652517719 |
  | 大使等级 | 3（鸿鹄大使） |
  | 推荐人 ID | 33 |
  | 功德分 | 8.00 |
  | 现金积分 | 2184.00 |

  **测试环境说明：**
  - 本地测试，无需部署到云端即可运行自动化测试
  - `integration-test.html` 中的 `TEST_OPENID` 应与上述 `_openid` 一致
  - 涉及特定用户的边界测试（如 F1B、F5B）使用不同的测试用户，以各流程内说明为准

  **该用户当前数据概况（供断言参考）：**
  - 已购课程 13 条（user_courses），含多种状态（status=1 正常 / status=2 过期）
  - 已有订单 10+ 条，含已支付、已退款、待支付等多种 pay_status
  - 部分课程已签约（contract_signed=1），部分未签约

  ---

  ### 规则 2：发现代码问题时，必须先向用户说明原因并确认后才能修改

  **⛔ 禁止在未经用户确认的情况下修改任何云函数代码、前端页面代码、配置文件。**

  #### 触发条件

  AI 在分析测试报告或数据库时，发现测试失败的原因是**代码写错了**（而不是测试数据缺失），必须执行以下流程：

  ```
  第1步  发现问题   → 分析失败原因，判断是代码 Bug 还是测试数据问题
  第2步  说明原因   → 用业务语言 + 关键代码位置向用户解释问题
  第3步  等待确认   → 明确问一句"是否需要修改？"，等用户回复
  第4步  执行修改   → 用户确认后才能动代码
  第5步  说明改了什么 → 改完后简要告知改动内容和影响范围
  ```

  #### 说明格式（必须包含以下三个部分）

  **① 业务现象**（用户能看懂的语言描述出了什么问题）

  > 例：测试显示"推荐人锁定时间为空"，但业务规定已付款的订单必须有推荐人锁定时间，说明系统没有正确返回这个信息。

  **② 问题根因**（解释代码的哪里写错了，用业务逻辑说明，可附代码位置）

  > 例：`cloudfunctions/order/handlers/client/getDetail.js` 第 124 行，代码去找"推荐人最后被手动改动的时间"，但这个时间只有在用户主动修改推荐人时才会有记录。如果用户从来没改过推荐人，这个时间就是空的。正确的应该是去找"推荐人被永久锁定的时间"，那个时间存在用户账号里，不在订单里。

  **③ 修改方案**（说明打算怎么改，改了会影响什么）

  > 例：计划把第 124 行改为从用户账号里读取推荐人锁定时间。改动只影响订单详情接口返回的这一个字段，不影响其他逻辑。需要额外查一次用户表，性能影响极小。

  #### 数据修改 vs 代码修改

  | 类型 | 是否需要确认 | 说明 |
  |------|------------|------|
  | 补充/修改测试数据（INSERT/UPDATE） | ❌ 无需确认 | 测试数据随时可以改，不影响业务逻辑 |
  | 插入 EX_TST / TST 前缀的测试记录 | ❌ 无需确认 | 测试专用数据 |
  | 修改云函数代码（.js 文件） | ✅ **必须确认** | 影响线上业务逻辑 |
  | 修改前端页面代码（.vue 文件） | ✅ **必须确认** | 影响用户看到的界面 |
  | 部署云函数 | ✅ **必须确认** | 部署后立即生效，影响所有用户 |
  | 修改数据库表结构（ALTER TABLE） | ✅ **必须确认** | 不可逆操作，影响全局 |

  #### 错误示例（禁止这样做）

  ```
  ❌ AI 发现代码 Bug → 直接修改代码 → 直接部署 → 告诉用户"已修复"
  ```

  #### 正确示例

  ```
  ✅ AI 发现代码 Bug
     → 用业务语言说明：
         "测试发现订单详情里推荐人锁定时间显示为空。
          原因是代码读错了地方——它读的是推荐人修改记录（从来没改过就是空），
          正确应该读用户账号里的推荐人锁定时间。
          计划修改 getDetail.js 第 124 行，只影响这一个字段的返回值。
          是否确认修改？"
     → 用户回复"确认"
     → AI 修改代码并部署
     → AI 告知改了什么、是否需要重跑测试
  ```

  ---

  #### 当前测试进度

  | 流程 | 状态 | 最后验证日期 |
  |------|------|-------------|
  | F1 用户资料 · 推荐人 · 资格验证 | ⏳ 重测（2026-03-23：updateProfile 新增银行账户三字段 bankAccountName/bankName/bankAccountNumber；需验证银行信息保存、清空、提现/退款前置检查跳转等新逻辑） | 2026-03-23 |
  | F1B 边界验证 · 未完善资料 · 无推荐人 · 功德分=0 | ✅ 已完成（**全通过 3/3**；S1B.1 profile_completed=0✓；referee_id展示修正（F1 S1.7设置后不强制null）；S1B.2 referee_count=0✓；S1B.3 merit_points=0.00✓；DB交叉全部一致） | 2026-03-09 |
  | F2 课程浏览 · 详情 · 购买条件验证 | ✅ 已完成（**11/11 全通过**；S2.2 修正课程 id=6（"测试课程"，type=1，user_id=30 未购买），is_purchased=false✓；S2.2b 密训班 included_course_ids=[1]✓；S2.2d 已购课程 is_purchased=true✓；S2.4 日历 4 天排期，status=0 关闭排期已过滤✓；S2.5 案例 2 条 HTTPS URL✓；DB 交叉验证全部一致） | 2026-03-03 |
  | F3 订单 · 商城兑换 · 多表数据一致性 | ✅ 已完成（**20/21 pass，1 warn（非 Bug）**；S3.10 attend_count 修复验证通过✓；S3.6/S3.7/S3.9 写操作多表一致性全通过✓；S3.10b retrain_credit_status✓；S3.MT25 兑换订单✓；S3.12b warn=pending_days 重跑叠加问题（已重置 uc_id=50 pending_days=0，非代码缺陷）；S3.9 备用兑换记录已补充 EX_TST20260309_S39F） | 2026-03-09 |
  | F4 功德分 · 积分 · 提现 · 余额一致性 | ⏳ 重测（2026-03-13：修复 getMeritPointsHistory Tab 类型筛选 Bug；2026-03-23：applyWithdraw 接口改为从 users 表读取银行信息，前端不再传银行字段；提现页面移除银行输入表单，改为只读展示并跳转个人资料页修改；需验证银行信息未填时提现跳转拦截逻辑） | 2026-03-23 |
  | F4B 边界验证 · 无推荐人+完整资料 · 积分余额 | ✅ 已完成（全通过 3/3） | 2026-02-27 |
  | F5 大使体系 · 等级配置 · 升级条件 | ✅ 已完成（**8/8 全通过**；S5.1 申请状态 status=0(待审核)✓；S5.2 5级配置齐全，青鸾frozen_points=1688✓、鸿鹄frozen_points=16880✓；S5.3 升级指南 current=1，含1个升级选项✓；S5.4 名额 total=5/used=5/available=0，remaining不为负✓；S5.5 活动记录4条均正常✓；S5.6 活动统计✓；S5.7 推荐学员✓；S5.8 二维码✓；DB交叉全部一致；⚠️ MT-34导航栈手动验证登记为MT项不阻塞流程完成） | 2026-03-03 |
  | F5B 边界验证 · 普通用户拦截(level=0) · 升级指南0→1 | ✅ 已完成（全通过 4/4；S5B.1 断言修复：接受 has_application=false 或 status=2 均为可重申状态） | 2026-03-02 |
  | F5C 边界验证 · 准青鸾升级路径(level=1) · target≤current拒绝 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
  | F5D 流程5-D: 青鸾大使升级路径(level=2→3) · ~~名额remaining=0边界~~ | ✅ 已完成（**2/2 全通过**；S5D.1 current_level=2✓，upgrade_options含contract✓；S5D.2 softFail接口仍可用，1条名额remaining=0✓；DB交叉全部一致） | 2026-03-09 |
  | F5E 流程5-E: 申请被拒绝(status=2) · 拒绝原因返回验证 | ✅ 已完成（全通过 2/2） | 2026-02-27 |
  | F5F 流程5-F: 申请待审核(status=0) · 升级指南审核中状态 | ✅ 已完成（全通过 3/3；getApplicationStatus排序修复✓；eligible=false✓；重复申请文案"您已有待审核的申请"✓） | 2026-03-02 |
  | F6 协议模板 · 我的协议 · 签署验证 | ⏳ 重测（2026-03-13：新增 S6.11 客户端无合同照片提示验证；修复 contracts/index.vue 无照片时无限加载 Bug） | 2026-03-13 |
  | F7 预约 · 排期 · 学习进度 · 签到 | ✅ 已完成（**20/22 通过，0 失败，2 warn（均为 softFail）**；S7.1b 首次预约✓ appointment_id=69；S7.1c 客户端截止日前取消✓；S7.4c 复训拦截✓；S7.QR1-QR3 签到码生成/覆盖/列表✓；S7.SC1 扫码签到"不在签到时间内"合法边界✓（scanCheckin Bug 已修复）；S7.MC1-MC3 补签/取消/查询✓；S7.RC1 has_credit 字段✓；S7.8 warn：沙龙课 type=4 豁免合同拦截，正确行为非 Bug；S7.CA2 warn：appointmentId=0 被拒为缺参，需手动测试；DB 交叉：appointment id=69 status=3✓，booked_quota 与实际预约数一致✓） | 2026-03-09 |
  | F8 反馈 · 类型联动 · 课程关联 | ✅ 已完成（8/8 全通过；getMyFeedback 修复降序排列；S8.5 feedback_type 5种全覆盖✓、status 全合法✓、reply验证✓；DB交叉4项全一致） | 2026-03-02 |
  | F9 系统公共 · 公告 · Banner · 配置 · 通知 | ✅ 已完成（全通过 7/7；S9.6修复：公告id从1改为2（id=1已下架）；客服电话/通知配置/Banner均正常） | 2026-03-02 |
  | F10 跨模块数据完整性终极验证 | ✅ 已完成（5/6通过，1 warn：S10.3密训班赠课验证；S10.1循环引用检测全✓(4用户无循环)；S10.2订单→课程记录通过；S10.3 warn：密训班订单ORD202602221434438312的user_courses无is_gift=1赠课记录（主课程记录也为NULL），MT密训班赠课手动测试待验证（MT-36~38）；S10.4推荐人锁定✓(referee_confirmed_at=2026-02-24)；S10.5奖励发放基本一致（TST订单referee_level=3但无积分记录，历史测试数据差异）；S10.6变更日志完整✓(user=30有多条订单修改日志)) | 2026-03-03 |
  | F11 大使志愿活动 · 岗位管理 · 报名 · 功德分发放 | ⏳ 重测（2026-03-13：修复 Tab 类型筛选 Bug — 前端 `activity_type`(snake_case) → `activityType`(camelCase) 参数名不匹配导致后端始终默认值0，筛选无效；同时修复 type_stats 缺少统筹(5)/主持(6)的统计；新增 S11.10b 验证 Tab 筛选生效） | 2026-03-13 |
  | F12 课程学习合同 · 合同配置 · 管理员录入合约 · 上架校验 | ⏳ 重测（2026-03-13：新增 S12.N17/N18 后台补充合同照片 updateContractImages 测试；getContractList 返回字段修复验证） | 2026-03-13 |
  | F13 退款申请 · 合同拦截 · 审核流转 · 业务回滚 | ⏳ 重测（2026-03-23：新增复训费退款功能；requestRefund 新增 retrain_credit_status 校验与失效逻辑；rejectRefund 新增驳回后恢复复训资格；markRefundTransferred 修复已取消预约不重复扣减 booked_quota；需补充 S13.RT1~RT5 复训费退款测试用例；2026-03-23 新增：退款/复训费退款前置检查银行信息，未填则跳转个人资料页；后台退款列表新增用户银行账户展示） | 2026-03-23 |
  | F14 沙龙课程 · 免费预约 · 自动签到 · 结束清理 | ✅ 已完成（**8/8 全通过**；S14.1~S14.6 自动化全通过；S14.7 MCP验证：排期→进行中+沙龙自动签到 checkin_time=2026-03-03 11:50:08✓；S14.8 MCP验证：salonCleanedCourses=1+courses硬删除cnt=0✓；修复3项Bug：S14.2传参courseId→id、appointments外键CASCADE→SET NULL、S14.7/S14.8定时任务MCP直接触发验证） | 2026-03-03 |
  | F19 学员推荐关系管理 | ⏳ 待测（2026-03-18 新增：后台学员推荐关系列表页改造；新增 getUserListForReferee/getUserRefereeTree 两个云函数接口；页面支持分页列表、大使等级筛选、关键词搜索、推荐关系树弹窗（文字树/图形树）、多选导出 Word 文档） | 2026-03-18 |
  | F15 ~~管理端大使赠送课程 · 名额扣减 · 课程开通/续期~~ | ⏳ 已隐藏（2026-03-09：赠送名额功能已隐藏，后台赠送课程入口已移除，此流程暂停测试） | 2026-03-09 |
  | F16 合同审核流程 | ⏳ 已合并到 F12（课程合同改为管理员录入直接生效 adminCreateCourseContract，大使合同 signContract 直接生效无待审核，原审核流程不再需要独立测试） | 2026-03-09 |
  | F17 表现分与评估名单 | ✅ 已完成（**14/14 全通过，0 失败，0 warn**；S17.1-3 加分/扣分✓；S17.4 评估名单11条含测试用户✓；S17.5 阈值配置更新✓；S17.6-7 课程/活动拉黑3个月✓；S17.8-9 拦截验证✓；S17.14 重复拉黑幂等✓；S17.10-11 解除拉黑✓；S17.12 解除后恢复（复训费原因，非黑名单）✓；S17.13 缺参验证✓） | 2026-03-09 |
  | F20 用户课程管理 · 手动新增 · 调整积分修复 | ✅ 已完成（**8/8 全通过，0 失败，0 warn**；S20.1 课程列表20条✓；S20.2 关键词搜索8条✓；S20.3 状态筛选均为有效✓；S20.4 手动新增 uc_id=60 expire_at✓；S20.5 重复新增"已拥有此课程"拦截✓；S20.6 含合同新增 uc_id=61 sig_id=30✓；S20.7 调整功德分+10✓；S20.8 扣现金积分-5✓；修复测试脚本：beforeRun 改用公开接口 getList 替代管理端 getCourseList，解决鉴权失败导致找不到可用课程的问题） | 2026-03-09 |
  | F18 角色权限管理 | ✅ 已完成（**8/8 全通过，0 失败，0 warn**；S18.1 创建角色✓；S18.2 角色列表4条含新建✓；S18.3 更新权限✓；S18.4 super_admin权限修改拦截✓；S18.5 内置角色删除拦截✓；S18.6 使用中角色删除拦截✓；S18.7 自定义角色删除并清理✓；S18.8 缺参拦截✓） | 2026-03-09 |
  | F19 商学院板块管理 | ✅ 已完成（**8/8 全通过，0 失败，0 warn**；S19.1 小程序7条板块✓；S19.2 后台列表✓；S19.3 新增板块id=9✓（修复：insert未链式.select()导致id为null）；S19.4 修改标题✓；S19.5 切换隐藏status=0✓；S19.6 排序更新✓；S19.7 删除清理✓；S19.8 验证隐藏不出现✓） | 2026-03-09 |
  | F21 排座管理 · 配置 · 分配 · 随机 · 导出 | ✅ 已完成（**9/9 全通过，0 失败，0 warn**；S21.1 getSeatingData结构✓；S21.2 保存5桌×6座配置✓；S21.3 assign学员A→桌1座1✓；S21.4 assign学员B→桌1座2✓；S21.5 swap互换座位✓；S21.6 remove移回备选✓；S21.7 randomAssignSeats assigned=1✓；S21.8 缩减1桌×4座超范围清理✓；S21.9 最终状态验证✓；修复2项Bug：getSeatingData用findOne查ambassador_activities返回3行报错→改用query；class_records.course_name字段为NULL→补全数据+加固断言） | 2026-03-09 |

  > AI 助手在每次完成一个流程验证后，**必须立即更新上表的状态和日期**，不可遗漏。

  ---

  ## 🔄 重要业务逻辑变更记录

  > 本节记录测试过程中发现并修改的关键业务逻辑，供后续测试时对照。

  | 变更日期 | 变更模块 | 变更内容 | 影响测试项 |
  |---|---|---|---|
  | 2026-03-13 | `cloudfunctions/callbacks/handlers/payment.js`<br>`cloudfunctions/order/handlers/public/testSimulatePayment.js` | **推荐人锁定时机变更**：`referee_confirmed_at` 不再在首次支付时写入，改为**仅在首次签署学习合同时**（`adminCreateCourseContract`）写入。已删除 payment.js 第 361-375 行的锁定逻辑。 | MT-03（边界：已签合同用户扫码无法换推荐人 ✅）；MT-03b（未签合同用户扫码可换推荐人 ⏳） |
  | 2026-03-13 | `cloudfunctions/ambassador/common/grantRefereeReward.js` | **奖励发放规则变更**：删除 `can_earn_reward=0` 时的硬拦截逻辑。奖励是否发放**仅由费率配置**（`merit_rate_basic`/`merit_rate_advanced`/`cash_rate_basic`/`cash_rate_advanced`）决定，`can_earn_reward` 字段不再起拦截作用。 | MT-30（后台录入合约触发奖励 ✅） |

  ---

  ## 📋 测试总计划（2026-03-09 更新）

  > **测试用户：何日琛（user_id=32）**
  > **测试方式：本地打开 `integration-test.html`，无需部署**

  ### 一、总体概览

  | 类别 | 流程 | 步骤数 | 说明 |
  |------|------|--------|------|
  | **A. 自动化重测** | F3, F5D, F7, F12, F13 | 5 个流程 | 已有自动化代码更新，需重新运行验证 |
  | **B. 自动化首测** | F17, F18, F19, F20 | 4 个流程 | 新编写的自动化测试，首次运行 |
  | **C. 手动测试** | MT-03b, MT-25~26h, MT-30, MT-38~39, MT-53 | 15 项 | 需真机/后台/支付操作，无法自动化（2026-03-13更新：MT-25✅ MT-30✅ MT-38✅ MT-39✅(功能) MT-03✅重测 已完成；MT-26b~26h部分通过；MT-03b⏳待测）|

  ---

  ### 二、自动化测试计划（在 integration-test.html 中逐流程运行）

  #### 执行顺序与操作说明

  ```
  ⛔ 禁止点"运行全部"，必须逐流程运行
  ✅ 每个流程：点击流程卡片 → 等运行完 → 截图/导出JSON → 发给 AI 做 DB 验证 → 标记完成
  ```

  #### Phase A：重测流程（自动化代码已更新，重新跑一遍）

  | 序号 | 流程 | 关注点（本次新增/变更内容） | 预计耗时 |
  |------|------|---------------------------|---------|
  | A1 | **F5D** 青鸾升级路径 | S5D.2 名额步骤已标记 `softFail`（赠送名额功能已隐藏），确认不阻塞其他步骤 | 1 分钟 |
  | A2 | **F3** 订单·商城 | ① S3.10b 新增：`retrain_credit_status` 字段验证（期望返回中含该字段）；② S3.MT25 新增：`exchangeCourse` 接口附加验证 | 3 分钟 |
  | A3 | **F13** 退款 | ① S13.9 驳回后重新申请退款（需先有被驳回的订单）；② S13.9b 验证 `refund_status=1`；③ S13.9c 管理端再次驳回（清理）；④ S13.11 已退款订单不可重申拦截；⑤ S13.12 字段验证（`refund_reason`/`reject_reason`/`invoice_url`） | 3 分钟 |
  | A4 | **F12** 课程合同 | ① S12.N1 `adminGetUserPaidCourses` 查询用户已购课程；② S12.N2 `adminCreateCourseContract` 正向录入（需 admin token）；③ S12.N3 重复录入拦截；④ S12.N4-N5 参数错误/未购课拦截；⑤ S12.N7 合约详情验证 `sign_type=3`；⑥ S12.N8 合约列表验证 `contract_images`；⑦ S12.B2-B3 旧接口标记 `softFail` | 5 分钟 |
  | A5 | **F7** 预约·签到 | ① S7.1c 客户端取消预约（含截止日期判断）；② S7.2 新字段 `is_retrain`/`cancel_deadline_days`；③ S7.QR1-QR3 签到二维码生成/覆盖/列表（admin 接口）；④ S7.SC1-SC2 扫码日签到+重复扫码；⑤ S7.MC1-MC3 后台补签/取消签到/列表；⑥ S7.RC1 复训资格检查；⑦ S7.CA2 取消截止时间拦截 | 5 分钟 |

  ##### Phase A 详细步骤操作指南

  **A1. F5D 青鸾大使升级路径**
  ```
  1. 本地浏览器打开 integration-test.html
  2. 确认顶部显示"测试用户: 何日琛 (ID:32)"
  3. 找到"流程5-D: 青鸾大使升级路径"卡片 → 点击运行
  4. 等待完成后检查：
     - S5D.1 getUpgradeGuide：应返回 current_level=3(鸿鹄)，可能无升级选项
     - S5D.2 getMyQuotas：应 softFail（功能已隐藏），不影响整体
  5. 截图/导出 JSON → 发给 AI 做 DB 验证
  ```

  **A2. F3 订单·商城兑换**
  ```
  1. 运行前：AI 需确认何日琛有 pay_status=1 的订单、merit_points 充足
  2. 找到"流程3: 订单·商城兑换"卡片 → 点击运行
  3. 等待完成后检查：
     - S3.1 getMyOrders：订单列表正常返回
     - S3.2 getOrderDetail：已支付订单详情
     - S3.10b（新增）：getMyOrders 返回中含 retrain_credit_status 字段
     - S3.MT25（新增）：exchangeCourse 接口调用验证
  4. 截图/导出 JSON → 发给 AI
  ```

  **A3. F13 退款申请**
  ```
  1. 运行前依赖：何日琛需要有"已支付+未退款"的订单（F3 的 beforeRun 会自动准备）
  2. 找到"流程13: 退款申请"卡片 → 点击运行
  3. 等待完成后重点检查：
     - S13.1 requestRefund：申请退款成功，refund_status=1
     - S13.9（新增）：驳回后重新申请
     - S13.11（新增）：已退款订单重申拦截
     - S13.12（新增）：字段验证（refund_reason/reject_reason/invoice_url）
  4. ⚠️ S13.9 依赖先有"被驳回"的订单，beforeRun 会自动准备
  5. 截图/导出 JSON → 发给 AI
  ```

  **A4. F12 课程学习合同**
  ```
  1. 运行前：需要先登录 admin 后台获取 token（页面左上角有管理员登录按钮）
  2. 找到"流程12: 课程学习合同"卡片 → 点击运行
  3. 等待完成后重点检查：
     - S12.N1（新增）：adminGetUserPaidCourses 返回何日琛已购课程列表
     - S12.N2（新增）：adminCreateCourseContract 成功录入合约
     - S12.N3（新增）：重复录入拦截（"已有生效合约"）
     - S12.N4-N5（新增）：参数缺失/未购课拦截
     - S12.N7-N8（新增）：合约详情 sign_type=3、列表含 contract_images
     - S12.B2-B3：旧接口 softFail（已废弃，不影响流程）
  4. 截图/导出 JSON → 发给 AI
  ```

  **A5. F7 预约·排期·签到**
  ```
  1. 运行前：需要 admin token（签到二维码、补签等需管理员权限）
  2. 找到"流程7: 预约·排期·签到"卡片 → 点击运行
  3. 等待完成后重点检查：
     - S7.1c（新增）：客户端取消预约（检查截止日期逻辑）
     - S7.2（更新）：我的预约返回中含 is_retrain、cancel_deadline_days 字段
     - S7.QR1（新增）：管理员生成签到二维码
     - S7.QR2（新增）：重复生成覆盖旧码
     - S7.SC1（新增）：学员扫码日签到
     - S7.SC2（新增）：同日重复扫码（返回已签到）
     - S7.MC1-MC3（新增）：后台补签/取消签到/签到列表
     - S7.RC1（新增）：复训资格检查
     - S7.CA2（新增）：取消截止时间拦截
  4. ⚠️ 部分步骤标记了 softFail（如无可用排期数据时）
  5. 截图/导出 JSON → 发给 AI
  ```

  #### Phase B：首测流程（新编写的自动化测试）

  | 序号 | 流程 | 测试内容 | 预计耗时 |
  |------|------|---------|---------|
  | B1 | **F17** 表现分·黑名单 | 加分→扣学员分→扣活动分→评估名单→阈值配置→课程拉黑→活动拉黑→预约拦截→活动拦截→重复拉黑拦截→解除拉黑→预约恢复→缺参异常（13步） | 3 分钟 |
  | B2 | **F18** 角色权限管理 | 创建角色→角色列表→更新权限→修改super_admin拦截→删除内置角色拦截→删除使用中角色拦截→删除自定义角色→非超管创建拦截（8步） | 2 分钟 |
  | B3 | **F19** 商学院板块 | 小程序板块列表→后台列表(含隐藏)→新增→修改→切换显隐→更新排序→删除→验证隐藏不出现（8步） | 2 分钟 |
  | B4 | **F20** 用户课程管理 | 课程列表→搜索→状态筛选→手动新增→重复拦截→新增含合同→调整功德分→扣现金积分（8步） | 3 分钟 |

  ##### Phase B 详细步骤操作指南

  **B1. F17 表现分与评估名单·黑名单管理**
  ```
  1. 需要 admin token（表现分和黑名单都是管理端操作）
  2. 找到"流程17: 表现分与评估名单"卡片 → 点击运行
  3. 等待完成后检查：
     - 加分/扣分操作是否写入 performance_scores 表
     - 评估名单返回低分用户
     - 课程/活动拉黑写入 user_blacklist 表
     - 拉黑后预约/活动报名被拦截
     - 解除拉黑后预约恢复
  4. ⚠️ 首次运行可能有数据依赖问题，关注 beforeRun 是否成功准备数据
  5. 截图/导出 JSON → 发给 AI
  ```

  **B2. F18 角色权限管理**
  ```
  1. 需要 admin token（超级管理员）
  2. 找到"流程18: 角色权限管理"卡片 → 点击运行
  3. 等待完成后检查：
     - 创建角色成功（admin_roles 新增记录）
     - 系统角色不可删除/修改的拦截
     - 使用中角色不可删除的拦截
     - 自定义角色可正常删除
  4. 截图/导出 JSON → 发给 AI
  ```

  **B3. F19 商学院板块管理**
  ```
  1. 需要 admin token
  2. 找到"流程19: 商学院板块管理"卡片 → 点击运行
  3. 等待完成后检查：
     - 新增板块写入 academy_sections 表
     - 显隐切换和排序更新生效
     - 隐藏板块不出现在小程序列表
     - 删除板块后记录清除
  4. 截图/导出 JSON → 发给 AI
  ```

  **B4. F20 用户课程管理·手动新增·调整积分**
  ```
  1. 需要 admin token
  2. 找到"流程20: 用户课程管理"卡片 → 点击运行
  3. 等待完成后检查：
     - 用户课程列表、搜索、筛选正常
     - 手动新增课程成功（user_courses 新增记录）
     - 重复新增拦截
     - 调整功德分/现金积分写入 users 表和记录表
  4. 截图/导出 JSON → 发给 AI
  ```

  **B5. F21 排座管理·配置·分配·随机·导出**

  测试步骤：

  | 步骤 | 类型 | 接口 / 操作 | 验证 |
  |------|------|-----------|------|
  | S21.1 | 🔍 读操作 | `getSeatingData` classRecordId=存在的排期 | 返回 config（默认值）、students（来自 appointments）、positions、assignments（空数组） |
  | S21.2 | ✏️ 写操作 | `saveSeatingConfig` deskCount=6, seatsPerDesk=10 | 成功；再查 seating_configs 表有该排期一条记录 |
  | S21.2b | 验证 SQL | `SELECT * FROM tiandao_culture.seating_configs WHERE class_record_id=?` | desk_count=6, seats_per_desk=10 |
  | S21.3 | ✏️ 写操作 | `saveSeatingAssignment` operations=[{type:'assign', userId=学员A, deskNumber=1, seatNumber=1}] | 成功 |
  | S21.3b | 验证 SQL | `SELECT * FROM tiandao_culture.seating_assignments WHERE class_record_id=?` | 有 1 条记录，user_id=学员A, desk_number=1, seat_number=1 |
  | S21.4 | ✏️ 写操作 | 再 assign 学员B 到桌1座位2 | 成功；assignments 表有 2 条记录 |
  | S21.5 | ✏️ 写操作 | swap 学员A 和学员B | 成功；A 在桌1座2，B 在桌1座1 |
  | S21.6 | ✏️ 写操作 | remove 学员A | 成功；assignments 表只剩学员B |
  | S21.7 | ✏️ 写操作 | `randomAssignSeats` userIds=[学员A, 学员C, ...] | 返回 assigned > 0；assignments 表新增记录 |
  | S21.8 | ✏️ 写操作 | `saveSeatingConfig` deskCount=1（缩减桌数） | 成功；超出范围的 assignments 被删除 |
  | S21.9 | 🔍 读操作 | `getSeatingData`（有活动的排期） | positions 对象包含岗位映射 |
  | S21.10 | 前端验证 | 后台打开排座管理页面 | 课程/排期下拉框正常加载，选择后显示座位布局和备选学员 |
  | S21.11 | 前端验证 | 拖拽学员到座位、座位间交换、移回备选 | 操作后自动保存，刷新页面数据不丢失 |
  | S21.12 | 前端验证 | 点击导出学员表 / 导出签到表 | 下载 Word 文件，内容按桌分组，字段正确 |

  ---

  ### 三、手动测试计划（需真机/后台/支付操作）

  > **⛔ 每完成一个 MT 步骤，立即告知 AI，AI 执行 DB 验证后才能继续下一步。**

  #### Phase C：签到相关手动测试（依赖 F7 自动化先跑完）

  | 序号 | 编号 | 测试场景 | 操作方法 | 验证要点 |
  |------|------|---------|---------|---------|
  | C1 | MT-26 | 签到二维码覆盖生成 | 后台→排课管理→选排期→生成签到码→**再次生成** | `checkin_qrcodes` 该排期只保留 1 条记录，qrcode_url 已更新 |
  | C2 | MT-26b | 非沙龙扫码日签到 | 学员真机扫码（需排期日期含今天） | `appointment_checkins` 新增 checkin_type=1 记录；`appointments.status` 仍为 0 |
  | C3 | MT-26c | 重复扫码签到 | 同一天再次扫码 | 返回 `already_checked=true`，不重复插入 |
  | C4 | MT-26d | 排期外扫码 | 排期日期不含今天时扫码 | 返回"不在签到时间内"，无记录插入 |
  | C5 | MT-26e | 后台补签与取消 | 后台→预约详情→点"补签"→再点"取消签到" | 补签: `checkin_type=2` 记录新增；取消: 记录删除 |
  | C6 | MT-26f | 排期结束+签到→定时任务 attend_count+1 | ①小程序预约今天的排期 ②扫码签到留下签到记录 ③AI用MCP触发 `autoUpdateScheduleStatus`（模拟排期已结束） | `user_courses.attend_count` +1；`appointments.status`=1（已结课）；**预约创建本身不改变 attend_count** |
  | C7 | MT-26g | 取消预约 booked_quota-1（attend_count 不变） | 后台→预约管理→取消预约 | `class_records.booked_quota` -1；该预约的签到记录全部删除；**attend_count 不变**（取消操作不影响出勤计数） |
  | C8 | MT-26h | 签到不触发积分解冻 | 扫码签到后查积分记录 | `cash_points_records` 无新增 type=2（解冻）记录 |

  ##### C 阶段操作前提
  ```
  前提 1：何日琛已有某课程的非沙龙预约（appointment status=0）
  前提 2：该课程的排期 class_date ≤ 今天 ≤ class_end_date（否则扫码会报"不在签到时间内"）
  前提 3：后台已为该排期生成签到二维码
  操作顺序：C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8
  ```

  #### Phase D：合同·退款·推荐人手动测试

  | 序号 | 编号 | 测试场景 | 操作方法 | 验证要点 |
  |------|------|---------|---------|---------|
  | D1 | MT-30 | 后台录入合约触发奖励 | 后台→合约管理→录入合约→选用户+课程+上传照片→提交 | `orders.is_reward_granted=1`，推荐人积分/功德分入账 |
  | D2 | MT-39 | 赠送课程合同拦截退款 | 购买密训班→赠课→赠课签合同→申请密训班退款 | 返回"赠送课程已签署学习合同，无法退款" |
  | D3 | MT-38 | 密训班兑换赠课 | 小程序→商城→兑换密训班课程 | 赠送课程 user_courses 新建/有效期叠加（同 MT-36/37） |
  | D4 | MT-03b | 未购课用户扫码换推荐人 | 未购课+有推荐人+未确认的用户扫其他大使推广码 | `referee_id` 变为新推荐人 ID |
  | D5 | MT-53 | 取消排期+自动取消预约 | 调用 `updateClassRecord { id, status:0 }` | 排期 status=0，预约 status=3，复训订单释放资格 |
  | D6 | MT-25 | 课程续期兑换 | 小程序→商城→选课程续期商品→兑换 | `quota_exchange_records` 新增，`merit_points` 减少 |

  ##### D 阶段操作前提
  ```
  D1 前提：何日琛有已支付但未签合同的课程订单
  D2 前提：先购买密训班 → 赠课 contract_signed=1 → 再申请退款
  D3 前提：功德分/积分余额充足，商城有密训班课程
  D4 前提：找 referee_confirmed_at=NULL 且有 referee_id 的用户
  D5 前提：存在 status=1 的排期且有关联预约
  D6 前提：何日琛功德分余额 ≥ 课程兑换价格
  ```

  ---

  ### 四、推荐执行顺序（一站式完成）

  ```
  ┌─────────────────────────────────────────────────────┐
  │ 第一轮：自动化测试（约 30 分钟）                       │
  │                                                     │
  │  ① 打开 integration-test.html                       │
  │  ② 登录 admin 后台获取 token                         │
  │  ③ 按顺序运行：F5D → F3 → F13 → F12 → F7            │
  │  ④ 每个运行完：导出 JSON → 发给 AI → DB 验证          │
  │  ⑤ 继续运行：F17 → F18 → F19 → F20                  │
  │  ⑥ 同样每个导出 JSON → AI 验证                       │
  └─────────────────────────────────────────────────────┘
              ↓ 全部通过后
  ┌─────────────────────────────────────────────────────┐
  │ 第二轮：手动测试（约 60 分钟）                         │
  │                                                     │
  │  ⑦ Phase C 签到系列：C1→C2→C3→C4→C5→C6→C7→C8       │
  │     每步完成后告知 AI，等 DB 验证通过再继续            │
  │  ⑧ Phase D 合同退款系列：D1→D2→D3→D4→D5→D6          │
  │     同样逐步验证                                     │
  └─────────────────────────────────────────────────────┘
              ↓ 全部通过后
  ┌─────────────────────────────────────────────────────┐
  │ 第三轮：全量回归（约 5 分钟）                          │
  │                                                     │
  │  ⑨ 点击"运行全部业务流程"                             │
  │  ⑩ 导出完整报告 → AI 最终 DB 验证 → 全部标记 ✅       │
  └─────────────────────────────────────────────────────┘
  ```

  ---

  ### 五、测试完成标准

  | 标准 | 说明 |
  |------|------|
  | 自动化 100% 通过 | 所有流程步骤 pass（softFail 不阻塞） |
  | DB 交叉验证一致 | 每个步骤的验证 SQL 结果与接口返回值匹配 |
  | MT 手动项全部 ✅ | 手动测试待办清单中无 ⏳ 项 |
  | 进度表全绿 | 当前测试进度表所有流程状态为 ✅ |

  ---

  #### 手动测试执行计划（2026-03-04 定制）

  > **⛔ 规则**：每完成一个步骤，立即告知 AI，AI 执行 DB 验证后才能继续下一步。

  **阶段划分**

  | 阶段 | 内容 | 是否需要真实支付 |
  |------|------|----------------|
  | 阶段一 | v2.4 pending_days 退款扣减验证 | ❌ 无需（用 MCP 模拟转账） |
  | 阶段二 | 密训班购买 → 赠课 → 退款回滚全链路 | ✅ 需要真实微信支付 |
  | 阶段三 | 后台功能验证（课程上架/排期拦截等） | ❌ 无需 |
  | 阶段四 | 前端交互验证（导航栈/分页/推荐人扫码） | ❌/✅ 部分需要 |

  ---

  ##### 阶段一：v2.4 pending_days 退款扣减验证（可立即执行）

  > 目标：验证 `markRefundTransferred` 执行后，未签约课程的 `pending_days` 按 `validity_days` 扣减，`expire_at` 保持 NULL。
  > **测试账号：何日琛（user_id=32）**
  > 测试订单：`ORD202603030704123642`（order id=91，refund_status=0，可直接申请退款）
  > 关联课程记录：`user_courses id=30`（course_id=23，validity_days=365，pending_days=365，contract_signed=0）

  | 步骤 | 操作 | 你要做什么 | AI 验证内容 |
  |------|------|-----------|------------|
  | P1 | 查基线 | 无需操作，AI 已确认 | user_courses id=30：pending_days=365，contract_signed=0 ✓ |
  | P2 | 申请退款 | 小程序→订单列表→找课程名"[自动测试]更新课程_xxx"（¥1.00）→申请退款→填写原因 | orders.refund_status 变为 1 |
  | P3 | 后台标记已转账 | 后台→退款管理→找到该订单→上传一张测试发票图→点"标记已转账" | orders.refund_status=3，pay_status=4 |
  | P4 | 验证 pending_days 扣减 | 无需操作，AI 自动验证 | user_courses id=30：pending_days 从 365→0，expire_at 仍为 NULL，status=2 |

  **状态**：✅ 通过（2026-03-04）
  - orders.pay_status=4，refund_status=3，refund_time=2026-03-04 18:00:51，invoice 已上传 ✓
  - user_courses id=30：pending_days 365→0，expire_at=NULL，status=2 ✓
  - v2.4 核心验证：退款后扣减 pending_days 而非 expire_at，逻辑正确 ✓

  ---

  ##### 阶段二：密训班购买 → 赠课 → 退款全链路（需真实支付）

  > 目标：覆盖 MT-12、MT-36、MT-39、MT-40 四个场景，一次购买密训班可同时验证。
  > 前置：准备一张可用的微信支付方式。

  | 步骤 | 编号 | 操作 | AI 验证内容 |
  |------|------|------|------------|
  | D1 | MT-12 | 小程序购买密训班（type=2）→ 完成支付 | orders.pay_status=1；user_courses 出现 is_gift=1 的初探班记录（MT-12✓） |
  | D2 | MT-36 | 无需额外操作（D1 支付回调触发赠课） | user_courses 赠课记录：is_gift=1，source_order_id=订单id，status=1，pending_days>0 |
  | D3 | MT-39 | 后台→大使赠课→赠送初探班给测试学员→学员签学习合同；然后在小程序对该密训班申请退款 | requestRefund 返回错误"赠送课程已签署学习合同，无法退款"（MT-39✓） |
  | D4 | MT-40 | 跳过 MT-39 拦截场景，直接用 D1 的密训班订单申请退款（赠课 contract_signed=0）→ 后台标记已转账 | user_courses is_gift=1 记录 status=2（失效）（MT-40✓） |

  **状态**：✅ 已通过（2026-03-04，order_id=109，is_gift=1 赠课记录 id=37 → status=2，is_gift=0 主课记录 id=36 → status=2，pending_days 均归零）

  ---

  ##### 阶段三：后台功能验证（随时可执行）

  | 编号 | 场景 | 操作入口 | 期望结果 | 状态 |
  |------|------|---------|---------|------|
  | MT-42 | 课程上架后编辑字段应置灰 | 后台→课程列表→点击已上架课程"编辑" | 所有字段 disabled，显示"课程已上架"提示 | ✅ 通过（2026-03-04）橙色提示+字段全置灰 |
  | MT-43 | 课程上架弹出确认框 | 后台→课程列表→点击下架课程"上架" | 弹出"上架后不能修改"确认框 | ✅ 通过（2026-03-04）|
  | MT-44 | 新课程默认 status=0 | 后台→课程列表→新增课程→保存 | `SELECT status FROM tiandao_culture.courses ORDER BY id DESC LIMIT 1` → status=0 | ✅ 已通过（2026-03-04，id=42 "aaa" status=0） |
  | MT-51 | 排期日期前端拦截 | 后台→排期管理→新增排期→选昨天日期→保存 | 前端报错"上课日期不能早于今天"，不发请求 | ✅ 已通过（2026-03-04，前端拦截弹出提示，无接口请求） |
  | MT-53 | ~~排期日期云函数拦截~~（已变更）取消排期+自动取消预约 | 调用 `updateClassRecord {id:<排期id>, status:0}` | 排期 status=0，关联预约 status=3，复训预约释放资格 | ⏳ 重测（2026-03-06 updateClassRecord 仅允许 status=0） |
  | MT-13 | 等级配置互斥校验 | 后台→等级配置→功德率和积分率同时填>0 | 报错"不能同时大于0" | ✅ 已通过（2026-03-04） |
  | MT-14 | 等级配置倍数校验 | 后台→等级配置→设置非整数倍关系 | 报错"必须是整数倍" | ✅ 已通过（2026-03-04） |

  ---

  ##### 阶段四：前端交互验证（可逐步推进）

  | 编号 | 场景 | 说明 | 状态 |
  |------|------|------|------|
  | MT-49 | 列表分页加载 | 我的订单/预约/课程向下滚动，最多 99 条 | ✅ 已通过（2026-03-04） |
  | MT-50 | 协议列表 99 条截取 | 我的协议底部显示"已加载全部" | ✅ 已通过（2026-03-04） |
  | MT-51 | 订阅消息弹窗真机验证（普通预约） | 预约确认页点击"立即预约"时，真机弹出「订阅课程开课提醒」弹窗 | ✅ 已通过（2026-03-04） |
  | MT-52 | 订阅消息弹窗真机验证（复训支付） | 支付页点击"立即支付"时，真机弹出「订阅课程开课提醒」弹窗，授权后继续支付流程 | ✅ 已通过（2026-03-04） |
  | MT-31 | 支付成功后导航栈 | 支付成功→返回→不应回到订单确认页 | ✅ 已通过（2026-03-04） |
  | MT-32 | 取消支付后导航栈 | 取消支付→应跳到待支付页而非确认页 | ✅ 已通过（2026-03-04） |
  | MT-07c | 新购课 attend_count 初始值 | 购课后 user_courses.attend_count=0 | ✅ 已通过（2026-03-04） |
  | MT-02 | 扫码绑定推荐人 | 新微信账号扫码注册 → referee_id 绑定 | ✅ 已通过（2026-03-04） |
  | MT-04 | 微信支付回调全链路 | 真实支付后 is_reward_granted=1 | ✅ 已通过（2026-03-04） |

  ---

  #### v2.4 课程过期逻辑重构 · 定制测试计划（2026-03-04）

  | 批次 | 流程 | 状态 | 关键步骤 |
  |------|------|------|---------|
  | 第一批 | F3 订单 | ✅ 已完成 | S3.11 双字段、S3.12b pending_days=validity_days |
  | 第二批 | F12 课程合同 | ✅ 已完成 | S12.B1b contract_signed 逻辑、S12.B1c 三联断言 |
  | 第二批 | F7 预约 | ✅ 已完成 | S7.1b/S7.4c warn（v2.4 合同拦截正确优先，非 Bug）；S7.7/S7.8 无过期数据跳过；合同拦截逻辑✓ |
  | 第二批 | F15 赠课 | ✅ 已完成 | 9/10 pass；激活路径✓、pending_days叠加✓、quota扣减✓；S15.7 C路径 WARN（设计限制，非 Bug） |
  | 第二批 | F13 退款 | ✅ 全部完成（自动化 17/17 + MT-42 手动通过） | S13.P2 MT-42 pending_days 365→0，expire_at=NULL，status=2 ✓（2026-03-04） |
  | 第三批 | MT-42 | ✅ 手动完成（2026-03-04） | markRefundTransferred 后 pending_days 365→0，expire_at=NULL，v2.4 逻辑正确 |
  | 第三批 | MT-30 | 手动 | F12 签约流程（真实手写签名） |

  **执行顺序**：F3 → F12 → F7 → F15 → F13（自动化）→ MT-42/MT-30（手动）

  **每测完一个流程**：立即更新本表「状态」列 + 上方「当前测试进度」表。

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

  ---

  ### 🔴 规则 PRE：每次流程测试前，必须完成数据完整性检查并补齐缺失数据

  > **所有 AI 规则的前提，优先级高于规则 1~11。未完成本规则前，禁止告知用户开始测试。**

  #### 核心原则

  **⛔ 禁止跳过任何测试步骤。凡因数据缺失导致步骤"跳过"或无法执行，AI 必须立即通过 MCP 补齐测试数据，确保每个步骤都能真正运行并产生断言结论。**

  **⛔ 每次开始流程测试前，AI 必须在对话中明确声明已逐条回顾本节所有规则（规则 PRE + 规则 1~11 + 规则 M），未声明则视为违规。**

  #### 触发时机

  每次用户说「测 FX」、「开始测试」、「可以测了吗」等，AI 必须：
  1. **先执行本规则**（数据检查 + 规则回顾）
  2. 输出"测试前数据检查报告"
  3. 全部通过后，**才可告知用户"FX 数据已就绪，可以开始测试"**

  ---

  #### 第一步：规则回顾（必须逐条过一遍）

  | # | 规则名称 | 核心动作 |
  |---|---------|---------|
  | 规则 PRE | 测试前数据检查（本规则） | 补齐缺失数据，禁止跳过任何步骤 |
  | 规则 1 | 收到报告后执行 DB 验证 | 每步骤均执行 SQL 交叉验证 |
  | 规则 2（Mock数据校验） | 测试脚本参数与真实 DB 匹配 | 禁止使用不存在的 ID 或过期值 |
  | 规则 3 | 覆盖分析 | 完成后输出已覆盖/未覆盖场景分析 |
  | 规则 4 | 跨流程数据一致性 | 检视清单中与当前流程相关的条目 |
  | 规则 9 | 未覆盖场景必须补完 | A/B/C/D 类必须补完后才能进入下一流程 |
  | 规则 10 | F 类延迟场景触发 | 前置流程完成后立即补测 F 类场景 |
  | 规则 11 | 写操作设计规范 | 核心写操作必须含快照-执行-验证三段结构 |
  | 规则 M | 手动测试登记 | 涉及真机/支付回调的场景登记到 MT 清单 |

  ---

  #### 第二步：数据完整性检查（逐步骤逐项执行）

  对目标流程的每个步骤，通过 MCP `executeReadOnlySQL` 确认所需数据是否存在：

  **各流程通用检查项：**

  | 流程 | 步骤 | 所需数据 | 检查 SQL |
  |------|------|---------|---------|
  | F3 | S3.2 | `orders.pay_status=1` 至少一条 | `SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND pay_status=1` |
  | F3 | S3.6 | `users.merit_points >= 82`（S3.6 扣 80 + S3.6b 扣 1 = 共需 81，留 1 余量）| `SELECT merit_points FROM tiandao_culture.users WHERE id=30` |
  | F3 | S3.9 | `mall_exchange_records.status=1` 至少 **1** 条独立记录（S3.7 会消耗 S3.6 创建的记录，S3.9/S3.9x 需独立的 EX_TST_ 前缀记录；**每次跑完需补一条**；当前备用：**EX_TST20260302_S39D**→status=1，id=19） | `SELECT COUNT(*) FROM tiandao_culture.mall_exchange_records WHERE user_id=30 AND status=1 AND exchange_no LIKE 'EX_TST%'` |
  | F3 | S3.10 | `user_courses.buy_time >= '2026-03-01'` 且 `attend_count=0` | `SELECT COUNT(*) FROM tiandao_culture.user_courses WHERE user_id=30 AND buy_time>='2026-03-01'` |
  | F3 | S3.12b | **⚠ 每轮必须重置**：`user_course id=16`（course_id=18）`pending_days=0`，否则 S3.6b 每次叠加 365，导致 pending≠validity | `UPDATE tiandao_culture.user_courses SET pending_days=0, updated_at=NOW() WHERE id=16 AND user_id=30` |
  | F7 | S7 签到相关 | `appointments` 中有已预约记录 | `SELECT COUNT(*) FROM tiandao_culture.appointments WHERE user_id=30 AND status=0` |
  | F10 | S10.4/S10.5 | `orders.pay_status=1` 至少一条（推荐人奖励验证） | `SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND pay_status=1` |

  > 其他流程在开始前，AI 必须自行阅读该流程的所有步骤说明，提取每一步的数据前置条件并逐项检查。

  ---

  #### 第三步：缺失数据处理（分类处理，禁止跳过）

  | 类型 | 判断标准 | 处理方式 |
  |------|---------|---------|
  | **A. 可直接插入** | 缺少的是静态业务数据（订单、购课记录、兑换记录等），不依赖真实业务流程触发 | 通过 MCP `executeWriteSQL` 立即插入测试数据，使用 `TST` 前缀标识（如 `TST20260302001`） |
  | **B. 需真实写入逻辑验证** | 缺少的是**写操作结果**（如 `attend_count`、`expire_at`），目的是验证某写逻辑是否正确 | 分两层：① 插入预期值的记录，验证读接口正确返回（覆盖读路径）；② 登记为 MT 手动项，通过真实操作验证写路径 |
  | **C. 需真实用户操作** | 涉及微信支付回调、扫码、真实登录、小程序端交互 | 登记为规则 M 手动项，不可自行创建数据替代 |

  **造数据规范（A/B 类）：**

  - `order_no` 使用 `TST{YYYYMMDD}{4位序号}` 格式，如 `TST202603020001`
  - `remark` 或 `note` 字段注明 `"[AI测试数据 YYYY-MM-DD]"`，便于识别和清理
  - 外键字段必须使用数据库中真实存在的 ID（user_id=30、course_id 等须先 SELECT 确认）
  - 插入后立即执行 SELECT 验证，确认数据写入正确

  **⛔ 造数据后必须立即触发规则 10 F 类扫描（禁止跳过）：**

  > 每次通过 MCP `executeWriteSQL` 插入或修改测试数据后，必须立即对照**规则 4 跨流程追踪清单**中所有 ⏳ 状态条目，判断本次 DB 变更是否满足了任何 F 类场景的前置条件。若满足，立即执行 SQL 补测，**不得等到流程结束后再处理**。
  >
  > 判断方式：对照条目的「验证 SQL / 说明」列，看本次写入的表/字段是否与该条目相关。

  ---

  #### 第四步：输出测试前数据检查报告（必须输出，不可省略）

  ```
  ## FX 测试前数据检查报告

  检查时间: YYYY-MM-DD HH:mm
  目标流程: FX 流程名称
  测试用户: id=30

  | 步骤 | 所需数据 | 检查结果 | 处理方式 |
  |------|---------|---------|---------|
  | S3.2 | pay_status=1 订单 | ❌ 缺失 | ✅ 已通过 MCP 插入测试订单 TST202603020001 |
  | S3.7 | status=1 兑换记录 | ⏳ 等待 S3.6 创建 | 正常，S3.6 运行后即可创建 |
  | S3.10 | buy_time≥2026-03-01 购课记录 | ❌ 缺失 | ✅ 已插入测试记录（读路径）；写路径登记 MT-XX |

  规则回顾：✅ 已逐条确认规则 PRE + 1~11 + 规则 M
  数据检查：✅ 所有步骤前置数据已就绪
  结论：可告知用户开始测试 FX
  ```

  ---

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

  ### 规则 MT-STEP：手动测试逐步交叉验证规则（最高优先级）

  > **⛔ 禁止一次性完成手动测试所有步骤后再集中验证。每完成一个操作步骤，必须立即停下，等待 AI 进行 DB 交叉验证，确认通过后才能进行下一步。**

  #### 核心流程

  ```
  用户操作第 N 步
      ↓
  告知 AI "MT-XX 步骤 N 已完成"
      ↓
  AI 立即执行该步骤的验证 SQL（MCP）
      ↓
  AI 报告验证结果（✅通过 / ❌异常）
      ↓
  ✅ 通过 → 用户继续下一步
  ❌ 异常 → 停止，AI 分析原因，修复后才能继续
  ```

  #### 每步必须验证的内容

  | 操作类型 | AI 必须验证的内容 |
  |---|---|
  | 写操作（购买/预约/签到/退款等） | DB 中目标记录是否正确写入；关联表数据是否同步 |
  | 状态变更 | 变更前后的字段值；关联字段是否联动更新 |
  | 数量变化（库存/名额/积分） | 变化方向和数值是否与预期一致；余额是否正确 |
  | 新增记录 | 记录是否存在；关键字段（source/type/status/is_gift等）是否正确 |

  #### 违规情形

  | 违规 | 后果 |
  |---|---|
  | 用户连续操作多步才报告 | 无法确定是哪一步出现异常，DB 状态混乱 |
  | AI 未等用户报告就推进下一步 | 跳过验证，可能掩盖 bug |
  | AI 批量验证多个步骤 | 掩盖中间状态，失去逐步确认的意义 |

  ---

  #### 手动测试待办清单

  | 编号 | 场景 | 流程 | 前置条件 | 验证步骤 | 验证 SQL | 状态 |
  |------|------|------|---------|---------|---------|------|
  | MT-01 | **generateQRCode 真实写 DB**：真机生成推广二维码后 `users.qrcode_url` 应回写 cloud:// fileID | F5 S5.8 | 用 level≥1 大使账号登录小程序 | 进入大使中心→我的推广码→点击生成 | `SELECT id, referee_code, qrcode_url FROM tiandao_culture.users WHERE id=30` | ✅ 通过（2026-02-27，id=32 真机验证，qrcode_url 写入 cloud://fileID） |
  | MT-02 | **新用户扫码绑定推荐人**：新用户扫大使二维码注册后 `users.referee_id` 应绑定到该大使 | F1 扫码场景 | 准备一个从未注册过的新微信账号 | 用新账号手机扫大使推广码，完成登录注册 | `SELECT id, referee_id, referee_confirmed_at FROM tiandao_culture.users WHERE referee_id=32 ORDER BY created_at DESC LIMIT 3` | ✅ 已通过（2026-03-04） |
  | MT-03 | **已锁定推荐人用户扫码不可修改推荐人**（2026-03-13 逻辑变更：锁定时机从"首次支付"改为"首次签合同"，以 `referee_confirmed_at` 非 NULL 为锁定依据） | F1 扫码边界 | 用 `referee_confirmed_at` 非 NULL 的用户（何日琛 id=32，已于 2026-02-26 签合同锁定） | 用微信开发者工具以编译模式 `pages/auth/login/index?scene=ref%3DTEST01` 模拟扫其他大使推广码并登录 | `SELECT id, referee_id, referee_confirmed_at FROM tiandao_culture.users WHERE id=32` — referee_id 应仍为 36，referee_confirmed_at 不变 | ✅ 已通过（2026-03-13 重测；login 日志确认收到 scene=ref=TEST01，但检测到 referee_confirmed_at 已有值，跳过推荐人更新，referee_id 保持 36 不变） |
  | MT-03b | **未购课+已有推荐人用户扫码可自动更换推荐人**（2026-03-06 修复：login.js 老用户流程以前忽略 scene 参数）| F1 扫码边界 | 准备有 referee_id 但 referee_confirmed_at 为 NULL 的用户 | 用该用户扫其他大使推广码→完成登录 | `SELECT id, referee_id, referee_uid, referee_updated_at FROM tiandao_culture.users WHERE id=<该用户id>` — referee_id 应变为新推荐人的 id | ⏳ 待测 |
  | MT-04 | **微信支付回调全链路**：真实支付后 is_reward_granted=1、推荐人积分入账 | F3 S3.2 / F4 奖励验证 | 使用真实微信支付购买课程（user_id=30 或测试账号） | 完成支付 → 等待支付回调 | `SELECT o.order_no, o.is_reward_granted, o.pay_status FROM tiandao_culture.orders o WHERE o.user_id=30 AND o.pay_status=1 ORDER BY o.pay_time DESC LIMIT 3` | ✅ 已通过（2026-03-04，user_id=32 购买道天密训班¥0.01，pay_status=1，is_reward_granted=1） |
  | MT-05 | **预约操作后 booked_quota 递增**：调用 createAppointment 后 class_records.booked_quota 应+1，且 appointments 新增 status=0 记录 | F7 S7.1/S7.2 | user_id=30 有 user_courses，选 status=1 排期 | 小程序进入课程详情→选择排期→点击预约 | `SELECT cr.id, cr.booked_quota, (SELECT COUNT(*) FROM tiandao_culture.appointments a WHERE a.class_record_id=cr.id AND a.status IN(0,1)) as cnt FROM tiandao_culture.class_records cr WHERE cr.id=<排期id>` | ✅ 已通过（2026-03-04，user_id=32，312课程，class_record_id=51，booked_quota 0→1，appointment id=54 status=0） |
  | MT-06 | ~~**取消预约后 booked_quota 递减**~~ **已废弃**（2026-03-02：取消预约功能已移除） | F7 | — | — | — | ❌ 废弃 |
  | MT-07 | **后台批量签到（仅沙龙课程）**：batchCheckin 后沙龙课程 appointments.status 从 0→1，checkin_time 有值（非沙龙课程不使用此功能） | F7 S7.2d | 存在 status=0 的预约记录 | 后台→预约管理→勾选多条待上课→批量签到 | `SELECT a.id, a.status, a.checkin_time, uc.attend_count FROM tiandao_culture.appointments a JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id WHERE a.user_id=30 AND a.status=1 ORDER BY a.checkin_time DESC LIMIT 5` | ✅ 已通过（2026-03-04 MCP JWT触发 batchCheckin appointment_ids=[50]：success_count=1✓；DB验证 id=50 status=0→1，checkin_time=2026-03-04 13:02:31，attend_count=0→1✓） |
  | MT-07b | **后台单次签到（仅沙龙课程）**：沙龙课程点击签到按钮后 appointments.status=1，checkin_time 有值（非沙龙课程在详情中使用每日签到） | F7 S7.2c | 存在 status=0 的预约记录 | 后台→预约管理→找到单条待上课记录→点击"签到" | `SELECT a.id, a.status, a.checkin_time, uc.attend_count FROM tiandao_culture.appointments a JOIN tiandao_culture.user_courses uc ON uc.user_id=a.user_id AND uc.course_id=a.course_id WHERE a.user_id=30 AND a.status=1 ORDER BY a.checkin_time DESC LIMIT 3` | ✅ 已通过（2026-03-04 MCP JWT触发 updateAppointmentStatus id=36 status=1：attend_count=8→9✓；DB验证 status=0→1，checkin_time=2026-03-04 13:02:04，attend_count 日志 new_count=9✓） |
  | MT-07c | **attend_count 初始值验证**：新购买课程后 user_courses.attend_count=0（修复前 Bug：初始值为 1） | F3 S3.10 | 有新购买课程记录（buy_time ≥ 2026-03-01） | 购买任意课程→支付回调触发→查询 user_courses | `SELECT id, course_id, attend_count, buy_time FROM tiandao_culture.user_courses WHERE user_id=30 ORDER BY id DESC LIMIT 3` — attend_count 应为 0 | ✅ 已通过（2026-03-04，user_id=32 购买道天密训班，user_courses.attend_count=0） |
  | MT-08 | **推荐初探班奖励-解冻场景**：推荐人有frozen>0时购买初探班，应解冻unfreeze_per_referral到available，不发功德分/积分 | 奖励验证 | 推荐人frozen>0，购买初探班 | 小程序购买初探班→等待支付回调 | `SELECT u.cash_points_frozen, u.cash_points_available, u.merit_points FROM tiandao_culture.users u WHERE u.id=<推荐人id>` + `SELECT type, amount FROM tiandao_culture.cash_points_records WHERE order_no='<订单号>' AND user_id=<推荐人id>` — type应为2(解冻) | ✅ 已通过（2026-03-05；user_id=33 frozen:1688→0，available:1688→3376，merit_points=1.10不变；cash_points_records type=2 amount=1688✓；奖励触发路径：支付→待签约→合同审核通过→grantRefereeRewardAfterSign） |
  | MT-09 | **推荐初探班奖励-功德分场景**：推荐人frozen=0且merit_rate_basic>0时购买初探班，应按比例发功德分 | 奖励验证 | 推荐人frozen=0，等级配置merit_rate_basic>0 | 小程序购买初探班→等待支付回调 | `SELECT merit_points FROM tiandao_culture.users WHERE id=<推荐人id>` + `SELECT source, amount FROM tiandao_culture.merit_points_records WHERE order_no='<订单号>'` | ✅ 已通过（2026-03-05；user_id=33 merit_points:0.80→1.10，+0.30=1.00×30%；merit_points_records source=1 amount=0.30✓；frozen不变=0✓；奖励触发路径：支付→待签约→合同审核通过→grantRefereeRewardAfterSign） |
  | MT-10 | **推荐密训班奖励-不消耗冻结**：推荐人有frozen>0时购买密训班，应按比例发奖励（功德分或积分），frozen不变 | 奖励验证 | 推荐人frozen>0，购买密训班 | 小程序购买密训班→等待支付回调 | `SELECT cash_points_frozen, cash_points_available, merit_points FROM tiandao_culture.users WHERE id=<推荐人id>` — frozen应不变 | ✅ 已通过（2026-03-05；user_id=33 frozen=1688在密训班购买(order_id=121)后保持不变✓；无cash_points_records解冻记录✓；代码审查：解冻条件`course.type===1`明确排除type=2密训班；备注：密训班¥0.01×20%=0.002→四舍五入=0，merit_records未插入但is_reward_granted=1，逻辑正确） |
  | MT-11 | **奖励互斥验证**：不应同时产生功德分记录和积分记录 | 奖励验证 | 任意等级推荐人，购买任意课程 | 支付完成后查询 | `SELECT COUNT(*) as merit_cnt FROM tiandao_culture.merit_points_records WHERE order_no='<订单号>'` + `SELECT COUNT(*) as cash_cnt FROM tiandao_culture.cash_points_records WHERE order_no='<订单号>'` — 两者不应同时>0 | ✅ 已通过（2026-03-05；MT-09订单merit_cnt=1/cash_cnt=0✓；MT-08订单merit_cnt=0/cash_cnt=1✓；两者均不同时>0，互斥逻辑正确） |
  | MT-12 | **密训班赠课验证**：购买密训班后user_courses应同时有is_gift=1的初探班记录 | 赠课验证 | 购买密训班(type=2, included_course_ids=[1]) | 小程序购买密训班→等待支付回调 | `SELECT course_id, is_gift, source_order_id FROM tiandao_culture.user_courses WHERE user_id=<uid> ORDER BY id DESC LIMIT 5` — 应有is_gift=1,course_id=1 | ✅ 已通过（2026-03-04，user_id=32，order_id=109，user_courses id=37 is_gift=1 course_id=1） |
  | MT-13 | **后台等级配置互斥校验**：初探班功德率和积分率同时>0时应报错 | 后台校验 | 登录admin后台 | 等级配置→编辑→同时填功德率和积分率→保存 | 应提示"不能同时大于0" | ✅ 已通过（2026-03-04） |
  | MT-14 | **后台等级配置倍数校验**：frozen_points不是unfreeze_per_referral整数倍时应报错 | 后台校验 | 登录admin后台 | 等级配置→编辑→设置非倍数关系→保存 | 应提示"必须是整数倍" | ✅ 已通过（2026-03-04） |
  | MT-15 | **大使申请写操作（F5B apply）**：调用 `ambassador.apply` 应创建 status=0 申请，has_application 变为 true | F5B `apply` | user_id=34 (level=0，无待审核申请) | 使用 F5B openid 调用 apply (targetLevel=1, real_name='孙海荣', phone填真实值) | `SELECT id, user_id, target_level, status FROM tiandao_culture.ambassador_applications WHERE user_id=34 ORDER BY id DESC LIMIT 1` — 应出现 status=0 记录 | ✅ 已通过（2026-03-04） |
  | MT-16 | **还原 MT-15 数据（驳回申请）**：驳回 MT-15 产生的申请，使 user_id=34 回到无申请状态，F5B 方可再次正常运行 | F5B 数据还原 | MT-15 完成后 | 后台→大使管理→申请列表→找 user_id=34 待审核→驳回 | `SELECT status FROM tiandao_culture.ambassador_applications WHERE user_id=34 ORDER BY id DESC LIMIT 1` — status 应为 2 | ✅ 已通过（2026-03-04） |

  | MT-17 | **小程序申请退款（未签合同）**：用户在智能客服页点击"退款"→ 选择已支付未签合同的课程 → 填写原因 → 提交，`orders.refund_status` 应变为 1 | F13 S13.1 | user_id=30，存在 pay_status=1 且 contract_signed=0 的课程订单 | 小程序智能客服页→退款→选课程→填原因→提交 | `SELECT order_no, refund_status, refund_reason, refund_amount FROM tiandao_culture.orders WHERE user_id=30 AND refund_status=1 ORDER BY id DESC LIMIT 3` | ✅ 已通过（2026-03-04，user_id=32，order_id=61「更新课程_测试」¥1，refund_status=1，refund_reason="测试退"） |
  | MT-18 | **退款合同拦截验证**：已签署学习合同的课程申请退款应被拦截，`refund_status` 不变 | F13 S13.2 | user_id=30，存在 contract_signed=1 的 user_courses | 小程序退款申请页→选择已签合同的课程 | 应弹出提示"已签署学习合同，无法退款"；`SELECT refund_status FROM tiandao_culture.orders WHERE user_id=30 AND order_no='<该订单号>'` — refund_status 应仍为 0 | ✅ 已通过（2026-03-04，user_id=32，order_id=81「312」已签合同，弹出"无法退款"提示，refund_status 仍为 0） |
  | MT-19 | **后台驳回退款**：管理员在退款管理页驳回 refund_status=1 的申请，`refund_status` 变为 4，小程序状态页显示"已驳回" | F13 S13.3 | 存在 refund_status=1 的订单（依赖 MT-17） | 后台→订单管理→退款管理→找到待审核记录→驳回→填写驳回原因 | `SELECT refund_status, refund_reject_reason, refund_audit_admin_id, refund_audit_time FROM tiandao_culture.orders WHERE refund_status=4 ORDER BY refund_audit_time DESC LIMIT 3` | ✅ 已通过（2026-03-04，order_id=61，refund_status=4，reject_reason="没为什么"，audit_admin_id=5） |
  | MT-20 | **后台标记已转账（完成退款）**：上传发票后标记已转账，`refund_status=3`、`pay_status=4`，业务数据自动回滚（user_courses 失效） | F13 S13.4 | 存在 refund_status=1 的订单（依赖 MT-17），准备一张测试发票图片/PDF | 后台→退款管理→找到待审核记录→标记已转账→上传发票→保存 | `SELECT refund_status, pay_status, refund_time, refund_invoice_file_id FROM tiandao_culture.orders WHERE order_no='<订单号>'` + `SELECT status FROM tiandao_culture.user_courses WHERE order_id=<order_id>` — refund_status=3, pay_status=4, user_courses.status=2 | ✅ 已通过（2026-03-04，order_id=54，refund_status=3，pay_status=4，发票已上传，refund_time=2026-03-04 20:01:58） |
  | MT-21 | **退款后业务回滚验证**：course_type=1 退款后 user_courses.status 应变为 2，待上课预约 appointments.status 应变为 4（已取消），booked_quota 归零 | F13 S13.5 | MT-20 完成后 | 执行 MT-20 后立即查询 | `SELECT uc.status, uc.course_id FROM tiandao_culture.user_courses uc WHERE uc.source_order_id=<order_id>` + `SELECT a.status, a.cancel_reason FROM tiandao_culture.appointments a WHERE a.user_id=32 AND a.status=4 ORDER BY a.id DESC LIMIT 5` | ✅ 已通过（2026-03-04，order_id=52，补充实现了预约取消+booked_quota回退逻辑；appointment status=4，cancel_reason="订单退款"，booked_quota 1→0，user_courses status=2） |
  | MT-22 | **排课状态自动更新（定时任务）**：`autoUpdateScheduleStatus` 每天 0 点触发，验证排课状态流转：未开始(1)→进行中(2)、进行中(2)→已结束(3)，以及已结束排期中待上课预约自动标记为缺席(status=2) | 定时任务验证 | 存在 `class_date <= 今天` 且 `status=1` 的排期；存在 `class_date < 今天` 且 `status=2` 的排期；存在对应的 `status=0` 预约记录 | 等待次日 0 点后查询，或后台手动触发 `autoUpdateScheduleStatus` 云函数一次 | `SELECT id, class_date, class_end_date, status FROM tiandao_culture.class_records WHERE class_date <= CURDATE() ORDER BY id DESC LIMIT 10` — status 应已更新；`SELECT a.id, a.status FROM tiandao_culture.appointments a JOIN tiandao_culture.class_records cr ON a.class_record_id=cr.id WHERE cr.status=3 AND a.status=2 ORDER BY a.id DESC LIMIT 5` — 应有缺席记录 | ✅ 已通过（2026-03-04 MCP触发验证：cr36 class_date=今天 status=1→2✓；cr25 class_end_date=2026-03-03 status=2→3✓；cr37 class_end_date=2026-03-03 status=2→3✓；幂等性验证通过（第二次触发 toOngoing=toEnded=0）） |
  | MT-23 | ~~**订单级推荐人修改（支付前）**~~（已废弃 2026-03-09：推荐人改为仅扫码绑定，用户端无修改入口。订单推荐人直接从用户表读取） | — | — | — | — | ❌ 已废弃 |
  | MT-24 | **推荐人资格验证失败（准青鸾推荐密训班）**：level=1（准青鸾）大使作为推荐人，用户尝试购买 type=2（密训班）课程，系统应拒绝创建订单并提示"该推荐人暂时只能推荐初探班课程" | F3 / F1 资格验证边界 | 存在 ambassador_level=1 的大使账号（可用 user_id=34，需先升至 level=1）；user_id=30 的 referee_id 设为该准青鸾大使 | 小程序→密训班课程详情→立即购买→系统验证推荐人资格 | 应弹出错误提示，`orders` 表不应新增任何记录：`SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND order_no LIKE 'ORD%' ORDER BY id DESC LIMIT 1`（条数不变）| ✅ 已通过（2026-03-04） |
  | MT-25 | **课程续期兑换（exchangeCourse）**：使用功德分兑换课程复训名额，`merit_points_records` 新增 source=6 扣减记录，`user_courses.expire_at` 或 `attend_count` 更新，`users.merit_points` 相应减少 | 商城兑换-课程 | user_id=32，功德分充足；商城中存在课程类型商品 | 小程序商学院→商城→选择课程续期商品→确认兑换 | `SELECT id, source, amount, created_at FROM tiandao_culture.merit_points_records WHERE user_id=32 AND source=6 ORDER BY id DESC LIMIT 5` — 应有新 source=6 负值记录；`SELECT merit_points FROM tiandao_culture.users WHERE id=32` — 余额减少 | ✅ 已通过（2026-03-13；user_id=32 兑换 course_id=21，merit_points_records id=128 source=6 amount=-10，user_courses id=61 updated_at=2026-03-13 21:04:26；注：原 quota_exchange_records 表名有误，实际写入 merit_points_records） |
  | MT-26 | **签到二维码覆盖式生成（改造后）**：管理员为排期生成签到码，重新生成时覆盖旧记录而非新增。`checkin_qrcodes` 每个排期只保留一条记录 | F7 签到二维码 | 存在 status=1 的排期 | 后台→排课管理→选排期→生成签到码→再次生成签到码 | `SELECT COUNT(*) FROM tiandao_culture.checkin_qrcodes WHERE class_record_id=<id>` — 应为1；第二次生成后 qrcode_url 应更新 | ⏳ 重测（日签到改造后逻辑变更） |
  | MT-26b | **非沙龙扫码日签到**：学员扫码后在 `appointment_checkins` 插入当日签到记录，`appointments.status` 保持 0 不变 | F7 日签到 | 非沙龙排期(type≠4)，有 status=0 的预约，当天在排期日期范围内 | 学员扫码→小程序签到页→显示"今日签到成功" | `SELECT * FROM tiandao_culture.appointment_checkins WHERE appointment_id=<id> AND checkin_date=CURDATE()` — 应有1条记录 checkin_type=1；`SELECT status FROM tiandao_culture.appointments WHERE id=<id>` — 应仍为 0 | ⏳ 待测 |
  | MT-26c | **非沙龙重复扫码签到**：同一天重复扫码，应返回"今日已签到"而非报错 | F7 日签到 | 同一天已有签到记录 | 学员同一天再次扫码 | 返回 `already_checked=true`，`appointment_checkins` 表无重复记录（唯一索引保护） | ⏳ 待测 |
  | MT-26d | **排期外扫码忽略**：排期日期范围外扫码，返回"不在签到时间内" | F7 日签到 | 当天不在 class_date~class_end_date 范围内 | 学员扫码 | 返回错误"不在签到时间内"，无签到记录插入 | ⏳ 待测 |
  | MT-26e | **后台补签与取消签到**：管理员在预约详情中为学员特定日期补签/取消签到 | F7 日签到 | 非沙龙预约，存在排期日期范围 | 后台→预约管理→查看详情→点击未签到日期的"补签"按钮→确认；然后点击"取消签到" | 补签后 `appointment_checkins` 新增 checkin_type=2 记录；取消后该记录被删除 | ⏳ 待测 |
  | MT-26f | **预约创建时 attend_count+1（改造后）**：创建预约后 `user_courses.attend_count` 立即+1 | F7 attend_count | 用户已购课程 | 小程序→预约课程排期 | `SELECT attend_count FROM tiandao_culture.user_courses WHERE user_id=? AND course_id=?` — 预约前后 attend_count 增加1 | ⏳ 待测 |
  | MT-26g | **取消预约时 attend_count-1（改造后）**：管理员取消非沙龙预约后 attend_count-1，同时清理该预约的所有签到记录 | F7 attend_count | 存在非沙龙预约 | 后台→预约管理→取消预约 | attend_count 减少1；`appointment_checkins` 中该预约的所有记录被删除 | ⏳ 待测 |
  | MT-26h | **签到不触发积分解冻（BUG修复确认）**：扫码签到后不应触发推荐人积分解冻 | F7 BUG修复 | 有推荐人的用户 | 学员扫码签到 | `cash_points_records` 无新增 type=2 记录（解冻只在合同审批时触发） | ⏳ 待测 |
  | MT-27 | **复训预约流程**：`attend_count >= 1` 的用户再次预约同一课程，应触发复训费支付（`is_retrain=1`），支付成功后 `appointments` 新增记录，`attend_count` 再次 +1 | F7 复训预约 | user_id=30 对某课程已有 `attend_count >= 1`（已上过课）；存在该课程的 status=1 排期；课程设置了 `retrain_price > 0` | 小程序→课程计划→选择已上过课的课程排期→点击预约→系统提示需支付复训费→完成支付 | `SELECT attend_count FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=<course_id>` — attend_count 增加；`SELECT is_retrain, status FROM tiandao_culture.appointments WHERE user_id=30 ORDER BY id DESC LIMIT 3` — 应有 is_retrain=1 记录 | ✅ 已通过（2026-03-03 user_id=32；course_id=2 密训班；复训订单 ORD202603030916390868 pay_status=1；回调创建 appointments is_retrain=1；attend_count=1→2 待签到后触发；订阅授权弹窗在支付页 tap 上下文触发✓） |
  | MT-28 | **预览模式功能拦截验证**：`profile_completed=0` 的用户尝试购买课程/预约/申请大使，系统应拒绝并提示"请先完善个人资料" | F1 预览模式边界 | 准备一个 profile_completed=0 的测试账号（或将某账号临时设为0）| 用预览模式账号：① 点击购买课程→应被拦截；② 点击预约→应被拦截；③ 点击申请大使→应被拦截 | 三个操作均应弹出"请先完善个人资料"提示；`orders`、`appointments`、`ambassador_applications` 表均无新增记录 | ✅ 已通过（2026-03-04 user_id=32；① 购买拦截✓（order/createOrder 后端 403）；② 预约拦截：测试发现沙龙课程（type=4，没上过课的）未被拦截——已修复：`createAppointment.js` 新增 profile_completed 检查，所有预约均返回 403；③ 申请大使前端已拦截✓；`appointments` 表无新增记录✓；⚠️ 注：路由守卫 `installRouteGuard` 函数定义但从未调用，拦截全依赖后端 API 403 返回） |
  | MT-29 | **协议到期与续约**：管理员在协议管理页查看 30 天内到期的大使协议，并为到期大使手动续签 1 年，`contract_signatures.contract_end` 应更新，发送续签成功通知 | 协议到期管理 | 存在 `contract_end` 在未来 30 天内的 `contract_signatures` 记录 | 后台→协议管理→到期提醒→找到即将到期记录→点击"手动续签"→确认 1 年 | `SELECT id, user_id, contract_end, status FROM tiandao_culture.contract_signatures WHERE user_id=<大使id> ORDER BY id DESC LIMIT 1` — contract_end 应延长约 365 天 | ✅ 已通过（2026-03-04） |
  | MT-30 | **F12 奖励发放验证（合同流程改造后）**：⚠️ 原流程已废弃（用户线上签署课程合同→奖励触发）。改为后台管理员录入合约（`adminCreateCourseContract`）后自动触发推荐人奖励发放。需在后台"合约管理→录入合约"中操作。2026-03-13 同步修复：删除 `grantRefereeReward.js` 中 `can_earn_reward` 硬限制，奖励发放改为仅依据费率配置。 | F12 S12.N2 | user_id=32，course_id=19；后台选择用户+课程+上传合同照片 | 后台→合约管理→录入合约Tab→选用户→选课程→上传照片→提交 | `SELECT id, is_reward_granted, reward_granted_at FROM tiandao_culture.orders WHERE user_id=32 AND related_id=19 AND order_type=1 AND pay_status=1 ORDER BY id DESC LIMIT 1` — is_reward_granted=1，reward_granted_at 非 NULL | ✅ 已通过（2026-03-13；order id=138 related_id=19，is_reward_granted=1，reward_granted_at=2026-03-13 21:20:04；user_courses id=62 contract_signed=1；奖励路径：adminCreateCourseContract → grantRefereeRewardAfterSign；普通用户（ambassador_level=0）also触发奖励✓） |
  | MT-31 | **支付成功后返回不可重复支付（导航栈修复）**：支付成功→跳转订单详情→点击返回，应回到课程详情页（非订单确认页），不可再次创建订单 | F3 导航修复 | user_id=30，选择一个可购买的课程 | 小程序→课程详情→立即购买→确认订单→支付→支付成功→订单详情→点击返回 | 返回目标页应为课程详情或首页，而非订单确认页；`SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND created_at >= NOW() - INTERVAL 5 MINUTE` — 应只有 1 条新订单，不应有重复创建 | ✅ 已通过（2026-03-04） |
  | MT-32 | **取消支付后跳转待支付页（导航栈修复）**：在支付页取消微信支付弹窗→应跳转到待支付页面（可重新发起支付），不应回到订单确认页 | F3 导航修复 | user_id=30，创建待支付订单 | 小程序→课程详情→立即购买→确认订单→支付页→取消微信支付弹窗 | 应自动跳转到待支付页面，显示订单号和"立即支付"按钮；从待支付页返回不应回到订单确认页 | ✅ 已通过（2026-03-04） |
  | MT-33 | **合同签署成功后返回不可重复签署（导航栈修复）**：大使合同签署成功→跳转合同详情→点击返回，应回到大使中心（非签署页面），不可再次签署 | F6/F12 导航修复 | user_id=30，存在待签署的大使合同或课程合同 | 小程序→进入合同签署页→完成签名→确认签署→签署成功→合同详情→点击返回 | 返回目标页应为大使中心或课程详情，而非合同签署页；`SELECT COUNT(*) FROM tiandao_culture.contract_signatures WHERE user_id=30 AND signed_at >= NOW() - INTERVAL 5 MINUTE` — 应只有 1 条新签署记录 | ✅ 已通过（2026-03-04 user_id=32） |
  | MT-34 | **大使升级支付后返回不可重复下单（导航栈修复）**：升级指南页创建升级订单→跳转支付→支付成功/取消→返回，不应回到升级指南页重新创建订单 | F5 导航修复 | user_id=30，满足大使升级条件（如 level=1→2） | 小程序→大使中心→升级指南→支付升级费→支付成功→订单详情→返回 | 返回目标页应为大使中心（非升级指南页）；`SELECT COUNT(*) FROM tiandao_culture.orders WHERE user_id=30 AND order_type=4 AND created_at >= NOW() - INTERVAL 5 MINUTE` — 应只有 1 条升级订单 | ✅ 已通过（2026-03-04 user_id=32） |
  | MT-35 | **预约确认后不可重复提交（防双击 + 复训路径导航栈修复）**：首次预约/复训预约流程中，提交后不可重复提交 | F7 导航修复 | user_id=30，选择一个可预约的排期 | 小程序→课程详情→选排期→预约确认→确定预约→快速连续点击确定按钮 | 应只创建 1 条预约记录；`SELECT COUNT(*) FROM tiandao_culture.appointments WHERE user_id=30 AND created_at >= NOW() - INTERVAL 5 MINUTE` — 应为 1 | ✅ 已通过（2026-03-04） |
  | MT-36 | **密训班赠课-用户无该课程**：购买密训班后，赠送课程应以 is_gift=1 新建 user_courses 记录，expire_at 按赠送课程 validity_days 计算 | F3 赠课新建 | 购买 type=2 密训班（included_course_ids 有值），用户尚未拥有赠送课程 | 小程序→密训班课程详情→购买→完成支付 | `SELECT id, course_id, is_gift, source_order_id, expire_at, status FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=1 ORDER BY id DESC LIMIT 3` — 应有 is_gift=1 记录 | ✅ 已通过（2026-03-04，user_id=32，user_courses id=37 is_gift=1 source_order_id=109 pending_days=1） |
  | MT-37 | **密训班赠课-用户已有该课程（有效期叠加）**：用户已有赠送课程记录时，不新建记录，仅在原 expire_at 上叠加 validity_days 天 | F3 赠课叠加 | 用户已有赠送课程的 user_courses 记录（status=1）；购买 type=2 密训班 | 记录原 expire_at → 购买密训班 → 比较 expire_at 变化 | `SELECT id, expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND course_id=<赠送课程id> AND status=1` — expire_at 应增加约 validity_days 天 | ✅ 已通过（2026-03-05，user_id=32，user_courses id=43 expire_at 2026-04-04→2026-04-05 +1天） |
  | MT-38 | **密训班兑换赠课**：用功德分/积分兑换密训班后，赠送课程逻辑应与购买一致（新建或叠加有效期） | F3 兑换赠课 | 用户功德分/积分充足，商城有密训班课程 | 小程序→商城→兑换密训班课程 | `SELECT id, course_id, is_gift, source_course_id, expire_at, updated_at FROM tiandao_culture.user_courses WHERE user_id=32 AND (is_gift=1 OR course_id=2) ORDER BY updated_at DESC LIMIT 5` — 兑换后 is_gift=1 赠课 expire_at 应增加 | ✅ 已通过（2026-03-13；user_id=32 兑换密训班(course_id=2)，user_courses id=63 is_gift=0 created 21:38:55；gift course id=43 is_gift=1 source_course_id=2 updated_at=21:38:55 expire_at=2026-04-10；merit_points_records id=129 source=6 amount=-0.01；赠课叠加有效期逻辑✓） |
  | MT-39 | **退款校验-赠送课程合同拦截**：赠送课程已签合同时，密训班退款应被拦截 | F13 赠课退款拦截 | 用户购买密训班且赠送课程 contract_signed=1 | 小程序→申请退款 | 应提示"赠送课程已签署学习合同，无法退款" | ✅ 功能通过（2026-03-13；拦截逻辑生效，refund_status 未变为 1；⚠️ 提示语不精确，实际返回"该课程已签署学习合同，无法退款。如有疑问请联系客服。"而非"赠送课程已签署..."；提示语可后续优化但不影响核心拦截功能） |
  | MT-40 | **退款回滚-赠送课程新建记录失效**：退款后 is_gift=1 的赠送 user_courses 应 status=2 | F13 赠课退款回滚A | MT-36 完成后，对该密训班订单执行退款 | 后台→退款管理→标记已转账 | `SELECT status FROM tiandao_culture.user_courses WHERE is_gift=1 AND source_order_id=<order_id>` — status=2 | ✅ 已通过（order_id=109，id=37 status=2）|
  | MT-41 | **退款回滚-赠送课程有效期回退**：用户已有赠送课程+叠加有效期后退款，expire_at 应减回 validity_days 天 | F13 赠课退款回滚B | MT-37 完成后，记录叠加后 expire_at，对密训班订单退款 | 后台→退款管理→标记已转账 | `SELECT expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND course_id=<赠送课程id> AND status=1` — expire_at 应减少约 validity_days 天 | ✅ 已通过（2026-03-05，order_id=127，user_courses id=43 从 2026-04-05 回退到 2026-04-04；markRefundTransferred Path C 生效） |
  | MT-42 | **课程上架锁定验证**：课程上架后，后台编辑对话框所有字段应置灰不可编辑 | 后台功能 | 后台存在 status=1 的课程 | 后台→课程列表→点击上架课程的"编辑" | 所有表单项应 disabled，显示"课程已上架"警告 | ✅ 已通过（2026-03-04） |
  | MT-43 | **课程上架确认弹窗验证**：课程从下架切换到上架时应弹出确认框 | 后台功能 | 后台存在 status=0 的课程 | 后台→课程列表→点击下架课程的"上架" | 应弹出"课程上架后不能修改任何字段，确定好再上架"确认框 | ✅ 已通过（2026-03-04） |
  | MT-44 | **新课程默认下架验证**：新创建的课程 status 应为 0 | 后台功能 | 登录admin后台 | 后台→课程列表→新增课程→填写信息→保存 | `SELECT status FROM tiandao_culture.courses ORDER BY id DESC LIMIT 1` — status=0 | ✅ 已通过（2026-03-04，id=42 "aaa" status=0） |
  | MT-45 | **课程详情页赠送课程 tab 展示**：密训班课程详情页应显示"赠送+课程名称" tab | 小程序展示 | 存在 included_course_ids 有值的上架密训班 | 小程序→密训班课程详情页 | 应在标签页中看到"赠送XXX"tab，点击后展示赠送课程信息 | ✅ 已通过（2026-03-04 user_id=32；赠送课程 tab 显示✓；发现 tab 内重复展示了课程介绍（gc.description）文案——已修复：`detail/index.vue` 删除赠送 tab 内的"📖 课程介绍"block，仅保留课程卡片和大纲） |
  | MT-46 | **沙龙开课当天自动签到验证**：将沙龙排期 class_date 改为今天后触发 `autoUpdateScheduleStatus`，`appointments.status` 应从 0 自动变为 1（已签到），`checkin_time` 有值 | F14 S14.7 | 存在沙龙排期（course.type=4），appointments.status=0 | ① MCP 执行：`UPDATE tiandao_culture.class_records SET class_date=CURDATE(), class_end_date=CURDATE() WHERE id=<排期id>` ② 后台手动触发云函数 `autoUpdateScheduleStatus` | `SELECT a.id, a.status, a.checkin_time FROM tiandao_culture.appointments a WHERE a.class_record_id=<排期id> AND a.user_id=30` — status=1，checkin_time 非 NULL | ✅ 已通过（2026-03-04 当日 0 点定时触发验证：沙龙 cr42（course_id=41）当日 class_date=2026-03-02 ≤ today，触发 status=1→2→自动签到→status=3；本次手动触发幂等验证 salonAutoCheckin=0（已全部处理）；F14 S14.7 历史验证 checkin_time=2026-03-03 11:50:08✓；⚠️ 注：appointments 因 fk_appointments_user_course CASCADE 级联删除，无法事后查询 checkin_time） |
  | MT-47 | **沙龙结束后硬删除清理验证**：排期 class_end_date 过期后触发 `autoUpdateScheduleStatus`，`courses`/`class_records`/`user_courses` 应被硬删除，`appointments` 保留 | F14 S14.8 | MT-46 完成后；class_end_date 改为昨天 | ① MCP 执行：`UPDATE tiandao_culture.class_records SET class_date=DATE_SUB(CURDATE(),INTERVAL 2 DAY), class_end_date=DATE_SUB(CURDATE(),INTERVAL 1 DAY) WHERE id=<排期id>` ② 触发 `autoUpdateScheduleStatus` | `SELECT COUNT(*) FROM tiandao_culture.courses WHERE id=<课程id>` — 应为 0；`SELECT COUNT(*) FROM tiandao_culture.appointments WHERE course_id=<课程id>` — 应 ≥1 | ✅ 已通过（2026-03-04 MCP触发验证：salonCleanedCourses=1、salonCleanedRecords=1；course_id=41 已删除✓；class_records id=42 已删除✓；user_courses course_id=41 已删除✓；**设计修复（2026-03-04）**：`fk_appointments_user_course` 已从 CASCADE 改为 SET NULL，`user_course_id` 字段允许 NULL，今后沙龙清理时 appointments 将保留，user_course_id 置 NULL） |
  | MT-48 | **"我的"首页统计数字 99+ 显示**：订单/预约/课程/协议数量超过 99 时，首页统计数字应显示"99+"而非实际数字 | 前端展示 | user_id 在各表有 >99 条记录（需临时插入测试数据或确认显示逻辑） | 小程序→"我的"首页→查看统计数字 | 若数量 >99 应显示"99+"；若 ≤99 显示实际数字 | ✅ 已通过（2026-03-04） |
  | MT-49 | **列表页滚动分页加载**：我的订单/预约/课程列表每次加载 20 条，滑到底部自动加载下一页，最多 99 条。加载完毕显示"已加载全部" | 前端分页 | user_id=30，各列表有数据 | 小程序→我的订单/预约/课程→向下滚动 | 初始加载 20 条→滑到底部加载更多→最多 99 条后显示"已加载全部" | ✅ 已通过（2026-03-04） |
  | MT-50 | **协议列表最多 99 条展示**：我的协议页一次性加载但客户端截取前 99 条，底部显示"已加载全部" | 前端展示 | user_id=30 有协议记录 | 小程序→我的→我的协议 | 列表正常展示，底部有"已加载全部"提示 | ✅ 已通过（2026-03-04） |
  | MT-51 | **订阅消息弹窗真机验证（普通预约路径）**：`appointment-confirm` 页点击"立即预约"（非复训费场景），真机应弹出「订阅一次以下消息通知 · 订阅课程开课提醒」弹窗；修复背景：原 `handleSubmit` 为 async 函数导致微信点击态丢失，改为同步函数后修复 | 前端真机 | 存在 attend_count=0 的课程（首次预约）且已登录 | 真机小程序→课程详情→选择排期→进入预约确认页→点击"立即预约" | 应弹出订阅消息授权弹窗；控制台日志 `[订阅授权-预约] complete:` 含 `"accept"` 或 `"reject"`，无 errCode | ✅ 已通过（2026-03-04） |
  | MT-52 | **订阅消息弹窗真机验证（复训支付路径）**：`payment` 页点击"立即支付"（isRetrain=1），真机应弹出订阅弹窗后继续发起支付；修复背景：原 `handlePay` 为 async 函数导致微信点击态丢失，改为同步函数后修复 | 前端真机 | 存在 attend_count≥1 的课程（复训场景）且已登录 | 真机小程序→选排期→预约确认→确认复训费→支付确认页→点击"立即支付" | 先弹出订阅授权弹窗，用户操作后继续弹出微信支付收银台；控制台日志 `[订阅授权] complete:` 含 `"accept"`，`requestSubscribeMessage:ok` | ✅ 已通过（2026-03-04） |
  | MT-51 | **创建排期：上课日期不能早于今天（前端拦截）**：后台排期管理，新增排期时选择昨天或更早的上课日期，提交前前端应弹出"上课日期不能早于今天"校验错误，不发送接口请求 | F7 排期管理 | 进入后台排期管理页面，点击"新增排期" | 上课日期选择昨天（`CURDATE()-1`），点击保存 | 前端表单校验提示"上课日期不能早于今天"，不调用 createClassRecord 接口 | ✅ 已通过（2026-03-04，前端拦截弹出提示，无接口请求） |
  | MT-52 | **创建排期：上课日期不能早于今天（云函数兜底拦截）**：绕过前端直接调用 `createClassRecord`，传入 `classDate` 早于今天，接口应返回参数错误 | F7 排期管理 | 直接调用云函数 | 调用 `course.createClassRecord { courseId: 1, classDate: "2025-01-01" }` | 返回 `paramError: 上课日期不能早于今天` | ✅ 已通过（2026-03-04 MCP JWT触发 createClassRecord classDate=2025-01-01：code=400，message="上课日期不能早于今天"✓） |
  | MT-53 | **~~编辑排期：修改上课日期~~（已变更）取消排期验证**：`updateClassRecord` 现仅允许 `status=0`（取消排期），其他修改操作已禁止。取消排期后应自动取消所有待上课预约，复训预约应释放资格（retrain_credit_status=1） | F7 排期管理 | 存在至少一条 status=1 的排期，且有关联预约 | 调用 `course.updateClassRecord { id: <排期id>, status: 0 }` | 排期 status=0；关联预约全部 status=3；复训预约的订单 retrain_credit_status=1 | ⏳ 重测（2026-03-06 updateClassRecord 仅允许 status=0 取消，需重测） |

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

  ### 规则 10：前置流程完成后，必须立即触发并验证 F 类延迟场景

  > **触发时机（含两类，缺一不可）**：
  > 1. **流程级触发**：每当完成一个流程（FX）的 DB 交叉验证后，扫描规则 4 清单中所有 ⏳ 条目
  > 2. **写操作级触发（新增）**：每当通过 MCP `executeWriteSQL` 对数据库执行任何写操作（INSERT / UPDATE，包括造测试数据）后，**立即**对照规则 4 清单，判断本次变更是否满足任何 F 类场景的前置条件

  > **⛔ "写操作级触发"是本规则最容易遗漏的场景。** 即使处于测试准备阶段（规则 PRE），造数据时修改了 booked_quota、attend_count 等被追踪字段，也必须立即触发 F 类扫描，不得以"还没到流程验证阶段"为由跳过。

  #### 核心规则

  **⛔ 凡前置条件已满足的 F 类场景，必须在当前轮次内立即补测，不得推迟到下一次对话。**

  #### 触发判断方式

  AI 在以下两种情况下，**必须逐条检查**规则 4 清单中所有 ⏳ 条目：

  1. **完成流程验证后** — 判断「需在哪里验证」列是否与刚完成的流程匹配
  2. **执行任何 DB 写操作后** — 判断本次修改的表/字段是否出现在某条目的「验证 SQL / 说明」中，若出现则立即执行该 SQL 补测

  #### 触发后的执行步骤

  ```
  1. 告知用户：「[流程 FX] 完成，发现以下 F 类延迟场景前置条件已满足，将立即补测：」
  2. 列出所有待补测的 F 类场景（来源流程 + 场景描述）
  3. 执行 MCP 数据库验证（无需重新运行小程序端测试脚本，直接 SQL 交叉验证）
  4. 将验证结果追加到对应流程的 DB 交叉验证记录中
  5. 更新规则 4 跨流程追踪清单的状态（⏳ → ✅ 或 ⚠ 需人工）
  6. 若验证失败，按规则 1/规则 9 流程处理 Bug
  ```

  #### F 类场景登记格式（新增时必须填写「前置条件」列）

  在流程覆盖分析的「未覆盖场景」中，F 类条目必须补充 `前置条件` 说明，便于后续自动触发：

  ```markdown
  | # | 缺失场景 | 分类 | 前置条件（触发规则10的依据） | 补充方式 |
  |---|---------|------|--------------------------|---------|
  | 1 | 密训班赠课 is_gift=1 验证 | F | 需 F3 购买密训班并支付成功（orders.pay_status=1, c.type=2） | 支付后查 user_courses.is_gift |
  | 2 | booked_quota 变化验证 | F | 需 F7 执行预约操作（appointments 新增记录） | 查 class_records.booked_quota 与预约数一致性 |
  ```

  #### 当前已登记的 F 类延迟场景

  | 来源流程 | 场景描述 | 前置条件（触发依据） | 触发于 | 状态 |
  |---------|---------|------------------|------|------|
  | F2 S2.3 | 密训班赠课 `is_gift=1` 验证：user_courses 中应有 is_gift=1 的初探班记录 | F3 购买密训班且支付成功（orders.pay_status=1, c.type=2）或 F10 | F10 S10.3 | ⏳ 待触发 |
  | F2 S2.4 | `booked_quota` 变化一致性验证：class_records.booked_quota 与 appointments 实际预约数一致 | F7 执行预约操作（createAppointment 成功） | F7 S7.1 | ✅ 已验证（2026-02-27） |

  #### 违规情形

  | 违规操作 | 后果 |
  |---------|------|
  | 完成 F3 后未检查 F2 的 is_gift=1 场景 | 密训班赠课 Bug 永远无法被集成测试捕获 |
  | 仅更新规则 4 状态而不实际执行 SQL 验证 | 状态造假，F 类场景实质未覆盖 |
  | 将已满足前置条件的 F 类场景再次推迟 | 违反规则 10，必须当场处理 |

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
  getProfile → updateProfile → getRefereeInfo → getReferralStats
  注：updateReferee 和 searchReferees 接口已于 2026-03-09 删除，推荐人仅通过扫码绑定
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
    referee_id, referee_confirmed_at, referee_updated_at
    -- ⚠️ 修正 2026-03-04：users 表无 is_referee_confirmed 字段，改用 referee_confirmed_at（非NULL即已确认）
  FROM tiandao_culture.users WHERE id = 30
  ```

  ---

  ### 流程 2: 📚 课程浏览 · 详情 · 购买条件验证

  ```
  getList → getDetail → getMyCourses → getCalendarSchedule → getCaseList → getCaseDetail → getMaterialList
  ```

  **测试目的**：验证课程从列表到详情的完整浏览链路，确认购买状态标记、密训班包含关系正确。新增 getCaseDetail 详情接口验证。

  **涉及表**：`courses`, `user_courses`, `class_records`, `academy_cases`, `academy_materials`

  > ⚠️ **[2026-03-02 重测警告] S2.2 `is_purchased` 断言失败 → 测试数据过期**
  > - **步骤**：S2.2 初探班详情（未购买）
  > - **断言**：未购买课程 `is_purchased` 应为 0 或 false
  > - **实际结果**：`is_purchased=true`（course_id=25，名称="初探班"，uc_id=17, uc_status=1）
  > - **根因**：测试脚本 `firstUnpurchasedType1Course` 最终使用 course_id=25，但用户 ID=30（张三）已购买该课程（`user_courses` uc_id=17，status=1），属测试数据过期问题，**非接口逻辑 Bug**
  > - **DB 验证（2026-03-02）**：用户 30 未购买的 type=1 课程共 12 条：id=4, 6, 8, 9, 10, 11, 12, 19, 20, 21, 23, 27（"[TEST]推荐人冻结积分测试-初探班"）
  > - **修复方案**：在集成测试 HTML 的 F2 配置中，将 S2.2 的 `courseId` 参数更新为 **id=4**（"测试课程"，用户 30 未购买），重跑 F2 即可通过

  **案例模块新增验证步骤（2026-03-01 变更）**：

  | 编号 | 类型 | 接口 | 描述 |
  |------|------|------|------|
  | S2.X1 | 📖 读操作 | `getCaseList` | 验证列表返回全字段（新增 category_label, badge_theme, avatar_theme, student_surname, student_desc, quote, achievements, is_featured, video_url, images） |
  | | 期望 | `category_label` | 非空字符串（如有 category） |
  | | 期望 | `achievements` | Array 类型（已解析 JSON） |
  | | 期望 | 所有返回案例均有封面图 | student_avatar 或 images[0] 至少有一个非空（2026-03-02：14 条无封面测试数据已隐藏 status=0，后台新增校验：发布前必须有封面图） |
  | | 期望 | `student_avatar` | HTTPS CDN URL（非 cloud:// fileID） |
  | | 验证 SQL | `SELECT id, student_name, student_avatar, images FROM tiandao_culture.academy_cases WHERE status=1` | 当前应仅 id=1,2 两条记录，每条均有 student_avatar 或 images 封面 |
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

  -- ⚠️ [2026-03-02 新增] S2.2 用：查询用户 30 未购买的 type=1 课程（用于选取"未购买"测试课程）
  SELECT c.id, c.name, c.type
  FROM tiandao_culture.courses c
  WHERE c.type=1 AND c.status=1
    AND NOT EXISTS (
      SELECT 1 FROM tiandao_culture.user_courses uc
      WHERE uc.course_id=c.id AND uc.user_id=30 AND uc.status=1
    )
  ORDER BY c.sort_order
  -- 期望：应返回用户 30 未购买的 type=1 课程（2026-03-02 DB 验证：id=4,6,8,9,10,11,12,19,20,21,23,27）
  -- 建议：测试脚本 S2.2 的 courseId 参数使用 id=4
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
  | 16 | [S3.6c] exchangeCourse 功德分不足且 use_cash=false 时返回「功德分不够」提示 | §6.19 |
  | 17 | [S3.6d] exchangeCourse 功德分+积分均不足（use_cash=true）时返回「均不足」提示 | §6.19 |
  | 18 | [S3.6e] exchangeGoods 功德分不足（S3.6扣减后余额<价格）时返回拦截提示 | §6.13a |
  | 19 | [S3.7x] cancelExchange 对已取消(status=3)记录二次撤销，应被拦截返回错误 | §6.13b |
  | 20 | [S3.9x] confirmPickup 对已领取(status=2)记录重复确认，应被幂等拦截 | §6.21 |
  | 21 | [S3.9y] confirmPickup 对已取消(status=3)记录确认，应被拒绝返回错误 | §6.21 |
  | 22 | 复训订单 order_type=2：retrain_credit_status 新创建默认 0；支付成功并创建预约后 2；取消预约后 1 | 2026-03-06 复训费保留与取消预约 |

  **多表验证 SQL**：
  ```sql
  -- 订单 + 推荐人 + 奖励记录（已支付订单）
  -- ⚠️ 修正 2026-03-04：referee_confirmed_at 在 users 表（u.referee_confirmed_at），不在 orders 表
  SELECT o.order_no, o.final_amount, o.pay_status, o.referee_id, o.is_reward_granted,
    u.referee_confirmed_at,
    r.real_name as 推荐人, r.ambassador_level as 推荐人等级,
    (SELECT COUNT(*) FROM tiandao_culture.merit_points_records mp WHERE mp.order_no=o.order_no) as 功德分记录,
    (SELECT COUNT(*) FROM tiandao_culture.cash_points_records cp WHERE cp.order_no=o.order_no) as 积分记录
  FROM tiandao_culture.orders o
  LEFT JOIN tiandao_culture.users u ON o.user_id=u.id
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

  -- ✏️ S3.10b [2026-03-06 新增] 复训订单 retrain_credit_status 状态流转验证
  SELECT o.id, o.order_no, o.order_type, o.pay_status, o.retrain_credit_status,
    o.class_record_id, o.related_id as user_course_id
  FROM tiandao_culture.orders o
  WHERE o.order_type = 2
  ORDER BY o.id DESC LIMIT 10
  -- 期望：retrain_credit_status 值为 0（新建）/1（可用，预约已取消）/2（已使用，预约已创建）
  -- 状态流转：新建订单 0 → 支付成功并创建预约 2 → 取消预约 1 → 再次使用资格 2

  -- ✏️ S3.10 [2026-03-01 新增] 购买课程后 attend_count 初始值验证（初始值应为 0）
  SELECT uc.id, uc.user_id, uc.course_id, uc.attend_count, uc.is_gift, uc.buy_time
  FROM tiandao_culture.user_courses uc
  WHERE uc.user_id = 30
  ORDER BY uc.id DESC LIMIT 5
  -- 期望：attend_count = 0（购买成功后未签到，初始值为 0）
  -- ⚠️ 旧数据（2026-03-01 前购买）attend_count=1，属遗留问题，不计入本步骤

  -- ✏️ S3.11 [v2.4 重构] 课程有效期双字段验证（pending_days + expire_at）
  -- v2.4 变更：新购课程不再立即写入 expire_at，改为 pending_days=validity_days, expire_at=NULL
  SELECT c.id, c.name, c.validity_days,
    uc.id as uc_id, uc.buy_time, uc.contract_signed, uc.pending_days, uc.expire_at,
    CASE
      WHEN c.validity_days IS NULL THEN '永久有效（NULL）'
      WHEN uc.contract_signed=0 AND uc.pending_days=c.validity_days AND uc.expire_at IS NULL THEN '✓v2.4正确(待签约,pending_days已设置)'
      WHEN uc.contract_signed=0 AND uc.expire_at IS NOT NULL THEN '❌expire_at不应有值(v2.4 Bug)'
      WHEN uc.contract_signed=1 AND uc.expire_at IS NOT NULL THEN '✓已签约(expire_at有值)'
      ELSE CONCAT('其他状态(signed=', uc.contract_signed, ',pending=', IFNULL(uc.pending_days,'NULL'), ',expire=', IFNULL(uc.expire_at,'NULL'), ')')
    END as v2_4状态
  FROM tiandao_culture.user_courses uc
  JOIN tiandao_culture.courses c ON c.id = uc.course_id
  WHERE uc.user_id = 30
  ORDER BY uc.id DESC LIMIT 8
  -- v2.4期望：未签约→pending_days=validity_days,expire_at=NULL；已签约→expire_at有值

  -- ✏️ S3.12b [v2.4 新增] 核心断言：pending_days=validity_days 精确验证（2026-03-01后新购课程）
  SELECT c.id, c.name, c.validity_days,
    uc.id as uc_id, uc.buy_time, uc.contract_signed, uc.pending_days, uc.expire_at,
    CASE
      WHEN uc.contract_signed=0 AND uc.pending_days=c.validity_days AND uc.expire_at IS NULL THEN '✓v2.4新购断言通过'
      WHEN uc.contract_signed=0 AND uc.pending_days!=c.validity_days THEN CONCAT('❌pending_days=',uc.pending_days,'≠validity_days=',c.validity_days)
      WHEN uc.contract_signed=0 AND uc.expire_at IS NOT NULL THEN '❌expire_at不应有值(应为NULL)'
      ELSE '跳过(已签约或无有效期)'
    END as S3_12b断言
  FROM tiandao_culture.user_courses uc
  JOIN tiandao_culture.courses c ON c.id = uc.course_id
  WHERE uc.user_id = 30 AND uc.buy_time >= '2026-03-01'
  ORDER BY uc.id DESC LIMIT 10
  ```

  **⚠️ S3.10 断言说明（attend_count 初始值修复 2026-03-01）**：
  > - 修复前：`payment.js` 和 `exchangeCourse.js` 创建 `user_courses` 时 `attend_count = 1`（Bug）
  > - 修复后（2026-03-02）：两个云函数均已改为 `attend_count = 0`，只有签到后才 +1
  > - 验证目标：最新购买/兑换记录（buy_time ≥ 2026-03-01）的 `attend_count` 应为 **0**
  > - 前端"可复训"标签：需 `attend_count >= 1` 才展示，购买后初始不展示

  **⚠️ S3.11/S3.12b 断言说明（课程过期逻辑重构 v2.4，2026-03-04）**：
  > - **v2.4 变更**：新购/兑换课程不再立即写入 `expire_at`，改为 `pending_days = validity_days, expire_at = NULL`
  > - **签约后**：调用 `signCourseContract` 后，才写入 `expire_at = 签约时间 + pending_days 天`
  > - **S3.11 验证目标**：未签约课程 `expire_at = NULL` 且 `pending_days = validity_days`；已签约课程 `expire_at` 有值
  > - **S3.12b 验证目标**：2026-03-01 后新购、未签约课程的 `pending_days` 精确等于 `validity_days`
  > - 旧逻辑（已废弃）：`payment.js` 直接写入 `expire_at = buy_time + validity_days 天`（v2.4 前）

  **手动测试步骤（S3.12 商城前端交互验证 2026-03-03）**：
  > 本次修改为纯前端变更，后端 API 不变
  1. 小程序 `pages/mall/index` → "兑换商品" Tab → 点击商品卡片区域（非兑换按钮）→ **期望：无任何响应**（不弹 Toast、不跳转）
  2. 点击"兑换"按钮 → 应正常触发兑换流程（弹窗确认等，与修改前一致）
  3. 切换到"兑换课程" Tab → 点击课程卡片 → **期望：跳转到课程详情页**（`pages/course/detail/index`，URL 含 `from=exchange` 和 `pointsPrice`）
  4. 课程详情页验证（兑换模式）：
    - 课程基本信息区 / 底部栏价格应显示 "XXX积分"（非 ¥XXX）
    - 积分充足时：按钮显示"立即兑换"，点击弹窗确认"确定用 X 积分兑换课程吗？"，确认后调用 `exchangeCourse`
    - 积分不足时：按钮显示"积分不足"，按钮置灰禁用
  5. 兑换成功后验证 DB（与 S3.6c exchangeCourse 一致）

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
  getMeritPoints → getMeritPointsHistory → getMeritPointsHistory(sourceFilter) → getCashPoints → getCashPointsHistory → getWithdrawRecords → [交叉验证x2]
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

  -- S4.8 功德分明细 Tab 筛选验证（sourceFilter 参数）
  -- 推荐类 (source IN 1,2)
  SELECT COUNT(*) as cnt FROM tiandao_culture.merit_points_records WHERE user_id=${U.id} AND source IN (1,2);
  -- 活动类 (source IN 3,4,5,7)
  SELECT COUNT(*) as cnt FROM tiandao_culture.merit_points_records WHERE user_id=${U.id} AND source IN (3,4,5,7);
  -- 兑换类 (source=6)
  SELECT COUNT(*) as cnt FROM tiandao_culture.merit_points_records WHERE user_id=${U.id} AND source=6;
  ```

  **S4.8 新增步骤（2026-03-13 Bug 修复验证）**：

  | 步骤 | 操作 | 期望结果 |
  |------|------|---------|
  | S4.8a | getMeritPointsHistory sourceFilter=[1,2] | 仅返回推荐类记录（source IN 1,2），total 与 SQL 一致 |
  | S4.8b | getMeritPointsHistory sourceFilter=[3,4,5,7] | 仅返回活动类记录（source IN 3,4,5,7），total 与 SQL 一致 |
  | S4.8c | getMeritPointsHistory sourceFilter=[6] | 仅返回兑换类记录（source=6），total 与 SQL 一致 |
  | S4.8d | getMeritPointsHistory 不传 sourceFilter | 返回全部记录，total = 推荐 + 活动 + 兑换 + 其他 |

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

  **测试目的**：验证协议签署的完整链路，确认合同期正确（精确 365 天）、签署信息完整、docx 签名位置正确。

  **涉及表**：`contract_templates`, `contract_signatures`

  **关键业务规则**：
  | # | 规则 | 来源 |
  |---|------|------|
  | 1 | 合同结束日期 > 开始日期 | 需求 3.1.6.6 |
  | 2 | 合同期精确为 365 天（1年），剩余天数不应为 366 | 需求 3.1.7.1（2026-03-02 修复双重 UTC+8 偏移） |
  | 3 | 仅青鸾+(level≥2) 可查看协议 | 需求 3.1.6.6 |
  | 4 | docx 签名注入到甲方侧（左列），非乙方侧（右列） | 2026-03-02 修复 `insertAfterLabelSmart` |
  | 5 | 头部甲方姓名注入到「甲方：」之后，证件号注入到「身份证号码：」之后 | 2026-03-02 修复文本 run 拆分 |
  | 6 | 无合同照片的线下合同点击"查看合同照片"应提示而非无限加载 | 2026-03-13 修复 contracts/index.vue |

  ### 新增测试步骤（2026-03-13 合同照片查看修复）

  | 步骤 | 类型 | Action | 描述 | 状态 |
  |------|------|--------|------|------|
  | S6.11 | 📖 手动（客户端） | 我的协议页面 | 客户端打开"我的协议" → 点击无照片的线下合同（sign_type=3）的"查看合同照片" | ⏳ 待测 |
  | | 期望 | toast 提示 | 显示"暂无合同照片，请联系管理员补充"，不会无限加载 | |
  | | 验证 SQL | `SELECT id, sign_type, contract_images FROM tiandao_culture.contract_signatures WHERE user_id=30 AND sign_type=3 ORDER BY id DESC LIMIT 3` | 确认存在 contract_images 为空的记录 | |
  | S6.12 | 📖 手动（客户端） | 我的协议页面 | 客户端打开"我的协议" → 点击有照片的线下合同的"查看合同照片" | ⏳ 待测 |
  | | 期望 | 照片预览 | 正常显示合同照片，可预览大图 | |

  ---

  ### 流程 7: 📅 预约 · 排期 · 学习进度 · 签到验证

  > ⚠️ **跨流程依赖更新（2026-03-06 合同流程改造）**：预约课程不再有合同签署拦截，购买课程后即可直接预约。`checkCourseContract` 接口已废弃。课程合同改为管理员后台手动录入，不影响预约流程。

  ```
  getClassRecords(course_id=1) → getClassRecords(course_id=18) → [写]createAppointment(首次)
  → [写]cancelAppointment(截止日期前) → [边界]cancelAppointment(截止日期后) → getMyAppointments
  → getAcademyProgress → getMyCourses(attend_count) → [边界]复训拦截
  → [写]createClassRecord(含cancelDeadlineDays) → [写]updateClassRecord(status=0取消排期)
  → [读]checkRetrainCredit → [写]createAppointment(使用复训资格) → 无预约/无进度边界
  ```

  **测试目的**：验证预约系统完整链路——排期查询（含 cancel_deadline_days）、首次预约写操作、客户端取消预约（截止日期校验）、复训费拦截、复训资格检查与使用（retrain_credit_status 状态流转 0→2→1）、后台排期管理（新增/取消排期联动取消预约）、学习进度，以及 `class_records.booked_quota` 与实际预约数的一致性。

  > ℹ️ `booking_deadline` / `retrain_deadline` 字段确认**未使用**：取消预约截止日期改为使用 `class_records.cancel_deadline_days` 字段（从排期的上课日期往前推 N 天计算截止日期）。

  **涉及表**：`class_records`, `appointments`, `user_courses`, `academy_progress`, `orders`（retrain_credit_status 字段）

  **测试步骤说明（2026-03-02 重构）**：

  | 步骤 | 类型 | 接口 | 描述 |
  |------|------|------|------|
  | S7.1 | 📖 读 | `getClassRecords(course_id=1)` | 获取初探班排期，保存 classRecordId 供复训拦截测试（S7.4c）使用 |
  | S7.1a | 📖 读 | `getClassRecords(course_id=18)` | 获取 attend_count=0 课程排期，保存 firstAppointClassRecordId（id=38） |
  | S7.1b | ✏️ 写 | `createAppointment(firstAppointClassRecordId)` | **首次预约成功**：attend_count=0 课程，应返回 appointment_id，is_retrain=0 |
  | S7.1c | ✏️ 写 | `cancelAppointment` | **客户端取消预约（已恢复）**：截止日期前可取消（S7.12）；截止日期后不可取消（S7.13） |
  | S7.2 | 📖 读 | `getMyAppointments` | 我的预约列表，status 枚举合法性验证；**新增字段验证**：is_retrain（0/1）、cancel_deadline_days（≥0） |
  | S7.3 | 📖 读 | `getAcademyProgress` | 学习进度 |
  | S7.4a | 📖 读 | `getMyCourses` | 验证 attend_count、retrain_price 字段存在 |
  | S7.4c | ❌ 边界 | `createAppointment(classRecordId)` | **复训拦截**：attend_count≥1 且非沙龙 且无可用复训资格（retrain_credit_status≠1）→ 应返回"需先支付复训费" |
  | S7.5 | 📖 边界 | `getMyAppointments(user_id=31)` | 无预约用户应返回空列表 |
  | S7.6 | 📖 边界 | `getAcademyProgress(user_id=31)` | 无进度用户应返回空列表 |
  | S7.7 | ❌ 边界 [v2.4新增] | `createAppointment` | **过期课程拦截**：expire_at 已过期 → 应返回"课程已过期"类错误（条件执行：无过期数据则跳过） |
  | S7.8 | ❌ 边界 [v2.4新增] | `createAppointment` | **未签合同拦截**：contract_signed=0 且 validity_days>0 → 应返回"请先签署学习合同"类错误（条件执行） |
  | S7.9 | ✏️ 写 | `createClassRecord`（含 cancelDeadlineDays 必填） | **后台新增排期**：验证 class_records.cancel_deadline_days 已写入 |
  | S7.10 | ✏️ 写 | 后台取消排期 | **后台取消排期**：验证所有待上课预约 status=3，booked_quota=0 |
  | S7.11 | ✏️ 写 | 后台取消排期（含复训预约） | **复训预约取消后保留资格**：验证 orders.retrain_credit_status=1 |
  | S7.12 | ✏️ 写 | `cancelAppointment`（截止日期前） | **客户端取消预约**：验证 appointments.status=3，booked_quota 减 1 |
  | S7.13 | ❌ 边界 | `cancelAppointment`（截止日期后） | **客户端取消预约（超期）**：返回错误，无法取消 |
  | S7.14 | ✏️ 写 | `cancelAppointment`（复训用户） | **复训用户取消预约**：验证 orders.retrain_credit_status=1 |
  | S7.15 | 📖 读 | `checkRetrainCredit` | **检查复训资格**：验证 has_credit=true |
  | S7.16 | ✏️ 写 | `createAppointment`（使用复训资格） | **使用复训资格预约**：验证 appointments 记录创建，orders.retrain_credit_status=2 |
  | S7.17 | ❌ 边界 | 复训资格用户缺席 | **复训资格用户缺席**：验证 retrain_credit_status 保持为 2（资格已消耗） |
  | S7.QR1 | ✏️ 写（管理端） | `generateCheckinQRCode` | **生成签到二维码**：验证返回 qrcode_url、scene(含 ci=)、class_record_id |
  | S7.QR2 | ✏️ 写（管理端） | `generateCheckinQRCode`（重复） | **覆盖旧签到码**：同排期重复生成应覆盖旧记录 |
  | S7.QR3 | 📖 读（管理端） | `getCheckinQRCodeList` | **签到码列表**：按排期筛选，每排期仅一条记录 |
  | S7.SC1 | ✏️ 写 | `scanCheckin` | **扫码日签到（非沙龙）**：验证 appointment_checkins 插入 checkin_type=1；排期日期范围外返回"不在签到时间内" |
  | S7.SC2 | 📖 读 | `scanCheckin`（重复） | **同天重复签到**：应返回 already_checked=true |
  | S7.MC1 | ✏️ 写（管理端） | `manageDailyCheckin(operation=checkin)` | **管理端补签**：验证 appointment_checkins 插入 checkin_type=2 |
  | S7.MC2 | ✏️ 写（管理端） | `manageDailyCheckin(operation=cancel)` | **管理端取消签到**：验证 appointment_checkins 记录被删除 |
  | S7.MC3 | 📖 读（管理端） | `getDailyCheckins` | **查询每日签到记录**：返回 class_date/class_end_date/checkins 数组 |
  | S7.RC1 | 📖 读 | `checkRetrainCredit` | **检查复训资格**：返回 has_credit 布尔值 |
  | S7.CA2 | ❌ 边界 | `cancelAppointment`（截止日期后） | **取消预约截止拦截**：需手动构造过截止日期的预约数据验证 |

  **测试数据说明（2026-03-02）**：

  | 数据 | 说明 |
  |------|------|
  | class_record id=38 | course_id=18，class_date=2026-12-15，供 S7.1b 首次预约 |
  | user_courses id=16 | user_id=30，course_id=18，attend_count=0（确保 S7.1b 不触发复训拦截） |
  | class_record id=36 | course_id=1，供 S7.4c 复训拦截（user_id=30 的 attend_count=8 for course_id=1） |

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
  -- 排期预约数一致性（含 cancel_deadline_days 新字段）
  SELECT cr.id, cr.class_date, cr.class_time, cr.class_location, cr.booked_quota,
    cr.cancel_deadline_days,
    (SELECT COUNT(*) FROM tiandao_culture.appointments a
    WHERE a.class_record_id=cr.id AND a.status IN (0,1)) as 实际预约数
  FROM tiandao_culture.class_records cr WHERE cr.status=1

  -- S7.7 [v2.4新增] 过期课程预约拦截：验证拦截是否生效（recent_cnt 应为 0）
  SELECT COUNT(*) as recent_cnt FROM tiandao_culture.appointments
  WHERE user_id=30 AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
  -- 期望：recent_cnt=0（过期课程无法创建新预约）

  -- S7.8 [v2.4新增] 未签合同预约拦截：验证 contract_signed 状态
  SELECT uc.course_id, c.name, uc.contract_signed, uc.pending_days, uc.expire_at
  FROM tiandao_culture.user_courses uc JOIN tiandao_culture.courses c ON c.id=uc.course_id
  WHERE uc.user_id=30 AND uc.contract_signed=0 AND c.validity_days IS NOT NULL AND uc.status=1
  -- 期望：对这些未签约有效期课程，createAppointment 应被拦截

  -- S7.9 [2026-03-06新增] 新增排期后 cancel_deadline_days 写入验证
  SELECT id, course_id, class_date, cancel_deadline_days, status
  FROM tiandao_culture.class_records
  ORDER BY id DESC LIMIT 5
  -- 期望：最新排期 cancel_deadline_days 等于创建时传入的 cancelDeadlineDays 值

  -- S7.10/S7.11 [2026-03-06新增] 取消排期后预约状态验证
  SELECT a.id, a.class_record_id, a.status, a.is_retrain, a.order_no,
    cr.status as 排期状态
  FROM tiandao_culture.appointments a
  JOIN tiandao_culture.class_records cr ON cr.id = a.class_record_id
  WHERE cr.status = 0
  -- 期望：所有关联预约 status=3（已取消）

  -- S7.11 [2026-03-06新增] 复训预约取消后 retrain_credit_status 验证
  SELECT o.id, o.order_no, o.order_type, o.retrain_credit_status
  FROM tiandao_culture.orders o
  WHERE o.order_type = 2
  ORDER BY o.id DESC LIMIT 5
  -- 期望：被取消排期关联的复训订单 retrain_credit_status=1（资格已释放）

  -- S7.12/S7.14 [2026-03-06新增] 客户端取消预约验证
  SELECT a.id, a.status, a.is_retrain, a.class_record_id,
    cr.booked_quota, cr.cancel_deadline_days, cr.class_date,
    DATE_SUB(cr.class_date, INTERVAL cr.cancel_deadline_days DAY) as cancel_deadline
  FROM tiandao_culture.appointments a
  JOIN tiandao_culture.class_records cr ON cr.id = a.class_record_id
  WHERE a.status = 3 AND a.user_id = 30
  ORDER BY a.id DESC LIMIT 5
  -- 期望：status=3，booked_quota 已减 1

  -- S7.15/S7.16 [2026-03-06新增] 复训资格检查与使用验证
  SELECT o.id, o.order_no, o.order_type, o.retrain_credit_status,
    o.class_record_id, o.related_id as user_course_id
  FROM tiandao_culture.orders o
  WHERE o.user_id = 30 AND o.order_type = 2 AND o.pay_status = 1
  ORDER BY o.id DESC LIMIT 5
  -- 期望：checkRetrainCredit 有资格时 retrain_credit_status=1；使用后 retrain_credit_status=2

  -- S7.QR1-QR3 [2026-03-09新增] 签到二维码验证
  SELECT id, class_record_id, course_name, class_date, qrcode_url, scene, status
  FROM tiandao_culture.checkin_qrcodes
  ORDER BY id DESC LIMIT 5
  -- 期望：每排期最多一条记录（重复生成会覆盖），status=1

  -- S7.SC1/MC1-MC2 [2026-03-09新增] 日签到记录验证
  SELECT ac.id, ac.appointment_id, ac.checkin_date, ac.checkin_time, ac.checkin_type, ac.checkin_admin_id
  FROM tiandao_culture.appointment_checkins ac
  JOIN tiandao_culture.appointments a ON a.id = ac.appointment_id
  WHERE a.user_id = 30
  ORDER BY ac.id DESC LIMIT 10
  -- 期望：checkin_type=1(扫码签到) / checkin_type=2(管理端补签)
  ```

  > **v2.4 变更说明（createAppointment 双重校验）**：
  > - v2.4 前：仅检查 `attend_count` 是否需要复训费
  > - v2.4 后：新增 `expire_at < NOW()` 过期检查 + `contract_signed=0` 合同未签检查
  > - 拦截顺序：过期 → 未签合同 → 复训费检查（按优先级拦截）
  > - **2026-03-06 新增**：复训资格检查（retrain_credit_status=1 时直接创建预约，无需再支付复训费）

  ---

  ### ✏️ 流程 7 排期管理·取消预约·复训资格验证步骤（2026-03-06 新增）

  > **背景**：本次改造涉及排期管理（cancelDeadlineDays 字段）、取消预约恢复（截止日期校验）、复训资格状态流转（retrain_credit_status 0→2→1）。
  >
  > **变更清单**：
  > - class_records 新增 `cancel_deadline_days` 字段（创建排期时必填）
  > - orders 新增 `retrain_credit_status` 字段（0=默认/1=可用/2=已使用）
  > - `updateClassRecord` 仅允许 status=0 取消操作，自动取消所有待上课预约
  > - `cancelAppointment` 恢复可用，校验截止日期（class_date - cancel_deadline_days）
  > - 新增 `checkRetrainCredit` 接口，检查 retrain_credit_status=1 的可用资格
  > - `createAppointment` 增加复训资格自动使用逻辑

  **S7.9 · 后台新增排期（cancelDeadlineDays 必填验证）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.9a | ❌ 异常拦截 | `createClassRecord`（缺少 cancelDeadlineDays） | 缺少必填参数 cancelDeadlineDays，返回参数错误 |
  | | 期望 | 返回错误 | 包含"cancelDeadlineDays"相关提示 |
  | S7.9b | ✏️ 写操作 | `createClassRecord`（含 cancelDeadlineDays=3） | 正常创建排期，cancel_deadline_days=3 |
  | | 期望 | 成功返回 | 返回新排期 id |
  | | 验证 SQL | `SELECT id, course_id, class_date, cancel_deadline_days, status FROM tiandao_culture.class_records ORDER BY id DESC LIMIT 1` | cancel_deadline_days=3，status=1 |
  | S7.9c | 📖 读操作 | `getClassRecordList` | 验证返回新增 cancel_deadline_days 字段 |
  | | 期望 | 返回字段 | 包含 `cancel_deadline_days`（值为 3） |

  **S7.10 · 后台取消排期（自动取消待上课预约）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.10a | ✏️ 写操作 | `updateClassRecord { id: <排期id>, status: 0 }` | 取消排期（status=0） |
  | | 期望 | 成功 | 排期 status 变为 0 |
  | | 验证 SQL | `SELECT id, status, booked_quota FROM tiandao_culture.class_records WHERE id=<排期id>` | status=0 |
  | S7.10b | 📖 验证 | DB 查询 | 所有关联的待上课预约（原 status=0）应被自动取消为 status=3 |
  | | 验证 SQL | `SELECT a.id, a.status, a.is_retrain FROM tiandao_culture.appointments WHERE a.class_record_id=<排期id>` | 所有 status=3 |

  **S7.11 · 取消排期后复训预约的 retrain_credit_status 验证**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.11a | 📖 验证 | DB 查询 | 被取消的复训预约（is_retrain=1）关联的订单 retrain_credit_status 应恢复为 1 |
  | | 验证 SQL | `SELECT o.id, o.order_no, o.retrain_credit_status FROM tiandao_culture.orders o WHERE o.order_no IN (SELECT a.order_no FROM tiandao_culture.appointments a WHERE a.class_record_id=<排期id> AND a.is_retrain=1)` | retrain_credit_status=1（资格已释放，可再次使用） |

  **S7.12 · 客户端取消预约（截止日期前）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.12a | ✏️ 写操作 | `cancelAppointment { appointmentId: <id> }` | 截止日期前取消预约 |
  | | 前提条件 | 排期的 class_date - cancel_deadline_days > 当前日期 | 确保在截止日期前 |
  | | 期望 | 成功 | 返回成功 |
  | | 验证 SQL | `SELECT id, status FROM tiandao_culture.appointments WHERE id=<appointmentId>` | status=3（已取消） |
  | S7.12b | 📖 验证 | DB 查询 | 取消后 booked_quota 应减 1 |
  | | 验证 SQL | `SELECT cr.id, cr.booked_quota, (SELECT COUNT(*) FROM tiandao_culture.appointments a WHERE a.class_record_id=cr.id AND a.status IN (0,1)) as 实际预约数 FROM tiandao_culture.class_records cr WHERE cr.id=<class_record_id>` | booked_quota 减 1，与实际预约数一致 |

  **S7.13 · 客户端取消预约（超过截止日期）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.13a | ❌ 异常拦截 | `cancelAppointment { appointmentId: <id> }` | 超过截止日期的预约不可取消 |
  | | 前提条件 | 排期的 class_date - cancel_deadline_days ≤ 当前日期 | 确保已超过截止日期 |
  | | 期望 | 返回错误 | 包含"超过取消截止日期"或"无法取消"相关提示 |
  | | 验证 SQL | `SELECT id, status FROM tiandao_culture.appointments WHERE id=<appointmentId>` | status 仍为 0（未变更） |

  **S7.14 · 复训用户取消预约（retrain_credit_status 恢复）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.14a | ✏️ 写操作 | `cancelAppointment { appointmentId: <id> }` | 复训预约（is_retrain=1）取消 |
  | | 前提条件 | 预约为复训预约（is_retrain=1），在截止日期前 | 确保可取消 |
  | | 期望 | 成功 | appointment.status=3 |
  | | 验证 SQL | `SELECT a.id, a.status, a.is_retrain, a.order_no FROM tiandao_culture.appointments WHERE id=<appointmentId>` | status=3, is_retrain=1 |
  | S7.14b | 📖 验证 | DB 查询 | 复训订单的 retrain_credit_status 应恢复为 1 |
  | | 验证 SQL | `SELECT o.id, o.order_no, o.retrain_credit_status FROM tiandao_culture.orders WHERE order_no=<预约的order_no>` | retrain_credit_status=1（资格释放，可再次使用） |

  **S7.15 · 检查复训资格（checkRetrainCredit）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.15a | 📖 读操作 | `checkRetrainCredit { courseId: <id> }` | 有可用复训资格的用户（retrain_credit_status=1） |
  | | 期望 | 返回 | `has_credit=true` |
  | | 验证 SQL | `SELECT o.id, o.order_no, o.retrain_credit_status FROM tiandao_culture.orders WHERE user_id=<userId> AND order_type=2 AND pay_status=1 AND retrain_credit_status=1` | 至少 1 条记录 |
  | S7.15b | 📖 读操作 | `checkRetrainCredit { courseId: <id> }` | 无可用复训资格的用户（无 retrain_credit_status=1 记录） |
  | | 期望 | 返回 | `has_credit=false` |

  **S7.16 · 使用复训资格预约（retrain_credit_status 2）**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.16a | ✏️ 写操作 | `createAppointment { classRecordId: <id> }` | 有复训资格用户预约（自动使用 retrain_credit_status=1 资格） |
  | | 前提条件 | attend_count≥1，有 retrain_credit_status=1 的订单 | 确保有可用资格 |
  | | 期望 | 成功 | 返回 appointment_id |
  | | 验证 SQL | `SELECT id, status, is_retrain, order_no FROM tiandao_culture.appointments WHERE user_id=<userId> ORDER BY id DESC LIMIT 1` | status=0, is_retrain=1 |
  | S7.16b | 📖 验证 | DB 查询 | 使用的复训订单 retrain_credit_status 应变为 2 |
  | | 验证 SQL | `SELECT o.id, o.order_no, o.retrain_credit_status FROM tiandao_culture.orders WHERE order_no=<预约的order_no>` | retrain_credit_status=2（资格已消耗） |

  **S7.17 · 缺席时复训资格消耗验证**：

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.17a | ❌ 边界 | `updateAppointmentStatus { id: <id>, status: 2 }` | 复训预约标记缺席（status=2） |
  | | 前提条件 | 预约为复训预约（is_retrain=1），已通过 S7.16 使用资格 | retrain_credit_status=2 |
  | | 期望 | 缺席成功 | appointment.status=2 |
  | | 验证 SQL | `SELECT o.id, o.order_no, o.retrain_credit_status FROM tiandao_culture.orders WHERE order_no=<预约的order_no>` | retrain_credit_status 保持为 2（资格已消耗，缺席不退还） |

  **关键业务规则（排期管理·取消预约·复训资格部分）**：
  | # | 规则 | 来源 |
  |---|------|------|
  | 1 | createClassRecord 必须传入 cancelDeadlineDays，写入 class_records.cancel_deadline_days | 2026-03-06 需求 |
  | 2 | updateClassRecord 仅允许 status=0（取消排期），其他状态修改已禁止 | 2026-03-06 变更 |
  | 3 | 取消排期自动取消所有待上课预约（status=0→3），booked_quota 归零 | 2026-03-06 变更 |
  | 4 | 取消排期时复训预约的订单 retrain_credit_status 从 2 恢复为 1 | 2026-03-06 变更 |
  | 5 | cancelAppointment 校验截止日期：class_date - cancel_deadline_days > 当前日期 | 2026-03-06 变更 |
  | 6 | 取消预约后 appointment.status=3，booked_quota-1 | 2026-03-06 变更 |
  | 7 | 复训用户取消预约 → retrain_credit_status 从 2 恢复为 1 | 2026-03-06 变更 |
  | 8 | checkRetrainCredit：查询 retrain_credit_status=1 的已支付复训订单 | 2026-03-06 新增 |
  | 9 | createAppointment 自动使用复训资格：retrain_credit_status 从 1 变为 2 | 2026-03-06 新增 |
  | 10 | 缺席不退还复训资格：retrain_credit_status 保持为 2 | 2026-03-06 确认 |
  | 11 | getMyAppointments 返回 is_retrain 和 cancel_deadline_days 新字段 | 2026-03-06 新增 |
  | 12 | getClassRecordList 返回 cancel_deadline_days 新字段 | 2026-03-06 新增 |

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
  | S7.3a | ✏️ 前端操作 | `uni.requestSubscribeMessage` | **复训支付页**点击"立即支付"后弹出微信订阅授权弹窗（首次预约在预约确认页弹出） |
  | | 期望 | 弹窗显示 | 仅在微信小程序环境弹出，H5/App 环境跳过 |
  | | 期望 | 预约流程 | 无论用户允许/拒绝授权，支付流程正常继续 |
  | | 期望 | 弹窗时机 | 必须在 tap 上下文（任何 async/await 之前）调用，否则微信拦截 |
  | | | **结果** | ✅ 已通过（2026-03-03 user_id=32）开发者工具模拟器弹窗正常；手机端已授权用户静默通过（符合微信机制） |
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
  > - `createAppointment.js`：新增复训校验（非沙龙 + attend_count >= 1 → 查 orders 是否有已支付复训订单）；**2026-03-06 新增**：增加复训资格检查（retrain_credit_status=1 可直接预约并标记为已使用 retrain_credit_status=2）
  > - `payment.js handleRetrainPayment`：修复 course_id Bug（从 class_records 取，不再用 order.related_id）；补充 user_course_id 字段
  > - `cancelAppointment.js`：**2026-03-06 已恢复**，支持客户端取消预约；校验截止日期（class_date - cancel_deadline_days）；取消后 appointment.status=3、booked_quota-1；复训预约取消后设 retrain_credit_status=1
  > - `order.js business-logic`：修复 attend_count 初始值 1 → 0
  > - `createClassRecord.js`：**2026-03-06 新增** cancelDeadlineDays 必填参数，写入 class_records.cancel_deadline_days
  > - `updateClassRecord.js`：**2026-03-06 变更** 仅允许 status=0（取消），取消时自动取消所有待上课预约，复训预约触发 retrain_credit_status=1
  > - `checkRetrainCredit.js`：**2026-03-06 新增** 检查用户是否有可抵用的复训资格（retrain_credit_status=1）
  > - 前端：预约确认页重写（attend_count 改从 getMyCourses 获取）；订单确认页支持 isRetrain 分支；我的预约列表新增 is_retrain、cancel_deadline_days 字段展示

  | 编号 | 类型 | 接口/操作 | 描述 |
  |------|------|-----------|------|
  | S7.4a | 🔍 读操作 | `getMyCourses` | 预约确认页通过此接口获取 attend_count 和 retrain_price |
  | | 期望 | 返回字段 | 包含 `attend_count`、`retrain_price`、`course_id` |
  | S7.4b | ✏️ 写操作 | `createAppointment` | attend_count=0 + 非沙龙：首次预约应成功 |
  | | 期望 | 成功返回 | `appointment_id` 有值 |
  | | 验证 SQL | `SELECT id, status, is_retrain FROM tiandao_culture.appointments WHERE user_id=? ORDER BY id DESC LIMIT 1` | is_retrain=0, status=0 |
  | | | **结果** | ✅ 已通过（2026-03-03 user_id=32）appointments id=49(course_id=41,is_retrain=0,status=0)、id=50(course_id=1,is_retrain=0,status=0) |
  | S7.4c | ✏️ 写操作 | `createAppointment` | attend_count>=1 + 非沙龙 + 未支付复训费：应被拒绝 |
  | | 期望 | 返回错误 | "复训课程需先支付复训费" |
  | S7.4d | ✏️ 写操作 | 创建复训订单 `order_type=2` | attend_count>=1 时前端跳转订单页创建 order_type=2 订单 |
  | | 期望 | 创建成功 | 返回 order_no |
  | | 验证 SQL | `SELECT order_no, order_type, related_id, class_record_id, pay_status FROM tiandao_culture.orders WHERE user_id=? AND order_type=2 ORDER BY id DESC LIMIT 1` | order_type=2, class_record_id 有值 |
  | | ✅ 已通过 | 2026-03-03 user_id=32 | 三笔复训订单均创建成功：order_id=93(class_record_id=43)、94(44)、95(44)，order_type=2 ✅，related_id=28(user_course_id) ✅，class_record_id 有值 ✅ |
  | S7.4e | ✏️ 写操作 | 支付回调 `handleRetrainPayment` | 复训订单支付成功后自动创建预约 |
  | | 期望 | appointments 自动创建 | is_retrain=1, order_no 有值, user_course_id 有值 |
  | | 验证 SQL | `SELECT a.id, a.is_retrain, a.order_no, a.user_course_id, a.course_id FROM tiandao_culture.appointments a WHERE a.order_no IS NOT NULL ORDER BY a.id DESC LIMIT 1` | course_id 正确（非 user_course_id），user_course_id 有值 |
  | | ✅ 已通过 | 2026-03-03 user_id=32 | 三笔支付回调均创建预约（appointment id=46/47/48，后因重测删除）；is_retrain=1 ✅，order_no 有值 ✅，course_id=2（非 user_course_id=28）✅ |
  | S7.4f | ✏️ 写操作 | `cancelAppointment` | **已恢复（2026-03-06）**：截止日期前可取消 → status=3、booked_quota-1；截止日期后返回错误 |
  | | 期望 | 截止日期前 | 成功取消，appointment.status=3 |
  | | 期望 | 截止日期后 | 返回错误"已超过取消截止日期" |
  | S7.4g | 🔍 前端验证 | 预约确认页 | 沙龙课程（type=4）不显示复训费，按钮文案为"立即预约" |
  | S7.4h | 🔍 前端验证 | 我的预约列表 | **已恢复（2026-03-06）**：截止日期前显示"取消预约"按钮；超过截止日期按钮隐藏或禁用；展示 is_retrain 和 cancel_deadline_days 字段 |
  | S7.4i | 🔍 前端验证 | 预约确认页 `checkAlreadyBooked` | 进入预约确认页时自动检查该排期是否已有有效预约（status≠3），若已预约则按钮禁用显示"您已预约该排期"，不可进入订单页 |
  | | 期望 | 按钮禁用 | `alreadyBooked=true` 时按钮变灰、`handleSubmit` 直接 return |
  | | 验证 SQL | `SELECT id, class_record_id, status FROM tiandao_culture.appointments WHERE user_id=? AND class_record_id=? AND status != 3` | 有记录则应禁用 |
  | | ✅ 已通过 | 2026-03-03 | 已预约排期再次进入确认页，按钮显示"您已预约该排期"并禁用 ✅，不再进入订单页报错 ✅ |
  | S7.4j | 🔍 后端验证 | `create.js handleRetrainOrder` | 复训资格检查改为 `class_records.status=1`（未开始），而非 `class_date` 字符串比较 |
  | | 期望 | 拦截条件 | status=0（已取消）/2（进行中）/3（已结束）均拒绝复训预约 |
  | | 期望 | 放行条件 | status=1（未开始）允许复训预约 |
  | | ✅ 已通过 | 2026-03-03 | 原 class_date 字符串比较存在时区边界问题；改为 status=1 检查后复训预约正常 ✅ |

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
  | 6 | cancelAppointment **已恢复（2026-03-06）**：截止日期前可取消（class_date - cancel_deadline_days），超期拒绝 | 2026-03-06 变更 |
  | 7b | 复训用户取消预约 → retrain_credit_status 从 2 恢复为 1（资格释放） | 2026-03-06 新增 |
  | 7c | checkRetrainCredit 接口：检查是否有 retrain_credit_status=1 的订单 | 2026-03-06 新增 |
  | 7d | 使用复训资格预约：retrain_credit_status 从 1 变为 2（资格已消耗），直接创建预约 | 2026-03-06 新增 |
  | 7 | 支付成功后跳转我的预约页（非订单详情页） | 前端逻辑 |

  ---

  ### 流程 8: 💬 反馈 · 类型联动 · 课程关联

  ```
  getFeedbackCourses → getFeedbackTypes(选课) → getFeedbackTypes(通用) → submitFeedback → getMyFeedback(分页) → 边界
  ```

  **测试目的**：验证反馈系统的类型联动逻辑：选择课程时返回课程相关类型，不选课程时返回通用类型。

  **涉及表**：`feedbacks`, `user_courses`, `courses`

  **关键业务规则**：
  | # | 规则 | 来源 |
  |---|------|------|
  | 1 | 可反馈课程 = 用户已购课程（user_courses） | 需求 3.1.6.3 |
  | 2 | 选课程时反馈类型: 课程内容/服务/讲师/场地 | 需求 3.1.6.3 |
  | 3 | 不选课程时反馈类型: 功能建议/问题反馈/投诉 | 需求 3.1.6.3 |
  | 4 | 提交反馈返回新建 id + created_at | 需求 3.1.6.3 |
  | 5 | 反馈列表 status 合法枚举 0/1/2/3，feedback_type 合法枚举 1~5 | 需求 3.1.6.3 |
  | 6 | 关联课程的反馈应含 course_name | 需求 3.1.6.3 |
  | 7 | 已处理(status=2)的反馈应含 reply 内容 | 需求 3.1.6.3 |
  | 8 | 无已购课程用户的可反馈课程应返回空列表 | 边界 |

  **📋 测试步骤**：

  | 步骤 | 类型 | action | 说明 |
  |------|------|--------|------|
  | S8.1 ✅ | 📖 读操作 | `getFeedbackCourses` | 可反馈课程（user_id=30） |
  | S8.2a ✅ | 📖 读操作 | `getFeedbackTypes` | 反馈类型（course_id=1） |
  | S8.2b ✅ | 📖 读操作 | `getFeedbackTypes` | 反馈类型（course_id=2，验证与 course_id=1 一致） |
  | S8.3 ✅ | 📖 读操作 | `getFeedbackTypes` | 通用反馈类型（不传 course_id） |
  | S8.4 ✅ | ✏️ 写操作 | `submitFeedback` | 提交反馈（条件写，产生新记录） |
  | S8.5 ⚠️ | 📖 读操作 | `getMyFeedback` | 我的反馈列表 page=1（⚠️ 数据覆盖不足，见下方说明） |
  | S8.6 ✅ | 📖 读操作 | `getMyFeedback` | 我的反馈列表 page=2（分页验证） |
  | S8.7 ✅ | 📖 读操作 | `getFeedbackCourses` | 边界：无已购课程用户应返回空列表 |

  **biz 断言详情**：

  | 步骤 | 断言 | 期望 | 实际结果 | 状态 |
  |------|------|------|---------|------|
  | S8.1 | 仅显示已购课程 | user_courses status=1 的课程 | 4条可反馈课程 | ✅ |
  | S8.1 | 可反馈课程来自我的课程 | user_id=30 已购记录 | 4条（与 user_courses 交叉验证 F2 数据未取到） | ✅ |
  | S8.2a | 选课程时类型接口正常返回 | OK | OK | ✅ |
  | S8.2a | 选课程时类型列表不为空 | ≥1 | 5个类型 | ✅ |
  | S8.2b | 不同课程类型接口正常返回 | OK | OK | ✅ |
  | S8.2b | 不同课程反馈类型一致（全局配置） | course_id=1 == course_id=2 | 5个 == 5个 ✓ | ✅ |
  | S8.3 | 通用反馈类型接口正常返回 | OK | OK | ✅ |
  | S8.3 | 通用类型列表不为空 | ≥1 | 5个类型 | ✅ |
  | S8.4 | submitFeedback 成功返回 | OK | OK | ✅ |
  | S8.4 | 返回含 id（新建反馈ID） | 有 id 字段 | id=33 | ✅ |
  | S8.4 | 返回含 created_at | 有 created_at 字段 | 2026-03-02 20:35:19 | ✅ |
  | S8.5 | 反馈列表正常返回 | OK | OK | ✅ |
  | S8.5 | status 合法枚举 0/1/2/3 | 全部合法 | 全部合法（已修正历史遗留 status=9 → 3） | ✅ |
  | S8.5 | feedback_type 合法枚举 1~5 | 全部合法 | 10条均合法 | ✅ |
  | S8.5 | **应覆盖多种 feedback_type（至少2种）** | **≥2种** | **1种: [1]** | **⚠️ warn** |
  | S8.5 | 关联课程的反馈应含 course_name | 0条缺名称 | 7条关联课程，0条缺名称 | ✅ |
  | S8.5 | 已处理(status=2)反馈应含 reply | reply 不为空 | 无已处理反馈（正常） | ✅ |
  | S8.5 | 返回含 total 字段(分页总数) | 有 total | total=29 | ✅ |
  | S8.6 | page=2 正常返回 | OK | OK | ✅ |
  | S8.6 | 总数>10时 page=2 应返回剩余记录 | 有记录 | 10条（总29条） | ✅ |
  | S8.6 | page=2 中已处理反馈应含 reply | 0条缺reply | 1条已处理，0条缺reply | ✅ |
  | S8.7 | 无已购课程用户接口正常返回 | OK | OK | ✅ |
  | S8.7 | 无已购课程用户返回空列表 | [] | 空列表 ✓ | ✅ |

  > ✅ **S8.5 警告已修复（2026-03-02）**：
  > **根本原因**：`getMyFeedback` 使用 `.order('id', { ascending: true })` 升序排序，page=1 返回最旧的10条记录，全部为 feedback_type=1 的历史数据。
  > **修复内容**：
  > 1. 将排序改为 `.order('id', { ascending: false })`（降序，最新优先），已部署
  > 2. 通过 MCP 补充 feedback_type=2~5 测试数据（各类型均有2~7条记录）

  **🔍 DB 交叉验证 SQL**：

  ```sql
  -- S8.1: 可反馈课程应等于用户已购课程
  SELECT uc.course_id, c.name FROM tiandao_culture.user_courses uc
  JOIN tiandao_culture.courses c ON uc.course_id=c.id
  WHERE uc.user_id=30 AND uc.status=1

  -- S8.4: 提交反馈后验证新记录
  SELECT id, user_id, feedback_type, content, status, created_at
  FROM tiandao_culture.feedbacks WHERE user_id=30
  ORDER BY id DESC LIMIT 3

  -- S8.5: 反馈列表（含课程关联）
  SELECT f.id, f.course_id, c.name as course_name, f.feedback_type, f.status, f.reply, f.created_at
  FROM tiandao_culture.feedbacks f
  LEFT JOIN tiandao_culture.courses c ON f.course_id=c.id
  WHERE f.user_id=30 ORDER BY f.created_at DESC LIMIT 10

  -- S8.7: user_id=33 应无已购课程
  SELECT COUNT(*) as cnt FROM tiandao_culture.user_courses WHERE user_id=33 AND status=1

  -- ⚠️ 补充数据建议（修复 S8.5 警告用）
  -- 检查当前 feedback_type 分布
  SELECT feedback_type, COUNT(*) as cnt FROM tiandao_culture.feedbacks
  WHERE user_id=30 GROUP BY feedback_type
  ```

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
    o.order_no, o.pay_status, o.referee_id, o.is_reward_granted,
    u.referee_confirmed_at, -- ⚠️ 修正 2026-03-04：referee_confirmed_at 在 users 表，orders 表无此字段；users 无 is_referee_confirmed，用 referee_confirmed_at IS NOT NULL 判断
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
  | S11.10 | getActivityRecords | ambassador | 验证活动记录写入（同时验证附带 stats 统计对象；stats.type_stats 应包含 1-6 共6种类型） |
  | **S11.10b** | **getActivityRecords** | **ambassador** | **【Bug修复验证】Tab 类型筛选：传 activityType=1 应仅返回辅导员记录，传 activityType=5 应仅返回统筹记录；修复前前端传 activity_type（snake_case）导致后端始终为默认值0，筛选无效（2026-03-13 修复）** ⏳ 待测 |
  | S11.11 | getActivityStats | ambassador | 验证统计汇总字段（total_count/total_merit_points/type_stats；type_stats 应包含 key 1-6） |
  | S11.12 | cancelActivityRegistration | ambassador | 边界测试：活动已结束时应返回"已结束"错误 |
  | **S11.2b** | **applyForActivity** | **ambassador** | **【核心写操作】报名活动，取无等级限制岗位（2026-02-28 补充）** |
  | **S11.2c** | **applyForActivity** | **ambassador** | **【边界】重复报名同一活动应被拒绝（返回“已报名”类错误）2026-03-02 补充）** |
  | **S11.7b** | **distributeActivityMeritPoints** | **ambassador** | **【边界】重复发放功德分应被幂等拦截（返回“已发放”错误）2026-03-02 补充）** |
  | **S11.12b** | **cancelActivityRegistration** | **ambassador** | **【清理写操作】取消 S11.2b 报名，保证测试幂等（2026-02-28 补充）** |
  | **S11.2d** | **applyForActivity** | **ambassador** | **【边界】报名活动前置校验：未预约排期时调用应返回错误"请先预约该课程排期后再报名活动"** ⏳ 待测 |
  | **S11.2e** | **applyForActivity** | **ambassador** | **【核心】预约排期后报名活动：有 status=0 的预约时，应成功并返回 appointment_id** ⏳ 待测 |
  | **S11.2f** | **applyForActivity** | **ambassador** | **【边界】跨活动报名：用户报名活动A后，仍可报名活动B（不同活动），验证两个报名记录都存在** ⏳ 待测 |
  | **S11.2g** | **applyForActivity** | **ambassador** | **【边界】同活动重复报名：同一活动内已报名岗位A，再报岗位B应返回错误** ⏳ 待测 |
  | **S11.12c** | **cancelActivityRegistration** | **ambassador** | **【核心】取消报名-报名中：activity.status=1 时应成功** ⏳ 待测 |
  | **S11.12d** | **cancelActivityRegistration** | **ambassador** | **【边界】取消报名-报名截止：activity.status=2 时应返回错误"活动报名已截止，无法取消报名"** ⏳ 待测 |
  | **S11.14** | **cancelAppointment** | **course** | **【联动】取消预约联动：用户有活动报名时取消预约应返回错误提示** ⏳ 待测 |
  | **S11.15** | **getMyRegistrations** | **ambassador** | **【读】我的报名列表：应返回 status=1 且活动 status IN (1,2) 的记录** ⏳ 待测 |
  | **S11.16** | **adminAddRegistrant** | **ambassador** | **【管理端】管理员添加人员：成功添加（含自动创建预约的情况）** ⏳ 待测 |
  | **S11.17** | **adminAddRegistrant** | **ambassador** | **【边界】管理员添加-未购课：对未购课用户应返回错误** ⏳ 待测 |

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
  | `cancelActivityRegistration` 限制 | 活动 status=0（已结束）时不可取消；活动 status=2（报名截止）时不可取消，返回"活动报名已截止，无法取消报名"；活动 status=1（报名中）时可取消 |
  | `applyForActivity` 预约前置校验 | 未预约该课程排期时调用应返回"请先预约该课程排期后再报名活动"（S11.2d） |
  | `applyForActivity` 重复报名拦截 | 同一用户对同一活动已有 status=1 报名时，再次报名（含换岗位）返回错误（S11.2c/S11.2g 覆盖） |
  | `applyForActivity` 跨活动报名 | 用户可同时报名多个不同活动，每个活动仅能报名一个岗位 |
  | `cancelAppointment` 活动报名联动 | 用户有活动报名时取消预约应返回错误，需先取消活动报名 |
  | `getMyRegistrations` 返回范围 | 返回 registration status=1 且活动 status IN (1,2) 的记录 |
  | `adminAddRegistrant` 未购课拦截 | 对未购课用户应返回错误 |
  | `distributeActivityMeritPoints` 幂等 | 已发放（merit_distributed=1）的活动再次调用返回"已发放"错误（S11.7b 自动覆盖） |
  | `getPositionTypeList` 返回 `is_fixed` | 辅导员/会务义工/沙龙组织为固定岗位，is_fixed=true，前端用于隐藏删除、禁用名称编辑 |
  | `deletePositionType` 固定岗位不可删 | 辅导员/会务义工/沙龙组织删除时返回"固定岗位，不可删除"错误 |
  | `updatePositionType` 固定岗位不可改名称 | 辅导员/会务义工/沙龙组织修改名称时返回"固定岗位，不可修改名称"错误 |
  | `signContract` 签名注入 | 仅 .docx 模板支持注入签名图片，PDF 直接使用原模板作为快照 |
  | `auditApplication` 不自动升级 | 审核通过后仅改申请状态，升级在用户签署协议后自动发生 |

  ### 手动测试项（MT）

  | MT | 场景 | 前置条件 | 期望结果 |
  |----|------|---------|---------|
  | MT-F11-1 | 等级不足时报名应被拒绝 | 需要一个 status=1 活动，其某岗位 required_level > 测试用户的 ambassador_level | `applyForActivity` 返回"等级不足"类错误 |
  | MT-F11-2 | 名额已满时报名应被拒绝 | 需要一个岗位 quota=1 且 registered_count=1（已满）的 status=1 活动 | `applyForActivity` 返回"名额已满"类错误 |
  | MT-F11-3 | 固定岗位不可删除 | 辅导员/会务义工/沙龙组织任一岗位 | `deletePositionType` 返回"固定岗位，不可删除"错误 |
  | MT-F11-4 | 固定岗位不可改名称 | 辅导员/会务义工/沙龙组织任一岗位 | `updatePositionType` 传不同 name 时返回"固定岗位，不可修改名称"错误 |

  ### 跨流程依赖

  | 流程 | 依赖说明 |
  |------|---------|
  | F11 → F4 | 发放功德分后用户 merit_points 变化，与 F4 功德分链路共享数据表 |
  | F11 → F5 | 大使等级影响岗位报名资格（required_level 字段） |
  | F11 报名 ↔ F7 预约 | 报名活动需先预约该课程排期；有活动报名时取消预约（cancelAppointment）应被拦截 |

  ---

  ---

  ## 🔴 规则 11：写操作测试设计规范（2026-02-28 经验总结）

  > **背景**：F11 流程曾因"报名"核心写操作完全缺失，导致测试全部通过却掩盖了真实 BUG（`applyForActivity` 静默失败、名额虚减）。以下规则为此次教训的直接产物，必须严格遵守。

  ### 原则 W1：每个流程的核心写操作必须包含在自动化测试中

  | 流程 | 核心写操作 | 自动化状态 | 备注 |
  |------|-----------|-----------|------|
  | F3 | `exchangeGoods` + `cancelExchange` + `confirmPickup` | ✅ S3.6/S3.7/S3.9 | S3.9 为条件写（依赖 status=1 记录） |
  | F7 | `createAppointment` + `cancelAppointment`（已恢复） | ✅ S7.1b/S7.4f/S7.12 | 截止日期前可取消；截止日期后返回错误 |
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
  | 创建记录（有对应删除/取消接口） | 立即调用 cancel/delete 清理 | S7.1b createAppointment → S7.12 cancelAppointment（**已恢复**，截止日期前可取消） |
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
  | `U.id` | `30` | `users.id=30` 存在，`ambassador_level=1`（实测；文档曾标注为 2，已于 2026-03-02 修正） | 准青鸾大使测试账号 |
  | `U._openid` | `2017456901935075328` | `users._openid` 对应 id=30 | |
  | F5B 测试用户 | `oJr1c7IzbD3FlbdmeiO1fnYDCaL4` (id=34) | level=0 | 普通用户边界测试 |
  | F7 `course_id` | `1` | `user_courses.course_id=1, user_id=30, status=1` 存在 | 确保 createAppointment 不被"未购买"拦截 |
  | F11 活动 | 动态从 `getAvailableActivities` 取 | `ambassador_activities.id=2-8, schedule_date=2026-03-01` | 活动 schedule_name 已于 2026-02-28 更新 |
  | F11 岗位 | 动态取第一个 `required_level=null` 的岗位 | `会务义工/沙龙组织` | 无等级限制，user_id=30 必然满足 |
  | F3 S3.9 exchange_no | 动态从 S3.8 列表取 status=1 记录 | 现有 EX2026022X 系列 | 每次确认领取后减少一条；S3.6 成功时可补充 |

  ---

  ---

  ## 流程 F12：课程合同管理 · 管理员录入 · 合同模板 · 奖励触发 · 上架校验

  > **功能说明（2026-03-06 合同流程改造）**：
  > - 课程合同改为管理员后台手动录入线下合同（上传照片），录入后直接生效（status=1, sign_type=3）
  > - 预约课程不再需要合同拦截，购买即可预约
  > - 大使合同保留电子签署，签署后直接生效（无审核环节）
  > - 已废弃接口：`checkCourseContract`、`signCourseContract`、`getContractTemplateByCourse`、`auditContractSignature`
  >
  > **测试用户**：user_id=30，course_id=18（attend_count=0，contract_signed=0）
  >
  > **涉及表**：user_courses（contract_signed, expire_at）、contract_templates（course_id + contract_type=4）、contract_signatures（contract_images, sign_type）、courses
  >
  > **涉及云函数**：ambassador（adminCreateCourseContract、adminGetUserPaidCourses、adminGetCourseContractTemplate、createContractTemplate、updateContractTemplate、deleteContractTemplate、signContract）、course（updateCourse、createAppointment）

  ### 自动化测试步骤

  | 步骤 | 类型 | Action | 描述 | 状态 |
  |------|------|--------|------|------|
  | S12.0a | 🧹 前置清理 | `adminGetCourseContractTemplate` | 查询 course_id=18 现有测试合同模板 | ⏳ 重测 |
  | S12.0b | 🧹 前置清理 | `deleteContractTemplate` | 删除 course_id=18 旧测试合同（保证基线干净） | ⏳ 重测 |
  | S12.2 | 📖 读操作（Admin） | `adminGetCourseContractTemplate` | 查询 course_id=18 模板（期望 null 或跳过） | ⏳ 重测 |
  | S12.3 | ✏️ 写操作（Admin） | `createContractTemplate` | 为 course_id=18 创建合同模板（条件执行，已有则跳过） | ⏳ 重测 |
  | | 参数 | `contract_name`（snake_case）, `contractType:'course'`, `courseId:18` | ⚠️ 参数为 snake_case | |
  | | 验证 SQL | `SELECT id, contract_name, contract_type, course_id, status FROM tiandao_culture.contract_templates WHERE course_id=18 AND contract_type=4 ORDER BY id DESC LIMIT 3` | status=1 | |
  | S12.6 | 📖 读操作（Admin） | `adminGetCourseContractTemplate` | 管理端验证模板入库，contract_type=4，course_id=18 | ⏳ 重测 |
  | S12.7 | ✏️ 写操作（Admin） | `updateContractTemplate` | 更新 course_id=18 合同模板名称/有效期 | ⏳ 重测 |
  | | 验证 SQL | `SELECT id, contract_name, validity_years FROM tiandao_culture.contract_templates WHERE id=?` | 字段已更新 | |
  | S12.10a | 🧹 前置清理 | `adminGetCourseContractTemplate` | 查询 course_id=5 现有测试合同模板 | ⏳ 重测 |
  | S12.10b | 🧹 前置清理 | `deleteContractTemplate` | 删除 course_id=5 旧测试合同（保证 S12.11 拦截有效） | ⏳ 重测 |
  | S12.11 | ✏️ 写操作（Admin） | `updateCourse` | 无合同模板的 course_id=5 上架应被拦截 | ⏳ 重测 |
  | | 期望 | `success: false`，错误含"必须配置学习服务协议模板" | | |
  | | 验证 SQL | `SELECT id, name, status FROM tiandao_culture.courses WHERE id=5` | status 仍为 0 | |
  | S12.11b | ✏️ 写操作（Admin） | `createContractTemplate` | 为 course_id=5 创建合同模板（S12.12 前置） | ⏳ 重测 |
  | S12.12 | ✏️ 写操作（Admin） | `updateCourse` | 有合同模板的 course_id=5 上架应成功 | ⏳ 重测 |
  | | 验证 SQL | `SELECT id, name, status FROM tiandao_culture.courses WHERE id=5` | status=1 | |
  | S12.12b | 🧹 测试清理 | `updateCourse` | 恢复 course_id=5 为下架（status=0） | ⏳ 重测 |
  | S12.B7 | 📖 边界 | `updateCourse` | course_id=18 已上架再次 status=1，跳过模板校验 | ⏳ 重测 |

  ### 新增测试步骤（合同流程改造）

  | 步骤 | 类型 | Action | 描述 | 状态 |
  |------|------|--------|------|------|
  | S12.N1 | 📖 读操作（Admin） | `adminGetUserPaidCourses` | 查询用户待签合同课程列表，期望返回 contract_signed=0 的课程 | ⏳ 已加入自动化 |
  | | 期望 | 返回列表 | 只包含 status=1 且 contract_signed=0 的课程 | |
  | | 验证 SQL | `SELECT course_id, contract_signed FROM tiandao_culture.user_courses WHERE user_id=30 AND status=1 AND contract_signed=0` | 包含 course_id=18 | |
  | S12.N2 | ✏️ 写操作（Admin） | `adminCreateCourseContract` | 管理员为用户录入课程线下合约（userId, courseId, contractImages） | ⏳ 已加入自动化 |
  | | 期望 | `contract_signatures.status` | 1（直接生效） | |
  | | 期望 | `contract_signatures.sign_type` | 3（管理员录入） | |
  | | 期望 | `contract_signatures.contract_images` | 非空 JSON 数组 | |
  | | 期望 | `user_courses.contract_signed` | 1 | |
  | | 期望 | `user_courses.expire_at` | 非 NULL | |
  | | 验证 SQL | `SELECT contract_signed, expire_at FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=18 AND status=1` | contract_signed=1, expire_at 非空 | |
  | | 验证 SQL | `SELECT status, sign_type, contract_images FROM tiandao_culture.contract_signatures WHERE user_id=30 AND course_id=18 ORDER BY id DESC LIMIT 1` | status=1, sign_type=3, contract_images 非空 | |
  | S12.N3 | ✏️ 写操作（Admin） | `adminCreateCourseContract` | 重复录入拦截：已有有效合约的课程不可再次录入 | ⏳ 已加入自动化 |
  | | 期望 | `success: false` | 错误含"已存在有效合约" | |
  | S12.N4 | ✏️ 写操作（Admin） | `adminCreateCourseContract` | 缺少 contractImages 参数 → 参数错误 | ⏳ 已加入自动化 |
  | | 期望 | `success: false` | 错误含"请上传至少一张" | |
  | S12.N5 | ✏️ 写操作（Admin） | `adminCreateCourseContract` | 用户未购买该课程 → 报错 | ⏳ 已加入自动化 |
  | | 期望 | `success: false` | 错误含"未找到" | |
  | S12.N6 | 📖 读操作 | `createAppointment` | 预约课程无合同拦截：未签合同用户也可预约 | ⏳ 待测 |
  | | 期望 | 预约成功或返回正常错误（非合同相关） | 只校验 user_courses.status=1 | |
  | S12.N7 | 📖 读操作 | `getContractDetail` | 查看已录入合约详情，返回 contract_images 和 sign_type | ⏳ 已加入自动化 |
  | | 期望 | `contract_images` | 非空数组，URL 格式 | |
  | | 期望 | `sign_type` | 3 | |
  | S12.N8 | 📖 读操作 | `getMyContracts` | 合约列表包含 sign_type 和 contract_images 字段 | ⏳ 已加入自动化 |
  | | 期望 | 列表中 sign_type=3 的记录 | contract_images 非空 | |
  | S12.N9 | ✏️ 写操作 | `signContract` (大使合同) | 大使合同签署直接生效，无待审核 | ⏳ 待测 |
  | | 期望 | `contract_signatures.status` | 1（直接生效，非5待审核） | |
  | | 期望 | `users.ambassador_level` | 升级到对应等级 | |
  | | 期望 | 返回无 `audit_pending` 字段 | 不再有待审核状态 | |

  ### need_contract 字段与上架校验 · 签到联动

  | 步骤 | 类型 | Action | 描述 | 状态 |
  |------|------|--------|------|------|
  | S12.N10 | ✏️ 写操作 | `createCourse` | 新增课程，needContract=1（需要合同） | ⏳ 待测 |
  | | 期望 | `need_contract` | 1 | |
  | | 验证 SQL | `SELECT need_contract FROM tiandao_culture.courses WHERE id=?` | 结果应为 1 | |
  | S12.N11 | ✏️ 写操作 | `createCourse` | 新增课程，needContract=0（不需要合同） | ⏳ 待测 |
  | | 期望 | `need_contract` | 0 | |
  | S12.N12 | ✏️ 写操作 | `updateCourse` | 修改课程 needContract=0，尝试上架 | ⏳ 待测 |
  | | 期望 | 上架成功（无需合同模板） | | |
  | S12.N13 | ✏️ 写操作 | `updateCourse` | needContract=1 课程无合同模板时尝试上架 | ⏳ 待测 |
  | | 期望 | 报错"课程上架前必须配置学习服务协议模板" | | |
  | S12.N14 | 📖 读操作 | `adminGetUserPaidCourses` | 查询用户已购课程列表 | ⏳ 待测 |
  | | 期望 | need_contract=0 的课程不出现在列表中 | | |
  | S12.N15 | ✏️ 写操作 | `batchCheckin` | need_contract=0 课程首次签到（attend_count 0→1） | ⏳ 待测 |
  | | 期望 | contract_signed 自动变为 1，expire_at 自动设置，推荐人奖励发放 | | |
  | | 验证 SQL | `SELECT contract_signed, expire_at, pending_days FROM tiandao_culture.user_courses WHERE user_id=? AND course_id=?` | contract_signed=1, expire_at 非空, pending_days=0 | |
  | S12.N16 | ✏️ 写操作 | `batchCheckin` | need_contract=1 课程首次签到（attend_count 0→1） | ⏳ 待测 |
  | | 期望 | contract_signed 保持 0（不自动触发，等管理员录入合约） | | |

  ### 新增测试步骤（2026-03-13 合同照片管理 + 列表字段修复）

  | 步骤 | 类型 | Action | 描述 | 状态 |
  |------|------|--------|------|------|
  | S12.N17 | ✏️ 写操作（Admin） | `updateContractImages` | 后台补充合同照片：选择已有合约记录 → 上传合同照片 | ⏳ 待测 |
  | | 参数 | `signatureId`, `contractImages` (fileID 数组) | signatureId 为已存在的合约记录 ID | |
  | | 期望 | `updated: true` | 更新成功 | |
  | | 验证 SQL | `SELECT id, contract_images FROM tiandao_culture.contract_signatures WHERE id=?` | contract_images 应为 JSON 数组，包含上传的 fileID | |
  | S12.N17b | ❌ 边界（Admin） | `updateContractImages` | 缺少 signatureId 参数 | ⏳ 待测 |
  | | 期望 | `success: false` | 错误含"缺少必要参数" | |
  | S12.N17c | ❌ 边界（Admin） | `updateContractImages` | contractImages 为空数组 | ⏳ 待测 |
  | | 期望 | `success: false` | 错误含"请至少上传一张合同照片" | |
  | S12.N17d | ❌ 边界（Admin） | `updateContractImages` | signatureId 不存在（如 id=99999） | ⏳ 待测 |
  | | 期望 | `success: false` | 错误含"合约记录不存在" | |
  | S12.N18 | 📖 读操作（Admin） | `getContractList` | 验证合约列表返回新增字段（contract_images, _rawContractImageIds, contract_url, sign_type） | ⏳ 待测 |
  | | 期望 | `contract_images` | CDN URL 数组（已上传照片的记录非空） | |
  | | 期望 | `_rawContractImageIds` | 原始 fileID 数组（与 contract_images 一一对应） | |
  | | 期望 | `contract_url` | 电子合约文件 CDN URL（有 contract_file_id 时非空） | |
  | | 期望 | `sign_type` | 1（用户签署）/ 2（管理员续签）/ 3（管理员录入） | |
  | | 期望 | `ambassador_name` | 非空字符串（从 users.real_name 获取） | |
  | | 期望 | `signed_at` / `expires_at` | 签署时间和到期时间字段 | |
  | | 验证 SQL | `SELECT id, sign_type, contract_images, contract_file_id FROM tiandao_culture.contract_signatures ORDER BY id DESC LIMIT 5` | 与接口返回字段一致 | |

  ### 已废弃的测试步骤（合同流程改造后不再适用）

  | 原步骤 | 原 Action | 废弃原因 |
  |--------|----------|---------|
  | S12.1 | `checkCourseContract` | 接口已废弃，预约不再需要合同拦截 |
  | S12.4 | `checkCourseContract` | 接口已废弃 |
  | S12.5 | `getContractTemplateByCourse` (client) | 客户端接口已废弃，课程合同改为管理员录入 |
  | S12.B1 | `checkCourseContract` | 接口已废弃 |
  | S12.B1b | `checkCourseContract` | 接口已废弃 |
  | S12.B1c | `checkCourseContract` | 接口已废弃 |
  | S12.B2 | `signCourseContract` | 接口已废弃 |
  | S12.B3 | `signCourseContract` | 接口已废弃 |
  | S12.MT1~MT6 | `signCourseContract` 手动签名 | 课程合同不再线上签署 |

  ### 清理说明

  自动化测试内置清理步骤（S12.0a/0b、S12.10a/10b、S12.12b），无需手动清理合同模板。

  新增测试（S12.N2）完成后需清理：
  - `DELETE FROM tiandao_culture.contract_signatures WHERE user_id=30 AND course_id=18`
  - `UPDATE tiandao_culture.user_courses SET contract_signed=0, expire_at=NULL WHERE user_id=30 AND course_id=18`
  - `UPDATE tiandao_culture.orders SET is_reward_granted=0, reward_granted_at=NULL WHERE user_id=30 AND related_id=18 AND order_type=1`（如测试了奖励发放）

  ---

  ---

  ## 流程 F13：退款申请 · 合同拦截 · 审核流转 · 业务回滚

  > **功能说明**：打通小程序端退款申请到后台审核的完整链路。退款为纯人工财务转账，不调用微信退款 API。已签署学习合同的课程无法退款。
  >
  > **涉及表**：`orders`（refund_status / refund_amount / refund_reason / refund_reject_reason / refund_invoice_file_id / refund_transfer_no / refund_audit_admin_id / refund_audit_time）、`user_courses`（contract_signed / status）、`appointments`（status）
  >
  > **涉及云函数**：`order`（requestRefund、getRefundStatus、getRefundList、rejectRefund、markRefundTransferred）、`user`（getMyOrders、getMyCourses）

  ```
  getMyOrders(找目标) → getMyCourses(合同字段) → getRefundStatus(基线) → requestRefund(申请) → 重复拦截 → getRefundStatus(=1) → getRefundList(统计) → rejectRefund(驳回清理) → getRefundStatus(=4+审核) → 边界×8
  ```

  **测试目的**：验证退款全链路状态流转（0→1→4）、合同拦截、统计接口、管理端审核、以及各类边界参数校验。

  **关键业务规则**：
  | # | 规则 | 来源 |
  |---|------|------|
  | 1 | `pay_status=1` 且 `refund_status=0` 时才可申请退款 | requestRefund 校验 |
  | 2 | `user_courses.contract_signed=1` 时拒绝退款 | requestRefund 合同拦截 |
  | 3 | `order_type=4`（大使升级订单）不支持退款 | requestRefund 类型拦截 |
  | 4 | 同一订单不可重复申请（refund_status≠0 时拒绝） | requestRefund 幂等校验 |
  | 5 | 退款为人工转账，`markRefundTransferred` 必须上传发票 | markRefundTransferred 校验 |
  | 6 | 驳回后 `refund_status=4`，含 `reject_reason` + `audit_time` + `audit_admin_id` | rejectRefund 逻辑 |
  | 7 | 退款列表 `getRefundList` 返回 `statistics` 统计各状态数量和待退金额 | getRefundList 统计 |
  | 8 | 标记转账后执行业务回滚：课程失效(status→0)、预约取消(status→3) | markRefundTransferred 回滚 |

  ### 📋 测试步骤

  | 步骤 | 类型 | Action | 云函数 | 描述 |
  |------|------|--------|--------|------|
  | S13.1 | 📖 读操作 | `getMyOrders` | `user` | 查已支付订单（寻找退款测试目标 + 边界用订单） |
  | S13.2 | 📖 读操作 | `getMyCourses` | `user` | 验证 contract_signed 字段存在 + 统计已签合同课程 |
  | S13.3 | 📖 读操作 | `getRefundStatus` | `order` | 退款状态基线确认（验证返回字段完整性） |
  | S13.4 | ✏️ 条件写 | `requestRefund` | `order` | 申请退款（条件: refund_status=0 时执行） |
  | S13.4b | 📖 读操作 | `requestRefund` | `order` | 重复申请拦截验证（refund_status≠0 应被拒绝） |
  | S13.5 | 📖 读操作 | `getRefundStatus` | `order` | 验证 refund_status=1 + refund_amount=final_amount |
  | S13.6 | 📖 读操作(Admin) | `getRefundList` | `order` | 管理端退款列表 + statistics 统计字段验证 |
  | S13.7 | ✏️ 写操作(Admin) | `rejectRefund` | `order` | 驳回退款申请（数据清理，返回 refund_status=4） |
  | S13.8 | 📖 读操作 | `getRefundStatus` | `order` | 验证 refund_status=4 + reject_reason + audit_time |
  | **S13.8b** | **✏️ MT 写操作** | `requestRefund` | `order` | **重新申请退款（需人工：MT-17）** |
  | **S13.9** | **✏️ MT Admin+文件** | `markRefundTransferred` | `order` | **标记已转账+发票（需人工：MT-20）** |
  | **S13.10** | **📖 MT 读操作** | `getRefundStatus` | `order` | **验证 refund_status=3, pay_status=4（需MT-20完成后）** |

  ### 边界验证（自动化 ×8）

  | 步骤 | Action | 描述 | 期望结果 |
  |------|--------|------|----------|
  | S13.B1 | `requestRefund` | 空 refund_reason | 返回"请填写退款原因" |
  | S13.B2 | `requestRefund` | 缺少 order_no | 返回"缺少订单号" |
  | S13.B3 | `requestRefund` | contract_signed=1 的课程（合同拦截） | 返回"已签署学习合同，无法退款"（依赖 MT-30 签约数据，可跳过） |
  | S13.B4 | `requestRefund` | pay_status≠1 的未支付订单 | 返回"只能对已支付订单申请退款"（依赖有未支付订单，可跳过） |
  | S13.B5 | `markRefundTransferred` | 缺少 invoice_file_id | 返回"请先上传电子发票" |
  | S13.B6 | `markRefundTransferred` | 缺少 order_id | 返回"缺少订单ID" |
  | S13.B7 | `rejectRefund` | 缺少 reject_reason | 返回"驳回时需要提供原因" |
  | S13.B8 | `getRefundStatus` | 缺少 order_no | 返回"缺少订单号" |

  #### 复训费退款专项测试用例（2026-03-23 新增）

  | 步骤 | 类型 | Action | 描述 |
  |------|------|--------|------|
  | S13.RT1 | ⏳ 手动 | `requestRefund` | 复训预约取消后，小程序我的预约页显示「复训费退款」按钮（最新取消时间的预约） |
  | | 期望 | 前端展示 | 该预约卡片底部出现橙色「复训费退款」按钮，其他预约卡片无此按钮 |
  | S13.RT2 | ⏳ 手动 | `requestRefund` | 点击「复训费退款」→ 确认弹窗 → 提交 |
  | | 期望 | `refund_status` | orders.refund_status = 1（申请中） |
  | | 期望 | `retrain_credit_status` | orders.retrain_credit_status = 0（立即失效） |
  | | 验证 SQL | `SELECT refund_status, retrain_credit_status FROM tiandao_culture.orders WHERE order_no='<复训订单号>'` | 结果应为 refund_status=1, retrain_credit_status=0 |
  | S13.RT3 | ⏳ 手动 | `rejectRefund` | 后台驳回该复训费退款 |
  | | 期望 | `refund_status` | orders.refund_status = 4（已驳回） |
  | | 期望 | `retrain_credit_status` | orders.retrain_credit_status = 1（资格恢复） |
  | | 验证 SQL | `SELECT refund_status, retrain_credit_status FROM tiandao_culture.orders WHERE order_no='<复训订单号>'` | 结果应为 refund_status=4, retrain_credit_status=1 |
  | S13.RT4 | ⏳ 手动 | `markRefundTransferred` | 后台审核通过（标记已转账+上传发票） |
  | | 期望 | `refund_status` | orders.refund_status = 3（已退款） |
  | | 期望 | `retrain_credit_status` | orders.retrain_credit_status = 0（永久失效） |
  | | 期望 | 前端展示 | 小程序该预约卡片状态徽章显示「已退款」而非「已取消」 |
  | | 验证 SQL | `SELECT refund_status, retrain_credit_status, pay_status FROM tiandao_culture.orders WHERE order_no='<复训订单号>'` | 结果应为 refund_status=3, retrain_credit_status=0, pay_status=4 |
  | S13.RT5 | ⏳ 手动 | `requestRefund` | 退款审核中（refund_status=1）时，再次申请退款应被拦截 |
  | | 期望 | 错误信息 | 返回"该订单退款审核中，请耐心等待" |
  | S13.RT6 | ⏳ 手动 | 后台 getRefundList | 后台退款列表新增「退款分类」列，复训费退款显示橙色「复训费退款」标签 |
  | | 期望 | 筛选功能 | 选择「复训费退款」后，仅显示 order_type=2 的退款记录 |
  | S13.RT7 | ⏳ 手动 | `requestRefund` | retrain_credit_status=2（资格已使用）时申请退款应被拦截 |
  | | 期望 | 错误信息 | 返回"复训资格已使用，无法退款" |

  ### biz 断言详情

  | 步骤 | 断言 | 期望 | 状态 |
  |------|------|------|------|
  | S13.1 | getMyOrders 接口正常返回 | OK | ✅ 6条已支付订单（2026-03-04） |
  | S13.1 | 存在已支付订单 | ≥1 条 pay_status=1 | ✅ |
  | S13.2 | getMyCourses 接口正常返回 | OK | ✅ |
  | S13.2 | 每条课程含 contract_signed 字段 | 全部含该字段 | ✅ 7条均含该字段 |
  | S13.2 | 统计已签合同课程（S13.B3 依赖） | 信息性 | ✅ 1条已签合同（course_id=27） |
  | S13.3 | getRefundStatus 接口正常返回 | OK | ✅ 主目标正确切换为 TST202603020001 |
  | S13.3 | 退款状态基线确认 | refund_status=0 | ✅ refund_status=0 |
  | S13.3 | 返回含 order_name 字段 | 非空 | ✅ [AI测试数据] 初探班 |
  | S13.3 | 返回含 final_amount 字段 | 有值 | ✅ final_amount=1688.00 |
  | S13.4 | requestRefund 成功（条件执行） | success=true 或合理跳过 | ✅ 退款申请已提交（TST202603020001，contract_signed=0） |
  | S13.4 | 返回含 refund_amount 字段 | 有值 | ✅ refund_amount=1688.00 |
  | S13.4b | 重复申请应被拦截 | success=false | ✅ 该订单退款审核中，请耐心等待 |
  | S13.5 | refund_status 应为 1 | refund_status=1 | ✅ DB验证：refund_status=1后被驳回→4✓ |
  | S13.5 | refund_amount 应等于 final_amount | 金额一致 | ✅ 1688.00=1688.00 |
  | S13.6 | getRefundList 接口正常返回 | OK | ✅ 2条待审核 |
  | S13.6 | 列表字段含 id/order_no/refund_status/amount | 完整 | ✅ |
  | S13.6 | statistics 含 pending/transferred/rejected/pendingAmount | 4个统计字段均有 | ✅ pending=2 transferred=2 rejected=2 amount=1688.01 |
  | S13.6 | 列表含 refund_status_text 状态文本 | 全部有文本 | ✅ 2条均有状态文本 |
  | S13.7 | rejectRefund 成功 | success=true | ✅ 驳回成功，数据已清理 |
  | S13.7 | 返回 refund_status=4 | refund_status=4 | ✅ |
  | S13.8 | 驳回后 refund_status=4 | refund_status=4 | ✅ DB验证：TST202603020001 refund_status=4✓ |
  | S13.8 | 驳回后 refund_reject_reason 有值 | 非空 | ✅ 集成测试自动驳回（数据还原）；DB验证✓ |
  | S13.8 | 驳回后 refund_audit_time 有值 | 非空 | ✅ 2026-03-04 17:18:20；refund_audit_admin_id=5✓ |
  | **S13.P2** | **[v2.4 MT-42 手动]** markRefundTransferred 后 pending_days 扣减 | v2.4：退款转账后对未签约课程扣减 pending_days（非 expire_at） | ✅ 已通过（2026-03-04） |
  | | v2.4期望 | pending_days 减少 validity_days（365→0），expire_at 仍为 NULL | 验证：何日琛 ORD202603030704123642 → user_courses id=30 pending_days 365→0，expire_at=NULL，status=2 ✓ |
  | S13.B1 | 空 refund_reason 应报错 | success=false | ✅ 请填写退款原因 |
  | S13.B2 | 缺少 order_no 应报错 | success=false | ✅ 缺少订单号 |
  | S13.B3 | 合同拦截应返回含"合同"错误 | success=false + 合同拦截 | ✅ TST202603040002 contract_signed=1；DB验证：refund_status=0未被改变✓ |
  | S13.B4 | 未支付/已取消订单退款应被拦截 | success=false | ⏳ 脚本已修复（接受 pay_status=2 订单），待下次运行 |
  | S13.B5 | 缺 invoice_file_id 应报错 | success=false | ✅ 请先上传电子发票，上传后方可标记已转账 |
  | S13.B6 | 缺 order_id 应报错 | success=false | ✅ 缺少订单ID |
  | S13.B7 | 缺 reject_reason 应报错 | success=false | ✅ 驳回时需要提供原因 |
  | S13.B8 | 缺 order_no 应报错 | success=false | ✅ 缺少订单号 |

  ### 新增测试步骤（2026-03-03 变更：退款重新申请 + 前端 Tab 分栏）

  | 步骤 | 操作 | 描述 | 期望结果 |
  |------|------|------|----------|
  | S13.9 | ✏️ `requestRefund` | 对 refund_status=4（已驳回）的订单重新申请退款 | success=true, refund_status=1, refund_reject_reason 清空 |
  | S13.10 | ✏️ `requestRefund` | 对 refund_status=2（退款失败）的订单重新申请退款 | success=true, refund_status=1 |
  | S13.11 | ✏️ `requestRefund` | 对 refund_status=3（已退款）的订单尝试申请退款 | success=false, 返回"已退款，无法重复申请" |
  | S13.12 | 📖 `getList` | 查询 status=1 的订单列表 | 返回数据包含 refund_reason, refund_reject_reason, invoice_url 字段 |
  | S13.13 | 📖 `getList` | 查询 status=4 的已退款订单列表 | 已退款订单的 invoice_url 不为空（如有发票） |
  | S13.14 | 🖥️ 前端验证 | 退款页未退款 Tab | 各退款状态显示对应标签（申请中/失败/驳回） |
  | S13.15 | 🖥️ 前端验证 | 退款页已退款 Tab | 已退款订单显示"查看电子发票"按钮，不可选中 |

  | 步骤 | 断言 | 期望 | 状态 |
  |------|------|------|------|
  | S13.9 | 驳回后重新申请 → refund_status 变为 1 | refund_status=1, refund_reject_reason=null | ⏳ 已加入自动化 |
  | S13.10 | 失败后重新申请 → refund_status 变为 1 | refund_status=1 | ⏳（需手动构造 refund_status=2 数据） |
  | S13.11 | 已退款不可重新申请 | success=false | ⏳ 已加入自动化 |
  | S13.12 | getRefundList 返回退款字段 | refund_reason/refund_reject_reason/invoice_url 字段存在 | ⏳ 已加入自动化 |
  | S13.13 | 已退款订单有 invoice_url | invoice_url 非空 | ⏳ |
  | S13.14 | 前端未退款 Tab 标签展示 | 各状态标签正确 | ⏳ MT |
  | S13.15 | 前端已退款 Tab 不可选 | 无 radio 选择器 | ⏳ MT |

  ### 新增验证 SQL（S13.9~S13.13）

  ```sql
  -- S13.9: 驳回后重新申请验证
  SELECT order_no, refund_status, refund_reason, refund_reject_reason, refund_audit_admin_id, refund_audit_time
  FROM tiandao_culture.orders WHERE order_no='<目标订单号>'
  -- 期望: refund_status=1, refund_reject_reason=NULL, refund_audit_admin_id=NULL

  -- S13.12: getList 返回退款字段验证
  SELECT order_no, refund_status, refund_reason, refund_reject_reason, refund_invoice_file_id
  FROM tiandao_culture.orders WHERE user_id=30 AND pay_status IN (1,4) AND refund_status > 0 ORDER BY id DESC LIMIT 5;
  ```

  ### ★ 核心验证 SQL

  ```sql
  -- S13.1: 查找退款测试目标订单
  SELECT order_no, order_name, order_type, pay_status, refund_status, final_amount, related_id
  FROM tiandao_culture.orders WHERE user_id=30 AND pay_status IN (0,1) ORDER BY created_at DESC LIMIT 15;

  -- S13.4: 申请退款后验证
  SELECT order_no, pay_status, refund_status, refund_amount, refund_reason
  FROM tiandao_culture.orders WHERE order_no='<目标订单号>'
  -- 期望: refund_status=1, refund_amount=final_amount

  -- S13.6: 退款管理统计验证
  SELECT
    SUM(CASE WHEN refund_status=1 THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN refund_status=3 THEN 1 ELSE 0 END) as transferred,
    SUM(CASE WHEN refund_status=4 THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN refund_status=1 THEN COALESCE(refund_amount, final_amount) ELSE 0 END) as pendingAmount
  FROM tiandao_culture.orders WHERE refund_status > 0;

  -- S13.7/S13.8: 驳回后验证
  SELECT order_no, refund_status, refund_reject_reason, refund_audit_admin_id, refund_audit_time
  FROM tiandao_culture.orders WHERE order_no='<目标订单号>'
  -- 期望: refund_status=4, refund_reject_reason 有值, refund_audit_time 有值

  -- S13.B3: 合同拦截验证
  SELECT o.order_no, o.refund_status, uc.contract_signed, uc.course_id
  FROM tiandao_culture.orders o
  JOIN tiandao_culture.user_courses uc ON o.related_id=uc.course_id AND o.user_id=uc.user_id
  WHERE o.user_id=30 AND o.order_type=1 AND uc.contract_signed=1 AND uc.status=1
  -- 期望: 这些订单的 refund_status 不应被改变

  -- 退款状态全链路验证
  SELECT o.order_no, o.pay_status, o.refund_status, o.refund_amount,
    o.refund_reason, o.refund_reject_reason,
    o.refund_audit_admin_id, o.refund_audit_time,
    o.refund_time, o.refund_transfer_no,
    o.refund_invoice_file_id
  FROM tiandao_culture.orders o
  WHERE o.user_id = 30 AND o.refund_status > 0
  ORDER BY o.id DESC LIMIT 10;

  -- 业务回滚验证（MT-20 完成后）：退款后 user_courses.status=0, appointments.status=3
  SELECT uc.id, uc.course_id, uc.status as user_course_status,
    (SELECT COUNT(*) FROM tiandao_culture.appointments a
    WHERE a.user_id=uc.user_id AND a.course_id=uc.course_id AND a.status=3) as cancelled_appointments
  FROM tiandao_culture.user_courses uc
  JOIN tiandao_culture.orders o ON uc.order_id = o.id
  WHERE o.user_id = 30 AND o.refund_status = 3
  ORDER BY uc.id DESC LIMIT 5;
  ```

  ### 关键业务规则说明

  | 规则 | 描述 |
  |------|------|
  | 合同拦截 | `user_courses.contract_signed=1` 时 `requestRefund` 返回错误，`refund_status` 不变 |
  | 人工转账 | 不调用微信退款 API，财务线下银行转账后在后台上传发票标记 |
  | 发票必填 | `markRefundTransferred` 的 `invoice_file_id` 为必填参数 |
  | 业务回滚 | 标记已转账后自动执行：课程失效(user_courses.status→0, refund_time写入)、复训预约取消(appointments.status→3) |
  | 状态幂等 | 同一订单 refund_status≠0 时拒绝再次申请 |
  | 驳回审计 | 驳回写入 refund_reject_reason + refund_audit_admin_id + refund_audit_time |
  | refund_status 枚举 | 0=无退款, 1=申请退款, 2=退款处理中, 3=已退款, 4=已驳回 |

  ### 跨流程依赖

  | 流程 | 依赖说明 |
  |------|---------|
  | F13 → F3 | 退款业务回滚影响 orders.pay_status 和 user_courses.status，与 F3 订单数据共享 |
  | F13 → F12 | contract_signed 字段由 F12 课程合同签署流程写入，F13 退款拦截依赖该字段 |
  | F13 → F7 | 退款回滚取消预约（appointments.status→3），与 F7 预约流程共享数据表 |

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

  ## 已知问题与修复记录

  ### BUG-TZ-001: 北京时间双重偏移（2026-03-03 修复）
  - **问题**: 云函数在解析DB北京时间字符串时当作UTC解析，formatDateTime再+8h导致每次读写多偏移8小时
  - **影响**: exchangeCourse叠加有效期、payment赠课叠加、退款回退、管理员赠课、订单过期判断
  - **修复**: 新增 parseBeijingDateStr 工具函数，所有从DB读取日期字符串的地方统一使用
  - **状态**: 已修复并部署全部6个云函数

  ---

  ## F19 学员推荐关系管理（2026-03-18 新增）

  ### 前置条件
  - 管理后台已登录，权限包含 `user-referee`
  - 数据库存在若干学员，部分学员有 `referee_id` 且 `referee_confirmed_at IS NOT NULL`

  ### 测试步骤

  | 编号 | 类型 | Action | 描述 |
  |------|------|--------|------|
  | S19.1 | ✏️ 读操作 | `admin:getUserListForReferee` | 不带任何参数，查询第 1 页学员列表 |
  | | 期望 | `list.length > 0` | 返回学员数组 |
  | | 期望 | `list[0]` 含 `id, real_name, phone, ambassador_level, ambassador_level_name, referee_id, referee_name` | 返回字段完整 |
  | | 验证 SQL | `SELECT COUNT(*) FROM tiandao_culture.users` | 总数应 = `total` 字段 |
  | S19.2 | ✏️ 读操作 | `admin:getUserListForReferee` | 关键词搜索（传已知学员姓名片段） |
  | | 期望 | 返回 `list` 全部匹配关键词 | 搜索正确生效 |
  | S19.3 | ✏️ 读操作 | `admin:getUserListForReferee` | 大使等级筛选（`ambassadorLevel=2`） |
  | | 期望 | `list` 每项 `ambassador_level=2` | 筛选正确生效 |
  | | 验证 SQL | `SELECT COUNT(*) FROM tiandao_culture.users WHERE ambassador_level=2` | 应 = `total` |
  | S19.4 | ✏️ 读操作 | `admin:getUserRefereeTree` | 单个查询（传有下线的学员 `userId`） |
  | | 期望 | 返回 `{ user, referee, tree }` | 字段完整 |
  | | 期望 | `tree.children` 数组每项含 `id, real_name, ambassador_level, ambassador_level_name, children` | 树结构正确 |
  | | 期望 | 所有 `tree.children` 对应的 `users.referee_confirmed_at IS NOT NULL` | 只含正式绑定下线 |
  | | 验证 SQL | `SELECT id, real_name, referee_id, referee_confirmed_at FROM tiandao_culture.users WHERE referee_id=? AND referee_confirmed_at IS NOT NULL` | 结果与 `tree.children` 数量一致 |
  | S19.5 | ✏️ 读操作 | `admin:getUserRefereeTree` | 单个查询（传无下线的学员 `userId`） |
  | | 期望 | `tree.children` 为空数组 | 无下线时正常返回 |
  | S19.6 | ✏️ 读操作 | `admin:getUserRefereeTree` | 批量查询（`userIds=[id1, id2, id3]`） |
  | | 期望 | 返回数组，长度 = 3 | 批量返回正确 |
  | | 期望 | 每项结构同 S19.4 | 每项结构完整 |
  | S19.B1 | 边界 | `admin:getUserListForReferee` | 传不存在的关键词 |
  | | 期望 | `list=[], total=0` | 无匹配时正常返回 |
  | S19.B2 | 边界 | `admin:getUserRefereeTree` | 不传 `userId` 也不传 `userIds` |
  | | 期望 | 返回参数错误 | 缺参拦截正常 |
  | S19.B3 | 边界 | `admin:getUserRefereeTree` | 传不存在的 `userId` |
  | | 期望 | 返回 `null` 或提示"未找到该用户" | 不存在用户处理正常 |

  ### 页面功能手动测试

  | 编号 | 场景 | 步骤 | 期望结果 |
  |------|------|------|---------|
  | MT-F19-1 | 学员列表加载 | 打开后台推荐关系页 | 自动加载第 1 页学员列表，显示 ID/姓名/手机号/大使等级/推荐人 5 列 |
  | MT-F19-2 | 推荐关系弹窗 | 点击任意学员「推荐关系」按钮 | 弹出对话框，顶部显示推荐人（伯乐），下方显示推荐树；切换文字树/图形树视图正常 |
  | MT-F19-3 | 多选导出 | 勾选 2~3 名学员后点击「导出推荐关系 Word」 | 下载 `.docx` 文件，文件中每个学员一个段落，包含推荐人信息和推荐树 |

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

  ---

  ## F15 管理端大使赠送课程 · 名额扣减 · 课程开通/续期（2026-03-03 新增）

  ### 前置条件

  | 流程 | 步骤 | 依赖数据 | 验证 SQL |
  |------|------|----------|----------|
  | F15 | 全部 | 存在 ambassador_level>=2 的大使（如 user_id=34），且 ambassador_quotas 中有 remaining_quantity>0 的记录 | `SELECT aq.id, aq.user_id, aq.quota_type, aq.remaining_quantity FROM tiandao_culture.ambassador_quotas aq WHERE aq.status=1 AND aq.remaining_quantity>0 LIMIT 5` |
  | F15 | 全部 | 存在 status=1 的初探班或密训班课程 | `SELECT id, name, type, validity_days FROM tiandao_culture.courses WHERE status=1 AND type IN(1,2)` |
  | F15 | S15.3 | 接收人已拥有目标课程（用于测试延期逻辑）| `SELECT id, user_id, course_id, expire_at, status FROM tiandao_culture.user_courses WHERE user_id=30 AND status=1 LIMIT 5` |

  ### 测试步骤

  | 步骤 | 类型 | 接口 | 描述 |
  |------|------|------|------|
  | S15.1 | ✏️ 写操作 [v2.4重构] | `adminGiftCourse` | 赠送课程给**未拥有或已失效**的用户（激活路径：status=2→1） |
  | | v2.4期望 | user_courses: `contract_signed=0, pending_days=validity_days, expire_at=NULL` (待签约状态，非立即写入expire_at) | |
  | | 期望 | ambassador_quotas 对应记录 `used_quantity+1, remaining_quantity-1` | |
  | | 期望 | quota_usage_records 新增一条：`usage_type=1, course_id 正确` | |
  | | 验证 SQL | `SELECT uc.id, uc.is_gift, uc.attend_count, uc.gift_source, uc.contract_signed, uc.pending_days, uc.expire_at, uc.status FROM tiandao_culture.user_courses uc WHERE uc.user_id=30 AND uc.course_id=4 ORDER BY uc.id DESC LIMIT 1` | v2.4期望: contract_signed=0, pending_days=validity_days, expire_at=NULL, status=1 |
  | | 验证 SQL | `SELECT id, used_quantity, remaining_quantity FROM tiandao_culture.ambassador_quotas WHERE user_id=32 AND quota_type=1` | remaining_quantity 比操作前少 1 |
  | | 验证 SQL | `SELECT id, usage_type, course_id, recipient_id, remark FROM tiandao_culture.quota_usage_records WHERE ambassador_id=32 ORDER BY id DESC LIMIT 3` | usage_type=1, course_id 正确, remark 含"激活" |
  | S15.2 | ✏️ 写操作 [v2.4重构] | `adminGiftCourse` | 重复赠送（用户已拥有该课程）—— 分两种情况 |
  | | v2.4情况B | 用户 contract_signed=0（未签约）→ 叠加 pending_days（不改 expire_at） | |
  | | v2.4情况C | 用户 contract_signed=1（已签约）→ 延长 expire_at + contract_end | |
  | | 验证 SQL | `SELECT id, contract_signed, pending_days, expire_at, updated_at FROM tiandao_culture.user_courses WHERE user_id=30 AND course_id=4 AND status=1 ORDER BY id DESC LIMIT 1` | v2.4: 未签约→pending_days增加; 已签约→expire_at延长 |
  | S15.3 | ❌ 边界 | `adminGiftCourse` | 名额不足时赠送 |
  | | 期望 | 返回错误："大使的XX名额不足" | |
  | S15.4 | ❌ 异常拦截 | `adminGiftCourse` | 赠送咨询/沙龙类型课程（type=3/4） |
  | | 期望 | 返回错误："该课程类型不支持赠送" | |
  | S15.5 | ❌ 异常拦截 | `adminGiftCourse` | 赠送已下架课程 |
  | | 期望 | 返回错误："该课程已下架" | |

  ---

  ## 📋 手动测试执行计划（MT Plan）

  > **⛔ 执行规则（基于规则 MT-STEP）：每完成一个步骤后，立即告知 AI，等待 DB 交叉验证通过后再进行下一步。禁止连续操作多步再集中报告。**

  ---

  ### MT-A 组：导航栈验证（快速，无需 DB 验证）

  适合先做，不涉及数据变更，只需截图确认页面跳转。

  | 编号 | 项目 | 测试要点 | 操作步骤 | 期望结果 |
  |---|---|---|---|---|
  | **MT-34** | 升级指南→支付→返回导航栈 | 支付后返回不重复创建升级订单 | 小程序→大使中心→升级指南→支付→支付成功/取消→返回 | 返回到大使中心（非升级指南页） |
  | **MT-35** | 预约确认→复训路径导航栈 | 提交后防双击，不创建重复预约 | 小程序→课程详情→选排期→预约确认→快速连续点击确定 | 只创建 1 条预约记录 |
  | **MT-45** | 密训班详情页赠课 tab | 详情页显示"赠送XXX"tab | 小程序→密训班课程详情页 | 看到"赠送XXX"标签页，内容正确 |

  ---

  ### MT-B 组：密训班赠课完整流程（核心，需逐步验证）

  **前置条件**：需要一个可购买密训班的测试场景（真实支付或模拟支付回调）。

  #### MT-B1：密训班购买→赠课新建（MT-36）

  > 用户**尚未拥有**赠送课程时购买密训班。

  | 步骤 | 操作 | 完成后告知 AI | AI 验证 SQL |
  |---|---|---|---|
  | B1-1 | 确认购买前状态：记录测试用户当前课程列表 | "B1-1 准备完成，user_id=?" | `SELECT id, course_id, is_gift, status, expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> ORDER BY id DESC LIMIT 5` |
  | B1-2 | 小程序→密训班详情→点击购买→完成支付 | "B1-2 支付完成" | `SELECT id, course_id, is_gift, source_order_id, expire_at, status FROM tiandao_culture.user_courses WHERE user_id=<uid> ORDER BY id DESC LIMIT 5` — 应新增 is_gift=1 记录 |
  | B1-3 | 确认密训班本体 user_courses 记录 | "B1-3 已截图" | `SELECT id, course_id, is_gift, attend_count, order_no FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=0 ORDER BY id DESC LIMIT 3` — is_gift=0, attend_count=0 |
  | B1-4 | 确认赠送课程 user_courses 记录 | "B1-4 已截图" | `SELECT id, course_id, is_gift, source_order_id, expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=1 ORDER BY id DESC LIMIT 3` — is_gift=1, expire_at 按 validity_days 计算 |
  | B1-5 | 确认支付回调奖励记录 | "B1-5 已截图" | `SELECT o.order_no, o.is_reward_granted, o.pay_status FROM tiandao_culture.orders WHERE user_id=<uid> ORDER BY id DESC LIMIT 3` — pay_status=1 |

  #### MT-B2：密训班购买→赠课有效期叠加（MT-37）

  > 用户**已拥有**赠送课程时再次购买密训班，有效期应叠加。

  | 步骤 | 操作 | 完成后告知 AI | AI 验证 SQL |
  |---|---|---|---|
  | B2-1 | 记录赠送课程当前 expire_at | "B2-1 记录完成" | `SELECT id, course_id, expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=1 AND status=1 ORDER BY id DESC LIMIT 1` |
  | B2-2 | 再次购买同款密训班并完成支付 | "B2-2 支付完成" | `SELECT id, course_id, expire_at, updated_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=1 ORDER BY id DESC LIMIT 3` — expire_at 应叠加，不新增记录 |

  #### MT-B3：密训班退款→赠课回滚（MT-40/41）

  > 在 MT-B1 或 MT-B2 完成后，对密训班订单执行退款，验证赠课回滚。

  | 步骤 | 操作 | 完成后告知 AI | AI 验证 SQL |
  |---|---|---|---|
  | B3-1 | 记录退款前赠送课程 expire_at 和 status | "B3-1 准备完成" | `SELECT id, status, expire_at FROM tiandao_culture.user_courses WHERE user_id=<uid> AND is_gift=1 ORDER BY id DESC LIMIT 3` |
  | B3-2 | 小程序→申请退款→提交 | "B3-2 退款申请完成" | `SELECT order_no, refund_status, refund_amount FROM tiandao_culture.orders WHERE user_id=<uid> ORDER BY id DESC LIMIT 3` — refund_status=1 |
  | B3-3 | 后台→退款管理→审批通过 | "B3-3 审批完成" | `SELECT order_no, refund_status FROM tiandao_culture.orders WHERE user_id=<uid> ORDER BY id DESC LIMIT 3` — refund_status=3 |
  | B3-4 | 后台→标记已转账 | "B3-4 转账完成" | `SELECT uc.status, uc.expire_at FROM tiandao_culture.user_courses uc WHERE uc.user_id=<uid> AND uc.is_gift=1 ORDER BY uc.id DESC LIMIT 3` — status=0（新建场景）或 expire_at 回退（叠加场景） |

  ---

  ### MT-C 组：签名位置验证（需 PDF 截图）

  | 编号 | 项目 | 操作步骤 | 期望结果 |
  |---|---|---|---|
  | **MT-SIG** | 签名注入位置（insertAfterLabelSmart） | 小程序→课程详情→签署学习合同→完成签名 | 打开 PDF，签名应出现在乙方签名栏（非甲方侧），位置合理 |

  ---

  ### MT 测试顺序建议

  ```
  第1轮（快速，今天可完成）
    MT-A 组：MT-34, MT-35, MT-45（导航栈 + UI 验证）

  第2轮（需支付，需要测试账号）
    MT-B 组：MT-B1 → MT-B2 → MT-B3（密训班赠课完整链路）

  第3轮（可选，需真实操作）
    MT-C 组：MT-SIG（PDF 签名位置）
  ```

  ---

  ### MT 当前进度汇总

  > 最后更新：2026-03-09。⏳ 共 **14 项**待测。

  | 组别 | MT 编号 | 描述 | 操作方式 | 状态 |
  |---|---|---|---|---|
  | MT-A | MT-34 | 升级指南→支付导航栈 | 小程序 | ✅ 已通过 |
  | MT-A | MT-35 | 预约确认防双击导航栈 | 小程序 | ✅ 已通过 |
  | MT-A | MT-45 | 密训班详情赠课 tab | 小程序 | ✅ 已通过 |
  | MT-B | MT-36 (B1) | 密训班购买→赠课新建 | 小程序+支付 | ✅ 已通过 |
  | MT-B | MT-37 (B2) | 密训班购买→赠课有效期叠加 | 小程序+支付 | ✅ 已通过 |
  | MT-B | MT-40 (B3) | 退款→赠课新建回滚（status=2） | 后台 | ✅ 已通过 |
  | MT-B | MT-41 (B3) | 退款→赠课叠加回滚（expire_at 回退） | 后台 | ✅ 已通过（2026-03-05） |
  | MT-B | MT-38 | 商城兑换密训班→赠课逻辑触发 | 小程序+支付 | ✅ 已通过（2026-03-13） |
  | MT-B | MT-39 | 密训班退款-赠课合同拦截 | 小程序 | ✅ 功能通过（2026-03-13；⚠️ 提示语不精确） |
  | MT-C | MT-SIG | PDF 签名位置验证 | 小程序 | ✅ 已通过（2026-03-04） |
  | MT-D | MT-51 | 订阅弹窗真机验证（普通预约） | 小程序真机 | ✅ 已通过（2026-03-04） |
  | MT-D | MT-52 | 订阅弹窗真机验证（复训支付） | 小程序真机 | ✅ 已通过（2026-03-04 真机日志 accept✓） |
  | MT-E | MT-25 | 商城兑换课程续期（功德分减少，merit_points_records source=6 新增） | 小程序 | ✅ 已通过（2026-03-13） |
  | MT-E | MT-26 | 签到二维码覆盖生成（重测：日签到改造后逻辑变更） | 后台 | ⏳ 重测 |
  | MT-E | MT-26b | 非沙龙扫码日签到（appointment_checkins 新增，status 保持 0） | 真机扫码 | ⏳ 待测 |
  | MT-E | MT-26c | 重复扫码签到→返回 already_checked=true，不重复插入 | 真机扫码 | ⏳ 待测 |
  | MT-E | MT-26d | 排期日期外扫码→返回"不在签到时间内"，无记录插入 | 真机扫码 | ⏳ 待测 |
  | MT-E | MT-26e | 后台补签+取消签到（checkin_type=2 写入/删除） | 后台 | ⏳ 待测 |
  | MT-E | MT-26f | 预约创建后 attend_count+1（日签到改造后） | 小程序 | ⏳ 待测 |
  | MT-E | MT-26g | 后台取消预约→attend_count-1，签到记录全清理 | 后台 | ⏳ 待测 |
  | MT-E | MT-26h | 扫码签到不触发积分解冻（BUG 修复确认） | 真机扫码 | ⏳ 待测 |
  | MT-F | MT-30 | 后台录入合约后奖励自动发放（重测：合同流程改造后） | 后台 | ✅ 已通过（2026-03-13；is_reward_granted=1 ✓） |
  | MT-F | MT-53 | 取消排期→关联预约 status=3，复训释放资格（重测） | API 调用 | ⏳ 重测 |
  | MT-G | MT-03b | 未购课+有推荐人用户扫码可自动更换推荐人 | 真机扫码 | ⏳ 待测 |

  **分组说明**：
  - **MT-E 组**：日签到改造相关验证（MT-25/MT-26 系列）——扫码类需真机，后台类可在 Admin 操作
  - **MT-F 组**：合同/排期流程改造验证（MT-30/MT-53）——纯后台/API 操作，优先做
  - **MT-G 组**：推荐人扫码边界（MT-03b）——需特定账号条件，难度较高

  **建议执行顺序（由易到难）**：

  ```
  第1轮（后台操作，无需真机）
    MT-F 组：MT-53（API 调用取消排期）→ MT-30（后台录入合约）
    MT-E 组：MT-26（二维码覆盖生成）→ MT-26e（后台补签/取消签到）

  第2轮（小程序操作）
    MT-E 组：MT-26f（预约→attend_count+1）→ MT-26g（取消预约→attend_count-1）
    MT-E 组：MT-25（商城兑换续期）

  第3轮（需真机扫码，集中一次完成）
    MT-E 组：MT-26b → MT-26c → MT-26d → MT-26h（日期内扫码/重复/日期外/解冻确认）

  第4轮（需支付或特殊条件）
    MT-B 组：MT-38（兑换密训班赠课）→ MT-39（赠课合同拦截退款）
    MT-G 组：MT-03b（特定账号换推荐人）
  ```

  ---

  ## F16 课程过期处理逻辑（v2.4 新增）

  > **前置**：需一个 contract_signed=1 且 expire_at 已到期（手动写入过去日期）的 user_courses 记录，或执行过 checkExpiredCourses 定时任务后已有 status=3 的记录。

  | 步骤 | 操作类型 | 说明 |
  |---|---|---|
  | S16.1 | ✏️ 写操作 | 购买新课程：验证 user_courses.expire_at=NULL, pending_days=validity_days |
  | | 期望 | `pending_days` = 课程有效天数，`expire_at` = NULL，`contract_signed` = 0 |
  | | 验证 SQL | `SELECT expire_at, pending_days, contract_signed, status FROM tiandao_culture.user_courses WHERE source_order_id=? ORDER BY id DESC LIMIT 1` |
  | S16.2 | ✏️ 写操作 | 签署合同：验证 expire_at/pending_days/contract_end 同步写入 |
  | | 期望 | `expire_at = 签约日+pending_days天 23:59:59`，`pending_days = 0`，`contract_signed = 1` |
  | | 验证 SQL | `SELECT expire_at, pending_days, contract_signed FROM tiandao_culture.user_courses WHERE user_id=? AND course_id=? AND status=1 ORDER BY id DESC LIMIT 1` |
  | | 验证 SQL | `SELECT contract_end FROM tiandao_culture.contract_signatures WHERE user_id=? AND course_id=? AND status=1 ORDER BY id DESC LIMIT 1` |
  | S16.3 | 📖 读操作 | 触发定时任务 checkExpiredCourses（手动调用或人工更新过期记录） |
  | | 期望 | 返回 `expired_courses` 数量 ≥ 0，`expired_contracts` ≥ 0 |
  | S16.4 | 📖 读操作 | 我的课程列表：验证过期课程可见，status=3 标记正确 |
  | | 期望 | 过期课程出现在列表中，`status=3`，标签显示"已过期"，预约按钮置灰 |
  | | 验证 SQL | `SELECT id, status, expire_at, contract_signed FROM tiandao_culture.user_courses WHERE user_id=? AND status=3 LIMIT 5` |
  | S16.5 | ✏️ 写操作 | 尝试预约过期课程（status=3 的排期）→ 应被拦截 |
  | | 期望 | 返回错误："您还未购买该课程或课程已过期" |
  | S16.6 | ✏️ 写操作 | 尝试对未签合同课程预约 → 应提示先签合同 |
  | | 期望 | 返回错误："请先签署学习合同后再预约" |
| S16.7 | ✏️ 写操作 | 退款：验证未签合同课程 pending_days 扣减，status 变为 2 |
| | 期望 | `pending_days` 减少 validity_days，若 ≤ 0 则 `status=2` |
| | 验证 SQL | `SELECT status, pending_days FROM tiandao_culture.user_courses WHERE source_order_id=?` |

---

## F17 表现分与评估名单

> **测试范围**：表现分加分/扣分、评估名单查询、黑名单阈值配置、课程/活动拉黑与解除、拉黑拦截验证、异常参数与重复操作边界测试。

| 步骤 | 类型 | 接口/操作 | 描述 |
|------|------|-----------|------|
| S17.1 | ✏️ 写 | `addPerformanceScore` | 管理端给用户加表现分（选择岗位类型+分值） |
| | 期望 | 返回 `success: true` | 记录ID存在 |
| | 验证 SQL | `SELECT * FROM tiandao_culture.performance_scores WHERE user_id=? ORDER BY id DESC LIMIT 1` | type=1, score>0, position_name 有值 |
| S17.2 | ✏️ 写 | `deductPerformanceScore` | 管理端给用户扣学员分（deductType=2） |
| | 期望 | 返回 `success: true` | 扣分记录 |
| | 验证 SQL | `SELECT * FROM tiandao_culture.performance_scores WHERE user_id=? AND type=2 ORDER BY id DESC LIMIT 1` | score 为负数 |
| S17.3 | ✏️ 写 | `deductPerformanceScore` | 管理端给用户扣活动分（deductType=3） |
| | 期望 | 返回 `success: true` | 扣分记录 |
| | 验证 SQL | `SELECT * FROM tiandao_culture.performance_scores WHERE user_id=? AND type=3 ORDER BY id DESC LIMIT 1` | score 为负数 |
| S17.4 | 📖 读 | `getEvaluationList` | 查询评估名单列表 |
| | 期望 | 返回 `list`, `positionTypes`, `config` | 列表中包含目标用户，各岗位加分和扣分汇总正确 |
| S17.5 | ✏️ 写 | `updateBlacklistConfig` | 更新阈值配置（4个配置项） |
| | 期望 | 返回 `success: true` | |
| | 验证 SQL | `SELECT * FROM tiandao_culture.blacklist_config` | 4条记录值已更新 |
| S17.6 | ✏️ 写 | `setBlacklist` | 拉黑用户课程（blacklistType=1） |
| | 期望 | 返回 `success: true, months` | |
| | 验证 SQL | `SELECT * FROM tiandao_culture.user_blacklist WHERE user_id=? AND blacklist_type=1 AND status=1` | 记录存在，end_time = start_time + months |
| S17.7 | ✏️ 写 | `setBlacklist` | 拉黑用户活动（blacklistType=2） |
| | 期望 | 返回 `success: true, months` | |
| | 验证 SQL | `SELECT * FROM tiandao_culture.user_blacklist WHERE user_id=? AND blacklist_type=2 AND status=1` | 记录存在 |
| S17.8 | ❌ 异常 | `createAppointment` | 被课程拉黑的用户尝试预约课程 |
| | 期望 | 返回错误 | 包含"无法报名复训"文案 |
| S17.9 | ❌ 异常 | `applyForActivity` | 被活动拉黑的用户尝试报名活动 |
| | 期望 | 返回错误 | 包含"无法报名活动"文案 |
| S17.10 | ✏️ 写 | `removeBlacklist` | 解除课程拉黑（blacklistType=1） |
| | 期望 | 返回 `success: true` | |
| | 验证 SQL | `SELECT * FROM tiandao_culture.user_blacklist WHERE user_id=? AND blacklist_type=1` | status=0, released_at 有值 |
| S17.11 | ✏️ 写 | `removeBlacklist` | 解除活动拉黑（blacklistType=2） |
| | 期望 | 返回 `success: true` | |
| S17.12 | ✅ 正向 | `createAppointment` | 解除拉黑后用户可正常预约 |
| | 期望 | 预约成功或报其他非黑名单错误 | |
| S17.13 | ❌ 异常 | `addPerformanceScore` | 缺少必填参数测试 |
| | 期望 | 返回参数错误 | |
| S17.14 | ❌ 异常 | `setBlacklist` | 重复拉黑测试 |
| | 期望 | 返回"已在拉黑状态中" | |

---

## F18 角色权限管理流程

> **测试范围**：超级管理员创建/更新/删除自定义角色、角色列表查询、修改 super_admin 权限拦截、删除系统内置角色拦截、删除有管理员使用的角色拦截、普通管理员权限不足拦截。

| 步骤 | 类型 | Action / 操作 | 描述 | 状态 |
|------|------|---------------|------|------|
| S18.1 | ✏️ 写操作 | `createRole` | 超级管理员创建自定义角色（roleKey=test_role, roleName=测试角色, permissions=["dashboard","user-list"]） | ⏳ 待测 |
| | 期望 | `success` | true |
| | 验证 SQL | `SELECT * FROM tiandao_culture.admin_roles WHERE role_key='test_role'` | 应返回1条记录 |
| S18.2 | 📖 读操作 | `getRoleList` | 获取角色列表 | ⏳ 待测 |
| | 期望 | `list` | 应包含 super_admin、admin、operator 和 test_role |
| S18.3 | ✏️ 写操作 | `updateRole` | 更新测试角色权限（增加 order-list） | ⏳ 待测 |
| | 期望 | `success` | true |
| | 验证 SQL | `SELECT permissions FROM tiandao_culture.admin_roles WHERE role_key='test_role'` | 应包含 dashboard、user-list、order-list |
| S18.4 | ❌ 异常测试 | `updateRole` | 尝试修改 super_admin 的 permissions | ⏳ 待测 |
| | 期望 | `success` | false，返回"超级管理员的权限不可修改" |
| S18.5 | ❌ 异常测试 | `deleteRole` | 尝试删除系统内置角色（admin） | ⏳ 待测 |
| | 期望 | `success` | false，返回"系统内置角色不可删除" |
| S18.6 | ❌ 异常测试 | `deleteRole` | 尝试删除有管理员使用的角色 | ⏳ 待测 |
| | 期望 | `success` | false，返回"该角色下还有N个管理员" |
| S18.7 | ✏️ 写操作 | `deleteRole` | 删除无人使用的自定义角色 test_role | ⏳ 待测 |
| | 期望 | `success` | true |
| | 验证 SQL | `SELECT * FROM tiandao_culture.admin_roles WHERE role_key='test_role'` | 应返回0条记录 |
| S18.8 | ❌ 异常测试 | `createRole`（非超管调用） | 普通管理员尝试创建角色 | ⏳ 待测 |
| | 期望 | `success` | false，返回权限不足 |

---

## F19 商学院板块管理

### 测试目标
验证商学院板块的增删改查、排序、显示/隐藏功能

### 前置条件
- 管理员已登录后台

### 测试步骤

| 步骤 | 类型 | Action/操作 | 描述 |
|---|---|---|---|
| S1 | 📖 读操作 | `getAcademySections` | 小程序端获取板块列表，验证返回 7 条初始数据 |
| | 期望 | list.length | >= 7 |
| S2 | ✏️ 写操作 | `manageAcademySections` operation=list | 后台获取全部板块列表（含隐藏） |
| | 期望 | list.length | >= 7 |
| S3 | ✏️ 写操作 | `manageAcademySections` operation=create | 新增一个 intro 类型板块 |
| | 期望 | 返回新板块 id | > 0 |
| | 验证 SQL | `SELECT COUNT(*) FROM tiandao_culture.academy_sections WHERE section_type='intro'` | >= 2 |
| S4 | ✏️ 写操作 | `manageAcademySections` operation=update | 修改板块标题 |
| | 期望 | 返回成功 | message 包含"更新成功" |
| S5 | ✏️ 写操作 | `manageAcademySections` operation=toggleStatus | 切换板块显示/隐藏 |
| | 期望 | status | 从 1 变 0 或从 0 变 1 |
| S6 | ✏️ 写操作 | `manageAcademySections` operation=updateSort | 批量更新排序 |
| | 期望 | 返回成功 | message 包含"排序更新成功" |
| S7 | ✏️ 写操作 | `manageAcademySections` operation=delete | 删除 S3 创建的板块 |
| | 期望 | 返回成功 | message 包含"删除成功" |
| S8 | 📖 读操作 | `getAcademySections` | 再次获取板块列表，验证被隐藏的板块不出现 |
| | 期望 | 列表中不包含被隐藏的板块 | status=0 的板块不返回 |

## F20 用户课程管理 · 手动新增 · 调整积分修复

### 测试目标
验证后台用户课程列表查询、手动新增用户课程、以及大使调整积分功能

### 前置条件
- 管理员已登录后台
- 数据库中有可用的用户和课程记录

### 测试步骤

| 步骤 | 类型 | Action/操作 | 描述 |
|---|---|---|---|
| S20.1 | 📖 读操作 | `getUserCourseList` | 后台获取用户课程列表，验证分页返回 |
| | 期望 | `list` | 数组，含 user_name、user_phone、course_name、status 字段 |
| S20.2 | 📖 读操作 | `getUserCourseList` keyword | 按用户姓名/手机号搜索，验证筛选结果 |
| | 期望 | 所有结果 user_name 或 user_phone | 包含搜索关键词 |
| S20.3 | 📖 读操作 | `getUserCourseList` status=1 | 按状态筛选，只返回有效课程 |
| | 期望 | 所有结果 status | 均为 1 |
| S20.4 | ✏️ 写操作 | `adminAddUserCourse` | 为用户手动新增课程（validityDays=180，needContract=false） |
| | 期望 | `user_course_id` | > 0 |
| | 期望 | `expire_at` | 约为今天 + 180 天 |
| | 期望 | `signature_id` | null（未创建合同） |
| | 验证 SQL | `SELECT attend_count, contract_signed, status, pending_days FROM tiandao_culture.user_courses WHERE id=?` | attend_count=1, contract_signed=1, status=1, pending_days=0 |
| S20.5 | ✏️ 写操作 | `adminAddUserCourse` 重复 | 再次为同一用户同一课程新增，验证拒绝 |
| | 期望 | 返回错误 | 包含"已拥有此课程" |
| S20.6 | ✏️ 写操作 | `adminAddUserCourse` needContract=true | 为用户新增另一课程并创建合同（需该课程有合同模板） |
| | 期望 | `signature_id` | 不为 null（如有模板） |
| | 验证 SQL | `SELECT sign_type, status FROM tiandao_culture.contract_signatures WHERE id=?` | sign_type=3, status=1 |
| S20.7 | ✏️ 写操作 | `adjustPoints` type=merit | 大使列表调整功德分（修复后），增加 10 分 |
| | 期望 | 返回成功 | message 包含"调整成功" |
| | 验证 SQL | `SELECT merit_points FROM tiandao_culture.users WHERE id=?` | 增加了 10 |
| S20.8 | ✏️ 写操作 | `adjustPoints` type=cash, action=subtract | 大使列表扣除现金积分 5 分 |
| | 期望 | 返回成功 | message 包含"调整成功" |
| | 验证 SQL | `SELECT cash_points_available FROM tiandao_culture.users WHERE id=?` | 减少了 5 |

  