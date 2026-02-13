# 天道文化后台管理 - 页面开发清单

> **更新日期**: 2026-02-12  
> **总页面数**: 19 个  
> **总接口数**: 64 个  
> **已完成**: 1 页（用户列表示例）

---

## 📊 开发进度

| 模块 | 页面数 | 接口数 | 进度 |
|------|-------|-------|------|
| 用户管理 | 2 | 4 | 🔵 50% (1/2) |
| 订单管理 | 3 | 4 | ⚪ 0% (0/3) |
| 课程管理 | 5 | 20 | ⚪ 0% (0/5) |
| 大使管理 | 4 | 15 | ⚪ 0% (0/4) |
| 系统管理 | 6 | 21 | ⚪ 0% (0/6) |
| **合计** | **19** | **64** | **🔵 5%** |

---

## ✅ 已完成页面 (1个)

### 👥 用户管理模块

- [x] **学员列表** (`pages/user/list.html`)
  - ✅ getUserList - 获取学员列表
  - ✅ getUserDetail - 查看学员详情
  - ✅ updateUserReferee - 修改推荐人
  - ✅ 搜索筛选（关键词、大使等级）
  - ✅ 分页功能
  - ✅ 详情对话框
  - ✅ 推荐人修改对话框
  - ✅ 统一样式和交互

---

## 📋 待开发页面 (18个)

### 👥 用户管理模块 (1个)

- [ ] **推荐人管理** (`pages/user/referee.html`)
  - getRefereeChangeLogs - 推荐人变更记录列表
  - 功能：查看历史变更记录、按用户筛选
  - 参考：`pages/user/list.html`

---

### 📦 订单管理模块 (3个)

- [ ] **订单列表** (`pages/order/list.html`)
  - getOrderList - 获取订单列表
  - getOrderDetail - 查看订单详情
  - 功能：搜索、筛选（支付状态、类型）、查看详情

- [ ] **退款管理** (`pages/order/refund.html`)
  - getOrderList（筛选待退款）
  - refund - 执行退款
  - 功能：待退款订单列表、填写退款金额和原因

- [ ] **提现审核** (`pages/order/withdraw.html`)
  - withdrawAudit - 审核提现
  - 功能：待审核列表、通过/拒绝操作

---

### 📚 课程管理模块 (5个)

- [ ] **课程列表** (`pages/course/list.html`)
  - getCourseList - 获取课程列表
  - createCourse - 创建课程
  - updateCourse - 更新课程
  - deleteCourse - 删除课程
  - 功能：CRUD 完整操作、课程类型筛选

- [ ] **排期管理** (`pages/course/schedule.html`)
  - getClassRecordList - 获取排期列表
  - createClassRecord - 创建排期
  - updateClassRecord - 更新排期
  - deleteClassRecord - 删除排期
  - 功能：按课程筛选、按日期筛选、CRUD

- [ ] **预约管理** (`pages/course/appointment.html`)
  - getAppointmentList - 获取预约列表
  - updateAppointmentStatus - 更新预约状态
  - batchCheckin - 批量签到
  - 功能：状态筛选、批量选择签到、取消预约

- [ ] **案例管理** (`pages/course/case.html`)
  - getCaseList - 获取案例列表
  - createCase - 创建案例
  - updateCase - 更新案例
  - deleteCase - 删除案例
  - 功能：案例 CRUD、图片上传

- [ ] **资料管理** (`pages/course/material.html`)
  - getMaterialList - 获取资料列表
  - createMaterial - 创建资料
  - updateMaterial - 更新资料
  - deleteMaterial - 删除资料
  - 功能：资料 CRUD、文件上传

---

### 🎖️ 大使管理模块 (4个)

- [ ] **大使列表** (`pages/ambassador/list.html`)
  - getAmbassadorList - 获取大使列表
  - getAmbassadorDetail - 查看大使详情
  - 功能：按等级筛选、查看详情（包含业绩统计）

- [ ] **申请审核** (`pages/ambassador/application.html`)
  - getApplicationList - 获取申请列表
  - auditApplication - 审核申请
  - 功能：待审核列表、通过/拒绝（填写原因）

- [ ] **活动管理** (`pages/ambassador/activity.html`)
  - getActivityList - 获取活动列表
  - createActivity - 创建活动
  - updateActivity - 更新活动
  - deleteActivity - 删除活动
  - 功能：活动 CRUD、状态管理

- [ ] **合约管理** (`pages/ambassador/contract.html`)
  - getContractTemplateList - 获取合约模板列表
  - createContractTemplate - 创建合约模板
  - updateContractTemplate - 更新合约模板
  - deleteContractTemplate - 删除合约模板
  - getSignatureList - 获取签约列表
  - getContractVersions - 获取合约版本
  - getExpiringContracts - 获取即将到期合约
  - 功能：模板管理、签约记录、到期提醒

---

### ⚙️ 系统管理模块 (6个)

- [ ] **管理员管理** (`pages/system/admin.html`)
  - getAdminUserList - 获取管理员列表
  - createAdminUser - 创建管理员
  - updateAdminUser - 更新管理员
  - deleteAdminUser - 删除管理员
  - 功能：管理员 CRUD、角色分配

- [ ] **系统配置** (`pages/system/config.html`)
  - getConfig - 获取系统配置
  - updateConfig - 更新系统配置
  - 功能：配置项列表、编辑配置

- [ ] **公告管理** (`pages/system/announcement.html`)
  - getAnnouncementList - 获取公告列表
  - createAnnouncement - 创建公告
  - updateAnnouncement - 更新公告
  - deleteAnnouncement - 删除公告
  - 功能：公告 CRUD、发布/下线

- [ ] **反馈管理** (`pages/system/feedback.html`)
  - getFeedbackList - 获取反馈列表
  - replyFeedback - 回复反馈
  - 功能：反馈列表、查看详情、回复

- [ ] **通知管理** (`pages/system/notification.html`)
  - getNotificationConfigList - 获取通知配置列表
  - createNotificationConfig - 创建通知配置
  - updateNotificationConfig - 更新通知配置
  - getNotificationLogs - 获取通知日志
  - sendNotification - 发送通知
  - 功能：配置管理、发送记录、手动发送

- [ ] **等级配置** (`pages/system/level.html`)
  - getAmbassadorLevelConfigs - 获取等级配置
  - initAmbassadorLevelConfigs - 初始化等级配置
  - updateAmbassadorLevelConfig - 更新等级配置
  - 功能：等级列表、编辑权益和佣金

---

## 🎨 统一设计规范

### 页面结构

所有页面统一采用以下结构（参考 `pages/user/list.html`）：

```html
<!DOCTYPE html>
<html>
<head>
  <title>页面标题 - 天道文化后台</title>
  <link rel="stylesheet" href="../../assets/libs/tdesign.min.css">
  <link rel="stylesheet" href="../../assets/css/tokens.css">
  <style>
    /* 统一样式 */
    body { background: #f5f5f5; padding: 24px; }
    .page-header { margin-bottom: 24px; ... }
    .search-form { background: white; padding: 24px; ... }
    .table-card { background: white; padding: 24px; ... }
  </style>
</head>
<body>
  <div id="app">
    <!-- 1. 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">页面标题</h1>
      <t-button @click="goBack">返回</t-button>
    </div>
    
    <!-- 2. 搜索表单（可选）-->
    <div class="search-form">
      <t-form layout="inline">
        <!-- 搜索字段 -->
      </t-form>
    </div>
    
    <!-- 3. 主要内容（表格/表单/卡片）-->
    <div class="table-card">
      <t-table ...></t-table>
    </div>
    
    <!-- 4. 对话框（可选）-->
    <t-dialog ...></t-dialog>
  </div>

  <!-- 引入库文件 -->
  <script src="../../assets/libs/vue.global.js"></script>
  <script src="../../assets/libs/tdesign.min.js"></script>
  <script src="../../assets/libs/tcb.js"></script>
  <script src="../../assets/js/config.js"></script>
  <script src="../../assets/js/admin-api.js"></script>
  
  <!-- 页面逻辑 -->
  <script>
    const { createApp, ref, reactive, onMounted } = Vue;
    const app = createApp({
      setup() {
        // ... 页面逻辑
      }
    });
    app.use(TDesign);
    app.mount('#app');
  </script>
</body>
</html>
```

### 样式规范

1. **配色**：直接使用 TDesign 组件，无需自定义颜色
2. **间距**：统一 24px（页面）、16px（卡片间距）
3. **圆角**：8px（卡片）
4. **字号**：20px（标题）、14px（正文）

### 组件规范

1. **表格**：使用 `<t-table>` + 分页
2. **表单**：使用 `<t-form>` + `<t-form-item>`
3. **按钮**：主按钮用 `theme="primary"`，次要用 `theme="default"`
4. **对话框**：统一使用 `<t-dialog>`
5. **消息提示**：使用 `TDesign.MessagePlugin`
6. **标签**：状态标签用 `<t-tag>`

### 交互规范

1. **加载**：表格、对话框统一显示 loading 状态
2. **提示**：操作成功/失败统一使用 Message 提示
3. **确认**：删除等危险操作使用 Dialog 确认
4. **返回**：统一提供"返回"按钮，跳转 `index.html`

---

## 🚀 快速开发指南

### Step 1: 复制模板

```bash
# 复制示例页面作为模板
cp pages/user/list.html pages/order/list.html
```

### Step 2: 修改内容

1. 修改 `<title>` 和页面标题
2. 修改搜索字段（根据接口文档）
3. 修改表格列配置（根据数据字段）
4. 修改 API 调用（使用对应的 AdminAPI 方法）

### Step 3: 测试

1. 在浏览器打开页面
2. 测试搜索、分页、CRUD 操作
3. 检查样式一致性

---

## 📦 API 调用示例

所有接口已封装在 `AdminAPI` 中，直接调用即可：

```javascript
// 列表查询
const result = await AdminAPI.getOrderList({
  page: 1,
  pageSize: 20,
  keyword: 'test'
});

// 创建
await AdminAPI.createCourse({
  name: '课程名称',
  type: 1,
  price: 99900
});

// 更新
await AdminAPI.updateCourse({
  id: 1,
  name: '新名称'
});

// 删除
await AdminAPI.deleteCourse(1);

// 审核
await AdminAPI.auditApplication(123, true);
```

---

## 🔗 参考资源

- **示例页面**: `pages/user/list.html`（完整示例）
- **接口文档**: `后台/后台管理接口文档.md`
- **接口汇总**: `后台/后台管理接口汇总表.md`
- **API 封装**: `assets/js/admin-api.js`（64个接口）
- **TDesign 文档**: https://tdesign.tencent.com/vue-next/overview

---

## ✨ 下一步行动

1. ✅ **已完成**：
   - 下载 CDN 到本地（libs/）
   - 创建完整 API 封装（64个接口）
   - 更新侧边导航菜单
   - 创建用户列表示例页面

2. ⏳ **进行中**：
   - 继续开发剩余 18 个页面

3. 📝 **建议**：
   - 优先完成高频页面（订单、课程、大使）
   - 每个模块先完成列表页，再做详情/表单页
   - 保持样式和交互一致性

---

**文档维护**: 天道文化技术团队  
**最后更新**: 2026-02-12





