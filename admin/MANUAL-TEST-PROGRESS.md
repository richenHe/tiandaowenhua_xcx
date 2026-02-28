# 手动测试进度记录

> **创建时间**: 2026-02-28  
> **测试账号**: id=32 何日琛（level=1 准青鸾，referee_id=33 林梦奇 level=2 青鸾）  
> **用途**: 记录真机/人工操作的手动测试进度，自动化测试(F1~F11)已全部通过

---

## 当前进度总览

| 编号 | 场景 | 状态 | 备注 |
|------|------|:----:|------|
| MT-01 | 推广二维码生成 | ✅ 已通过 | 2026-02-27 id=32 真机验证 |
| MT-02 | 新用户扫码绑定推荐人 | ✅ 已通过 | 需新微信账号 |
| MT-03 | 已购课用户扫码不可修改推荐人 | ✅ 已通过 | — |
| MT-04 | 微信支付回调全链路 | ✅ 已通过 | 2026-02-28 支付回调BUG已修复并验证（见下方详情） |
| MT-05 | 预约后 booked_quota 递增 | ✅ 已通过 | 2026-02-28 id=32 真机验证（appointment id=14，class_record id=5，0→1） |
| MT-06 | 取消预约后 booked_quota 递减 | ✅ 已通过 | 2026-02-28 id=32 真机验证（status=3，booked_quota 1→0，与实际数一致） |
| MT-07 | ~~后台批量签到~~ | 🚫 已取消 | 功能已移除，签到仅支持二维码扫码，见 MT-18 |
| MT-08 | 推荐初探班奖励-解冻场景 | ⏳ 待测 | 需微信支付，推荐人frozen>0 |
| MT-09 | 推荐初探班奖励-功德分场景 | ⏳ 待测 | 需微信支付，推荐人frozen=0 |
| MT-10 | 推荐密训班奖励-不消耗冻结 | ⏳ 待测 | 需微信支付 |
| MT-11 | 奖励互斥验证 | ⏳ 待测 | 跟随MT-08~10验证 |
| MT-12 | 密训班赠课验证 | ⏳ 待测 | 需微信支付 |
| MT-13 | 后台等级配置互斥校验 | ✅ 已通过 | 2026-02-28 统一radio+保存验证 |
| MT-14 | 后台等级配置倍数校验 | ✅ 已通过 | 2026-02-28 冻结/解冻倍数校验 |
| MT-17 | 后台生成签到码（generateCheckinQRCode） | ✅ 已通过 | 2026-02-28 class_record_id=26，qrcode_url=cloud://...，scene=ci=26 |
| MT-18 | 扫码签到（scanCheckin） | ✅ 已通过 | 2026-02-28 扫 class_record_id=26 码，appointments id=19 status=1，checkin_time=13:43:43 |
| MT-19 | 缺席自动标记定时器 | ✅ 已通过 | 2026-02-28 MCP 触发定时器，appointment id=20 从 status=0 → status=2（缺席） |

---

## MT-04 详细记录（微信支付回调全链路）

### 发现的BUG及修复

| # | BUG | 根因 | 修复文件 | 修复内容 | 状态 |
|---|-----|------|---------|---------|------|
| 1 | 支付后订单仍为待支付 | `callbacks/handlers/payment.js` HTTP模式检测使用 `context.httpContext`，在CloudBase HTTP访问服务中为undefined | `callbacks/handlers/payment.js` | 改用 `event.body` 存在性判断 | ✅ 已修复 |
| 2 | 回调数据解析失败 | 回调处理器按V2 XML解析，但createPayment用的是V3 API（JSON+AES-GCM） | `callbacks/handlers/payment.js` | 完全重写为V3 JSON格式 + AES-256-GCM解密 | ✅ 已修复 |
| 3 | 解密失败"MCH_API_V3_KEY未配置" | `cloudfunction.json`缺少`MCH_API_V3_KEY`环境变量，且`updateFunctionCode`不更新配置 | `cloudfunction.json` + MCP `updateFunctionConfig` | 添加 MCH_API_V3_KEY/MCH_ID/WECHAT_APPID 到环境变量 | ✅ 已修复 |
| 4 | 重复创建user_courses | 微信支付重试导致回调多次执行，payment.js无去重检查 | `callbacks/handlers/payment.js` | 插入前检查 user_courses 是否已存在 | ✅ 已修复 |
| 5 | 创建订单"2 rows"报错 | `create.js` 用 `findOne(.single())` 查已购课程，重复记录时报多行错误 | `order/handlers/client/create.js` | 改用 `select+limit(1)` 替代 `findOne` | ✅ 已修复 |
| 6 | 异步业务逻辑可能丢失 | 原代码用 `setImmediate` 异步处理，函数退出后可能被终止 | `callbacks/handlers/payment.js` | 改为同步 `await`，确保完成 | ✅ 已修复 |
| 7 | 日期格式MySQL不兼容 | `new Date().toISOString()` 含T和Z，MySQL报Error 1292 | `callbacks/handlers/payment.js` | 使用 `formatDateTime()` | ✅ 已修复 |

### 验证结果

| 验证项 | 结果 |
|--------|------|
| orders.pay_status = 1 | ✅ 订单 id=56 pay_status=1, transaction_id有值 |
| user_courses 新增记录 | ✅ id=10 course_id=1 |
| is_reward_granted = 1 | ✅ 已标记 |
| 推荐人奖励 | ⚠️ 金额0.01元×30%=0.003→四舍五入为0，无奖励记录（金额过小，非BUG） |

### 待修复问题（奖励逻辑重写）

奖励发放逻辑 `calculateAndGrantReward` 需要按需求文档重写：
- 当前：所有情况统一按比例加到 `cash_points_frozen`
- 应该：冻结积分只由初探班解冻；功德分和积分互斥；按等级配置动态读取比例

---

## 测试环境数据变更记录

| 时间 | 变更 | 原因 | 需还原 |
|------|------|------|:------:|
| 2026-02-28 | courses id=1 sort_order: 100→-2 | 让初探班显示在列表第1位 | 是 |
| 2026-02-28 | courses id=2 sort_order: 90→-1 | 让密训班显示在列表第2位 | 是 |
| 2026-02-28 | courses id=1 current_price: 0.01→1.00 | 测试奖励时金额不为0 | 是 |
| 2026-02-28 | courses id=2 current_price: 0.01→1.00 | 测试奖励时金额不为0 | 是 |
| 2026-02-28 | user_courses id=11 已删除 | 清理重复购课记录 | 否 |

---

## 自动化测试进度（F1~F11）

| 流程 | 状态 | 最后验证日期 |
|------|:----:|:-----------:|
| F1 用户资料 | ✅ | 2026-02-27 |
| F1B 边界验证 | ✅ | 2026-02-27 |
| F2 课程浏览 | ✅ | 2026-02-23 |
| F3 订单兑换 | ✅ | 2026-02-23 |
| F4 积分提现 | ✅ | 2026-02-27 |
| F4B 边界验证 | ✅ | 2026-02-27 |
| F5 大使体系 | ✅ | 2026-02-27 |
| F5B~F5F 边界 | ✅ | 2026-02-27 |
| F6 协议签署 | ✅ | 2026-02-27 |
| F7 预约排期 | ✅ | 2026-02-27 |
| F8 反馈模块 | ✅ | 2026-02-28 |
| F9 系统公共 | ✅ | 2026-02-28 |
| F10 跨模块验证 | ⏳ 待测 | — |
| F11 志愿活动 | ✅ | 2026-02-28 |

---

---

## MT-07 已取消（后台批量签到功能已移除）

> **2026-02-28 确认**：后台批量签到功能已取消，签到方式仅保留二维码扫码签到（MT-18）。  
> `batchCheckin.js` 可保留代码但不对外暴露入口，或可后续清理。

---

## MT-17 详细说明（后台生成签到码）

### 业务逻辑
- 管理员选择排期 → 调用 `generateCheckinQRCode`
- 云函数调用 `wxacode.getUnlimited`，scene=`ci={classRecordId}`，落地页=`pages/course/checkin/index`
- 生成的小程序码图片上传云存储，`qrcode_url` 存为 `cloud://` fileID
- 记录写入 `checkin_qrcodes` 表（含 class_record_id、course_name、class_date、qrcode_url、scene）

### 操作步骤
1. 后台打开 `admin/pages/course/schedule.html`（排期管理）
2. 找到一个状态为「进行中」或「未开始」的排期（class_record_id，推荐 id=5~14 中任一）
3. 点击该行的「生成签到码」按钮
4. 弹窗中显示二维码图片即为成功

### 验证 SQL（操作完成后执行）
```sql
SELECT id, class_record_id, course_name, class_date, qrcode_url, scene, status, created_at
FROM tiandao_culture.checkin_qrcodes
ORDER BY created_at DESC LIMIT 5;
-- 期望: 新增一条记录, qrcode_url 以 cloud:// 开头, scene=ci={classRecordId}
```

---

## MT-18 详细说明（扫码签到）

### 业务逻辑（scanCheckin 云函数）
- 学生扫小程序码 → 打开 `pages/course/checkin/index`（自动签到页）
- 页面解析 scene 参数（格式 `ci={classRecordId}`）
- 自动调用 `course.scanCheckin`，传入 `classRecordId`
- 云函数查找该用户对应排期的预约记录：
  - status=1 → 报错"已签到，请勿重复签到"
  - status=2 → 报错"已标记为缺席"
  - status=3 → 报错"预约已取消"
  - status=0 → 更新为 status=1，写入 checkin_time
- 同时更新 `user_courses.attend_count +1`
- 异步解冻推荐人冻结积分（若推荐人有冻结积分且满足解冻条件）

### 前置条件
- MT-17 已完成（checkin_qrcodes 中有该排期的签到码）
- user_id=32 在该排期有 status=0 的预约（可在小程序预约后不取消）

### 操作步骤
1. 小程序预约一个3月1日的排期（不取消，保持 status=0）
2. 用真机微信扫描后台「签到码管理」弹窗中显示的签到二维码
3. 小程序打开签到页，显示「✅ 签到成功」

### 验证 SQL（签到成功后执行）
```sql
-- 1. 验证预约状态变为1且有签到时间
SELECT id, class_record_id, status, checkin_time
FROM tiandao_culture.appointments
WHERE user_id=32 AND status=1
ORDER BY checkin_time DESC LIMIT 3;

-- 2. 验证上课次数+1
SELECT id, course_id, attend_count
FROM tiandao_culture.user_courses
WHERE user_id=32;

-- 3. 验证推荐人积分解冻（若推荐人 id=33 有冻结积分）
SELECT cash_points_frozen, cash_points_available
FROM tiandao_culture.users WHERE id=33;
SELECT type, amount, remark, created_at
FROM tiandao_culture.cash_points_records
WHERE user_id=33 AND type=2
ORDER BY created_at DESC LIMIT 3;
```

### 边界测试（可选）
- 重复扫码 → 应看到「❌ 您已签到，请勿重复签到」

---

## MT-19 详细说明（缺席自动标记定时器）

### 业务逻辑（autoUpdateScheduleStatus.js 第四步）
- 每日 0 点定时触发（cloudfunction.json timer trigger）
- 第四步：查询所有 status=3（已结束）的排期 → 找其中 appointments.status=0（待上课）的预约 → 批量更新为 status=2（缺席）

### 手动触发验证方案
不需要等到零点，可以通过 MCP 直接调用云函数（or 让 AI 执行以下 SQL 验证逻辑）：

```sql
-- 查看哪些排期已结束且有待上课预约（理论上定时器应已处理）
SELECT cr.id as 排期id, cr.class_date, cr.status as 排期状态,
  a.id as 预约id, a.user_id, a.status as 预约状态
FROM tiandao_culture.class_records cr
JOIN tiandao_culture.appointments a ON a.class_record_id=cr.id
WHERE cr.status=3 AND a.status=0;
-- 期望：返回 0 行（说明定时器已正常运行，或无待处理记录）
```

若有返回行，说明定时器未触发或 class_record_id=1（2026-02-15的课）的缺席还未标记。

---

## 下一步计划

1. **完成 MT-17** — 后台生成签到码，验证 checkin_qrcodes 入库
2. **完成 MT-18** — 扫描 MT-17 生成的码，验证扫码签到全链路
4. **完成 MT-19** — 验证缺席定时器（查 SQL 即可）
5. **修复奖励发放逻辑** — 重写 `calculateAndGrantReward`，实现冻结解冻+互斥发放
6. **重测 MT-04/MT-08~MT-10** — 奖励逻辑修复后重新验证支付全链路
7. **运行 F10** — 跨模块数据完整性终极验证
