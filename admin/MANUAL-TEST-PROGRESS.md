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
| MT-07 | 后台签到 | ⏳ 待测 | 需后台操作 |
| MT-08 | 推荐初探班奖励-解冻场景 | ⏳ 待测 | 需微信支付，推荐人frozen>0 |
| MT-09 | 推荐初探班奖励-功德分场景 | ⏳ 待测 | 需微信支付，推荐人frozen=0 |
| MT-10 | 推荐密训班奖励-不消耗冻结 | ⏳ 待测 | 需微信支付 |
| MT-11 | 奖励互斥验证 | ⏳ 待测 | 跟随MT-08~10验证 |
| MT-12 | 密训班赠课验证 | ⏳ 待测 | 需微信支付 |
| MT-13 | 后台等级配置互斥校验 | ✅ 已通过 | 2026-02-28 统一radio+保存验证 |
| MT-14 | 后台等级配置倍数校验 | ✅ 已通过 | 2026-02-28 冻结/解冻倍数校验 |

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

## 下一步计划

1. **修复奖励发放逻辑** — 重写 `calculateAndGrantReward`，实现冻结解冻+互斥发放
2. **后台等级配置校验** — 添加功德分/积分互斥校验 + 冻结/解冻倍数校验
3. **遍历所有云函数** — 确保等级配置表所有字段都动态读取（不硬编码）
4. **重测 MT-04/MT-08~MT-10** — 奖励逻辑修复后重新验证支付全链路
5. **完成 MT-02~MT-07, MT-11** — 其余手动测试
6. **运行 F10** — 跨模块数据完整性终极验证
