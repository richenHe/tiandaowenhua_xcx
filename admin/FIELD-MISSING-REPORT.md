# 前端页面字段返回缺失清单

> 检查时间：2026-02-28（第一轮 API 字段检查） + 2026-02-28（第二轮全按钮点击测试）  
> 检查账号：herichen（super_admin）  
> 检查工具：Playwright 自动化浏览器 + CloudBase API 直连验证  
> 检查范围：后台所有页面 + 全部操作按钮逐一点击验证

---

## 一、严重问题：后端 API 字段缺失 / 逻辑错误

### 1. 订单列表 `pages/order/list.html`

| 问题 | 详情 | 影响 |
|------|------|------|
| `payment_method` 字段**未返回** | `getOrderList` 云函数 `list` 映射中没有 `payment_method: order.payment_method` | 支付方式列**全部空白** |
| `pay_status` 映射错误 | 云函数 `formatPayStatus` 映射不完整：`2→已退款`（应为**已取消**）、`3→未知`（应为**已关闭**）、`4` 未映射（应为**已退款**） | 大量订单显示"**未知**"状态 |
| `id` 字段未返回 | `list` 映射中没有 `id: order.id` | 详情查询依赖 `order_no`，功能受限 |

**云函数文件：** `cloudfunctions/order/handlers/admin/getOrderList.js`

**修复方案：**
```js
// getOrderList.js 第 63-69 行 formatPayStatus 修改为：
const formatPayStatus = (status) => {
  const map = { 0: '未支付', 1: '已支付', 2: '已取消', 3: '已关闭', 4: '已退款' };
  return map[status] ?? '未知';
};

// 第 72 行 list 映射中增加：
id: order.id,
payment_method: order.payment_method || '',
```

---

## 二、前端渲染问题：TDesign Table Slot 不渲染

**根本原因：** TDesign Vue 表格组件在 `colKey` 使用 **camelCase**（如 `ambassadorLevel`）时，`<template #ambassadorLevel>` slot 无法正常渲染内容，导致对应列全部空白。数据本身由 API 正常返回，但前端无法显示。

### 受影响页面和列

| 页面 | 文件路径 | 空白列 | API 是否返回 |
|------|---------|--------|-------------|
| 学员列表 | `pages/user/list.html` | 大使等级、功德积分、现金积分、注册时间 | ✅ 均已返回 |
| 大使列表 | `pages/ambassador/list.html` | 大使等级、功德积分、现金积分 | ✅ 均已返回 |
| 合约管理 | `pages/ambassador/contract.html` | 大使等级 | ✅ 已返回（`contract_level`） |

**修复方案（以学员列表为例）：**

将 `colKey` 改为 snake_case，或改用 `cell` 渲染函数：

```js
// 方案 A：colKey 改为 snake_case
{ colKey: 'ambassador_level', title: '大使等级', width: 120 },
// 同步修改 slot 名：<template #ambassador_level="{ row }">

// 方案 B：直接在 columns 中用 cell 函数渲染，不依赖 slot
{
  colKey: 'ambassador_level',
  title: '大使等级',
  width: 120,
  cell: (h, { row }) => {
    const map = { 0: '普通用户', 1: '准青鸾大使', 2: '青鸾大使', 3: '鸿鹄大使' };
    return h('span', map[row.ambassador_level] ?? '-');
  }
}
```

---

## 三、API 字段返回完整性核查

### ✅ 正常页面（字段返回完整）

| 页面 | 接口 action | 返回字段 | 状态 |
|------|------------|---------|------|
| 用户详情弹窗 | `getUserDetail` | 姓名、手机、性别、城市、大使等级、功德积分、现金积分、推荐人、注册时间 | ✅ 正常 |
| 排期管理 | `getClassRecordList` | id、课程名、上课日期、结课日期、时段、地点、预约数、总名额、状态 | ✅ 正常 |
| 预约管理 | `getAppointmentList` | id、预约单号、用户名、手机、课程名、排期、状态、签到码、创建时间 | ✅ 正常 |
| 兑换管理 | `getExchangeList` | 兑换单号、用户名、手机、商品名、数量、功德分/积分消耗、状态、时间 | ✅ 正常 |
| 提现审核 | `getWithdrawList` | 提现单号、金额、账户信息、状态、申请时间、审核时间 | ✅ 正常 |
| 大使列表 | `getAmbassadorList` | id、姓名、手机、大使等级、功德积分、现金积分（渲染有bug但数据正常）| ✅ 字段正常 |
| 申请审核 | `getApplicationList` | 用户信息、申请等级、理由、状态、时间 | ✅ 正常 |
| 活动管理 | `getActivityList` | id、用户名、活动名、类型、日期、地点、参与人数、积分、状态 | ✅ 正常 |
| 合约管理 | `getSignatureList` | 大使名、手机、合约等级、合约名、签署时间、到期时间、状态 | ✅ 字段正常 |
| 管理员管理 | `getAdminUserList` | id、用户名、姓名、角色、状态、最后登录时间 | ✅ 正常 |
| 公告管理 | `getAnnouncementList` | 标题、分类、内容摘要、置顶、状态、排序、时间 | ✅ 正常 |
| 反馈管理 | `getFeedbackList` | 用户信息、类型、内容、图片、回复、状态 | ✅ 正常 |
| 轮播图管理 | `getBannerList` | id、标题、副标题、图片、链接、排序 | ✅ 正常 |
| 商城商品 | `getMallGoodsList` | 商品名、图片、价格、库存、销量、状态 | ✅ 正常 |
| 等级配置 | `getAmbassadorLevelConfigs` | 等级、名称、描述、费用、冻结积分、解冻额度、功德率、现金率 | ✅ 正常 |
| 通知配置 | `getNotificationConfigList` | 配置码、名称、内容模板 | ✅ 正常 |

---

## 四、按钮点击测试新发现问题

### 1. 订单列表 - 操作按钮问题

| 按钮 | 问题 | 严重程度 |
|------|------|---------|
| **查看详情** | 弹窗中"订单类型"显示原始数字（如 `3`），未格式化为"升级订单/课程订单" | P1 |
| **查看详情** | 弹窗中"支付方式"显示原始值（如 `wechat`），未格式化为"微信支付" | P1 |
| **查看详情** | 弹窗中"更新时间"为空（`getOrderDetail` 未返回 `updated_at`） | P2 |
| **确认支付** | 提示"**手动确认支付功能暂未上线**，请通过支付回调自动处理" | P1 功能缺失 |
| **取消订单** | 提示"**取消订单功能暂未上线**，如需处理请直接联系技术团队" | P1 功能缺失 |
| **发起退款** | 无确认/输入弹窗，直接调用接口，报错：`退款申请失败: 退款失败`（接口返回 `success:false`）| P0 功能异常 |

**文件：** `pages/order/list.html`  
**修复建议：** 
- 订单类型/支付方式需在前端 `getOrderDetail` 回调中做枚举映射（type: `{1:'课程订单',2:'商城订单',3:'升级订单'}`）
- 退款按钮需添加确认弹窗（含退款金额、原因输入），并排查 `refund` 接口报错原因

---

### 2. 提现审核 - 字段显示问题

| 问题 | 详情 | 严重程度 |
|------|------|---------|
| **收款银行列**显示数字 ID | 列表和详情弹窗中"开户行"均显示数字（如 `12`），而非银行名称 | P1 |
| **大使等级列**空白 | TDesign slot 渲染问题（同第二节） | P1 |

**文件：** `pages/order/withdraw-audit.html`  
**根因：** `bank_name` 字段存储的是银行 ID（数字），需要在前端维护银行 ID→名称映射表，或在 `getWithdrawList` 云函数中关联 `bank_cards` 表返回 `bank_name` 文本。

---

### 3. 申请审核 - 列表字段问题

| 问题 | 详情 | 严重程度 |
|------|------|---------|
| **当前等级**列显示数字 | 显示 `0`/`1`（应显示"普通用户"/"准青鸾大使"） | P1 |
| **目标等级**列全部空白 | `getApplicationList` 返回数据中 `target_level` 字段前端 slot 未渲染 | P1 |

**文件：** `pages/ambassador/application-audit.html`  
**说明：** 详情弹窗中"申请等级"正常显示"准青鸾大使"，问题在列表的 slot 渲染。

---

### 4. 反馈管理 - 多处问题

| 问题 | 详情 | 严重程度 |
|------|------|---------|
| **用户姓名列**全部空白 | 列表中用户姓名列无内容；详情弹窗能显示说明 API 已返回 | P1 |
| **手机号列**全部空白 | 同上，slot 渲染问题 | P1 |
| **回复功能缺失** | 详情弹窗中没有回复输入框，状态下拉菜单与弹窗分离，UX 不完整 | P1 |

**文件：** `pages/system/feedback.html`

---

### 5. 轮播图管理 - 字段问题

| 问题 | 详情 | 严重程度 |
|------|------|---------|
| **排序列**全部空白 | `getBannerList` 返回 `sort_order` 字段但列表无法显示 | P1 |
| **展示时间列**全部空白 | 新增/编辑弹窗也没有该字段入口，功能未实现 | P2 |
| **cloud:// 图片未转换** | 有一条数据的图片 URL 为 `cloud://test.jpg`，未转换为 CDN URL，图片加载失败 | P1 |

**文件：** `pages/system/banner.html`  
**修复：** 修复 `sort_order` slot 渲染；`cloud://test.jpg` 需修正数据或确保 `cloudFileIDToURL` 在 banner 数据处理中被调用。

---

### 6. 排期管理 - 生成签到码失败

| 问题 | 详情 | 严重程度 |
|------|------|---------|
| **生成签到码**按钮报错 | 点击后提示"生成签到码失败"，云函数 `generateCheckinQRCode` 返回失败 | P1 |

**文件：** `pages/course/schedule.html`  
**排查建议：** 查看 `generateCheckinQRCode` 云函数日志，可能是小程序 wxacode 接口未配置或权限不足。

---

### 7. 全局 Vue 警告

所有使用 TDesign Table 的页面均出现：
```
[Vue warn]: Missing required prop: "rowKey"
```
需在所有 `<t-table>` 组件上添加 `:row-key="(row) => row.id"` 属性。

---

### ✅ 按钮功能正常

| 页面 | 正常按钮 |
|------|---------|
| 学员列表 | 新增学员、修改推荐人（弹窗正常） |
| 大使列表 | 调整积分（弹窗正常）、升级（提示已最高等级）、详情 |
| 申请审核 | 详情（弹窗正常）、驳回（弹窗正常）、通过 |
| 提现审核 | 查看详情（弹窗正常） |
| 课程列表 | 新增课程、编辑（弹窗均正常） |
| 排期管理 | 新增排期、编辑（弹窗均正常）、签到码管理（弹窗正常） |
| 公告管理 | 发布公告、编辑（弹窗均正常，数据回填正常） |
| 活动管理 | 详情（弹窗正常）、报名人员 |
| 合约管理 | 详情（弹窗正常）、版本历史、续签 |

---

## 五、Dashboard 统计数据异常

**现象：** 首页统计卡（总用户数、总订单数、总预约数、大使数）全部显示 `"0"`

**API：** `system` → `getStatistics`

**需排查：** 是否 `getStatistics` 接口未统计 `tiandao_culture` 业务库数据，或 SQL 查询有误。

---

## 六、通知日志无数据

**现象：** `pages/system/notification.html` → 通知日志 Tab 共 0 条数据

**API：** `getNotificationLogs`  
**状态：** 接口正常，但数据库中暂无发送记录（可接受，非 bug）

---

## 七、字段缺失汇总（按优先级）

### P0 - 阻断性问题（导致功能失效）

| # | 页面 | 问题 | 问题类型 | 影响描述 |
|---|------|------|---------|---------|
| 1 | 订单列表 | `payment_method` 未返回 | 后端未返回 | 支付方式列完全空白 |
| 2 | 订单列表 | `pay_status` 枚举映射错误 | 后端逻辑错误 | 大量订单显示"未知"（2=已取消，3=已关闭，4=已退款均未正确映射） |
| 3 | 订单列表 | **发起退款**按钮直接报错 | 接口异常+无确认弹窗 | 退款功能完全不可用 |
| 4 | 订单列表 | **确认支付**功能未上线 | 功能缺失 | 无法手动确认支付 |
| 5 | 订单列表 | **取消订单**功能未上线 | 功能缺失 | 无法手动取消订单 |

### P1 - 严重问题（数据不可见或关键弹窗显示错误）

| # | 页面 | 空白/错误字段 | 问题类型 | 影响描述 |
|---|------|--------------|---------|---------|
| 6 | 学员列表 | 大使等级、功德积分、现金积分、注册时间 | 前端 TDesign slot bug | API 返回正常但 4 列全部空白 |
| 7 | 大使列表 | 大使等级、功德积分、现金积分 | 前端 TDesign slot bug | API 返回正常但 3 列全部空白 |
| 8 | 合约管理 | 大使等级 | 前端 TDesign slot bug | API 返回正常但空白 |
| 9 | 提现审核 | 收款银行显示数字 ID（如 `12`）| 枚举未转换 | 无法识别银行 |
| 10 | 提现审核 | 大使等级 | 前端 TDesign slot bug | 同上 |
| 11 | 申请审核 | 当前等级显示数字、目标等级空白 | 枚举未转换 + slot bug | 无法识别等级信息 |
| 12 | 反馈管理 | 用户姓名、手机号列全部空白 | 前端 TDesign slot bug | API 返回正常但不显示 |
| 13 | 反馈管理 | 详情弹窗无回复功能 | 功能缺失 | 无法在后台回复用户反馈 |
| 14 | 轮播图管理 | 排序列空白 | 前端 slot bug | `sort_order` 不显示 |
| 15 | 轮播图管理 | cloud:// 图片未转换 | CDN 转换遗漏 | 有图片加载失败 |
| 16 | 排期管理 | **生成签到码**报错 | 接口异常 | 签到码功能不可用 |
| 17 | 订单详情 | 订单类型显示数字、支付方式显示原始值 | 枚举未格式化 | 详情弹窗信息不可读 |
| 18 | 订单详情 | 更新时间空白 | `getOrderDetail` 未返回 `updated_at` | 缺少时间信息 |

### P2 - 一般问题

| # | 页面 | 问题 | 问题类型 | 影响描述 |
|---|------|-----|---------|---------|
| 19 | 订单列表 | `id` 未返回 | 后端未返回 | 只能用 `order_no` 查询 |
| 20 | 轮播图管理 | 展示时间列空白（字段未实现） | 功能未完成 | 无法配置展示时间 |
| 21 | Dashboard | 统计数据全 0 | 待排查 | 首页无法看到有效概览数据 |
| 22 | 全局 | `Missing required prop: "rowKey"` Vue 警告 | TDesign Table 配置 | 需为所有 `<t-table>` 添加 `:row-key` |

---

## 八、检查覆盖的所有页面及按钮列表

| # | 页面 | 路径 | 列表数据 | 按钮点击 |
|---|------|------|---------|---------|
| 1 | 登录页 | `index.html` | ✅ | ✅ |
| 2 | 数据概览 | `dashboard.html` | ⚠️ 统计全0 | — |
| 3 | 学员列表 | `pages/user/list.html` | ❌ 4列空白 | ✅ 新增/修改推荐人正常 |
| 4 | 推荐关系查询 | `pages/user/referee.html` | ✅ | ✅ |
| 5 | 推荐人变更记录 | `pages/user/referee-logs.html` | ✅ | — |
| 6 | 订单列表 | `pages/order/list.html` | ❌ 支付方式空白/状态错误 | ❌ 退款报错；确认支付/取消订单未上线；详情类型/支付方式未格式化 |
| 7 | 退款管理 | `pages/order/refund.html` | ✅（无数据） | — |
| 8 | 提现审核 | `pages/order/withdraw-audit.html` | ❌ 银行名显数字/大使等级空白 | ✅ 查看详情正常（但银行名仍显数字） |
| 9 | 商城商品 | `pages/order/mall-goods.html` | ✅ | ✅ |
| 10 | 兑换管理 | `pages/order/exchange-records.html` | ✅ | ✅ |
| 11 | 课程列表 | `pages/course/list.html` | ✅ | ✅ 新增/编辑/上下架正常 |
| 12 | 排期管理 | `pages/course/schedule.html` | ✅ | ⚠️ 编辑/签到码管理正常；**生成签到码报错** |
| 13 | 预约管理 | `pages/course/appointment.html` | ✅ | ✅ |
| 14 | 案例管理 | `pages/course/case.html` | ✅ | ✅ |
| 15 | 素材管理 | `pages/course/material.html` | ✅ | ✅ |
| 16 | 大使列表 | `pages/ambassador/list.html` | ❌ 3列空白 | ✅ 调整积分/升级/详情正常 |
| 17 | 申请审核 | `pages/ambassador/application-audit.html` | ❌ 当前等级显数字/目标等级空白 | ✅ 详情/通过/驳回正常 |
| 18 | 活动管理 | `pages/ambassador/activity.html` | ✅ | ✅ 详情/报名人员正常 |
| 19 | 合约管理 | `pages/ambassador/contract.html` | ❌ 大使等级空白 | ✅ 详情/续签/终止正常 |
| 20 | 管理员管理 | `pages/system/admin.html` | ✅ | ✅ |
| 21 | 系统配置 | `pages/system/config.html` | ✅ | ✅ |
| 22 | 轮播图管理 | `pages/system/banner.html` | ❌ 排序空白/展示时间空白/cloud://图片未转换 | ✅ 新增/编辑/启用禁用正常 |
| 23 | 公告管理 | `pages/system/announcement.html` | ✅ | ✅ 发布/编辑/显隐/删除全部正常 |
| 24 | 反馈管理 | `pages/system/feedback.html` | ❌ 用户姓名/手机号空白 | ⚠️ 查看弹窗正常但**无回复功能**；标记已处理正常 |
| 25 | 通知管理 | `pages/system/notification.html` | ✅（无记录） | ✅ |
| 26 | 等级配置 | `pages/system/level-config.html` | ✅ | ✅ |
