# 天道文化 - 后台管理 API 快速参考

> **更新日期**: 2026-02-12  
> **适用场景**: Web 后台管理系统开发  
> **调用方式**: HTTP/CloudBase SDK

---

## 🚀 快速开始

### 1. HTTP 调用方式（推荐 Web 后台使用）

```javascript
// 安装 @cloudbase/node-sdk
npm install @cloudbase/node-sdk

// 初始化
const cloudbase = require('@cloudbase/node-sdk');
const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124',  // 环境ID
  secretId: 'YOUR_SECRET_ID',       // API密钥ID
  secretKey: 'YOUR_SECRET_KEY'      // API密钥Key
});

// 调用云函数
const result = await app.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: 'YOUR_JWT_TOKEN',  // 登录后获取的token
    page: 1,
    pageSize: 20
  }
});

console.log(result.result); // { success: true, data: {...} }
```

### 2. 鉴权流程

```javascript
// 步骤1: 管理员登录
const loginRes = await app.callFunction({
  name: 'system',
  data: {
    action: 'login',
    username: 'admin',
    password: '123456'
  }
});

const { token, admin } = loginRes.result.data;
localStorage.setItem('admin_token', token);  // 保存 token

// 步骤2: 后续请求携带 token
const listRes = await app.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: token,  // 必须携带
    page: 1,
    pageSize: 20
  }
});
```

---

## 📋 所有管理端接口清单

### 1. 用户管理模块 (user)

| Action | 说明 | 主要参数 |
|--------|------|---------|
| `getUserList` | 学员列表 | page, pageSize, keyword, ambassadorLevel |
| `getUserDetail` | 学员详情 | userId |
| `updateUserReferee` | 修改推荐人 | userId, newRefereeId, reason |
| `getRefereeChangeLogs` | 推荐人变更记录 | userId, page, pageSize |

### 2. 订单管理模块 (order)

| Action | 说明 | 主要参数 |
|--------|------|---------|
| `getOrderList` | 订单列表 | page, page_size, pay_status, keyword |
| `getOrderDetail` | 订单详情 | order_no |
| `refund` | 订单退款 | order_no, refund_amount, refund_reason |
| `withdrawAudit` | 提现审核 | withdrawal_id, status, reject_reason |

### 3. 课程管理模块 (course)

| Action | 说明 | 主要参数 |
|--------|------|---------|
| `getCourseList` | 课程列表 | page, page_size, type, status, keyword |
| `createCourse` | 创建课程 | name, type, current_price |
| `updateCourse` | 更新课程 | id, ...更新字段 |
| `deleteCourse` | 删除课程 | id |
| `getClassRecordList` | 排期列表 | page, page_size, course_id, status |
| `createClassRecord` | 创建排期 | course_id, class_date, start_time, end_time |
| `updateClassRecord` | 更新排期 | id, ...更新字段 |
| `deleteClassRecord` | 删除排期 | id |
| `getAppointmentList` | 预约列表 | page, page_size, course_id, status, keyword |
| `updateAppointmentStatus` | 更新预约状态 | appointment_id, status, reason |
| `batchCheckin` | 批量签到 | appointment_ids |
| `getCaseList` | 案例列表 | page, page_size, keyword |
| `createCase` | 创建案例 | ... |
| `updateCase` | 更新案例 | id, ... |
| `deleteCase` | 删除案例 | id |
| `getMaterialList` | 资料列表 | page, page_size, keyword |
| `createMaterial` | 创建资料 | ... |
| `updateMaterial` | 更新资料 | id, ... |
| `deleteMaterial` | 删除资料 | id |
| `manageAcademyContent` | 管理学院内容 | ... |

### 4. 大使管理模块 (ambassador)

| Action | 说明 | 主要参数 |
|--------|------|---------|
| `getAmbassadorList` | 大使列表 | page, page_size, level, keyword |
| `getAmbassadorDetail` | 大使详情 | ambassador_id |
| `getApplicationList` | 申请列表 | page, page_size, status |
| `auditApplication` | 审核申请 | application_id, approved, reject_reason |
| `getActivityList` | 活动列表 | page, page_size |
| `createActivity` | 创建活动 | ... |
| `updateActivity` | 更新活动 | id, ... |
| `deleteActivity` | 删除活动 | id |
| `getContractTemplateList` | 合约模板列表 | page, page_size |
| `createContractTemplate` | 创建合约模板 | ... |
| `updateContractTemplate` | 更新合约模板 | id, ... |
| `deleteContractTemplate` | 删除合约模板 | id |
| `getSignatureList` | 签约列表 | page, page_size |
| `getContractVersions` | 合约版本 | template_id |
| `getExpiringContracts` | 即将到期合约 | days |

### 5. 系统管理模块 (system)

| Action | 说明 | 主要参数 |
|--------|------|---------|
| `login` | 管理员登录 | username, password |
| `getStatistics` | 统计数据 | 无 |
| `getAdminUserList` | 管理员列表 | page, page_size, status |
| `createAdminUser` | 创建管理员 | username, password, real_name, role |
| `updateAdminUser` | 更新管理员 | id, ... |
| `deleteAdminUser` | 删除管理员 | id |
| `getConfig` | 获取配置 | config_key |
| `updateConfig` | 更新配置 | config_key, config_value |
| `getAnnouncementList` | 公告列表 | page, page_size, status |
| `createAnnouncement` | 创建公告 | title, content, type |
| `updateAnnouncement` | 更新公告 | id, ... |
| `deleteAnnouncement` | 删除公告 | id |
| `getFeedbackList` | 反馈列表 | page, page_size, type, status |
| `replyFeedback` | 回复反馈 | feedback_id, reply_content, status |
| `getNotificationConfigList` | 通知配置列表 | page, page_size |
| `createNotificationConfig` | 创建通知配置 | ... |
| `updateNotificationConfig` | 更新通知配置 | id, ... |
| `getNotificationLogs` | 通知日志 | page, page_size, start_date, end_date |
| `sendNotification` | 发送通知 | user_ids, template_id, data |
| `getAmbassadorLevelConfigs` | 大使等级配置 | 无 |
| `initAmbassadorLevelConfigs` | 初始化等级配置 | 无 |
| `updateAmbassadorLevelConfig` | 更新等级配置 | level, ... |

---

## 🔧 常用接口示例

### 1. 获取学员列表（带搜索、筛选）

```javascript
const result = await app.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: token,
    page: 1,
    pageSize: 20,
    keyword: '张三',              // 可选：搜索姓名/手机号
    ambassadorLevel: 1,          // 可选：筛选大使等级
    startDate: '2025-01-01',     // 可选：注册开始日期
    endDate: '2025-12-31'        // 可选：注册结束日期
  }
});

// 响应数据
{
  "success": true,
  "data": {
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "real_name": "张三",
        "phone": "138****8888",
        "ambassador_level": 1,
        "merit_points": 500,
        "cash_points": 1200.50,
        "created_at": "2025-01-15T08:30:00.000Z"
      }
    ]
  }
}
```

### 2. 获取订单列表（带筛选）

```javascript
const result = await app.callFunction({
  name: 'order',
  data: {
    action: 'getOrderList',
    jwtToken: token,
    page: 1,
    page_size: 20,
    pay_status: 1,               // 可选：0=待支付，1=已支付，2=已取消，3=已关闭，4=已退款
    start_date: '2026-01-01',    // 可选：开始日期
    end_date: '2026-02-12',      // 可选：结束日期
    keyword: '张三'               // 可选：搜索订单号/用户姓名/手机号
  }
});
```

### 3. 审核大使申请

```javascript
// 通过申请
const result = await app.callFunction({
  name: 'ambassador',
  data: {
    action: 'auditApplication',
    jwtToken: token,
    application_id: 123,
    approved: true
  }
});

// 拒绝申请
const result = await app.callFunction({
  name: 'ambassador',
  data: {
    action: 'auditApplication',
    jwtToken: token,
    application_id: 123,
    approved: false,
    reject_reason: '资质不符合要求'
  }
});
```

### 4. 提现审核

```javascript
// 审核通过
const result = await app.callFunction({
  name: 'order',
  data: {
    action: 'withdrawAudit',
    jwtToken: token,
    withdrawal_id: 456,
    status: 1  // 1=通过，2=拒绝
  }
});

// 审核拒绝
const result = await app.callFunction({
  name: 'order',
  data: {
    action: 'withdrawAudit',
    jwtToken: token,
    withdrawal_id: 456,
    status: 2,
    reject_reason: '账户信息有误'
  }
});
```

### 5. 创建课程

```javascript
const result = await app.callFunction({
  name: 'course',
  data: {
    action: 'createCourse',
    jwtToken: token,
    name: '初探班',
    type: 1,                     // 1=初探班，2=密训班，3=咨询服务
    current_price: 1960.00,
    original_price: 1980.00,
    cover_image: 'https://...',
    description: '课程简介',
    content: '课程内容',
    outline: '课程大纲',
    teacher: '王老师',
    duration: '2天1夜',
    allow_retrain: 1,            // 0=否，1=是
    sort_order: 1,
    status: 1                    // 0=下架，1=上架
  }
});
```

### 6. 批量签到

```javascript
const result = await app.callFunction({
  name: 'course',
  data: {
    action: 'batchCheckin',
    jwtToken: token,
    appointment_ids: [101, 102, 103, 104, 105]  // 预约ID数组
  }
});

// 响应数据
{
  "success": true,
  "message": "批量签到成功",
  "data": {
    "success_count": 5,
    "failed_count": 0,
    "failed_list": []
  }
}
```

### 7. 获取统计数据（仪表盘）

```javascript
const result = await app.callFunction({
  name: 'system',
  data: {
    action: 'getStatistics',
    jwtToken: token
  }
});

// 响应数据
{
  "success": true,
  "data": {
    "users": {
      "total": 1560,           // 总用户数
      "today": 12,             // 今日新增
      "ambassadors": 50        // 大使数量
    },
    "orders": {
      "total": 856,            // 总订单数
      "today": 5,              // 今日订单
      "total_amount": "568900.00"  // 总金额
    },
    "courses": {
      "total_appointments": 320,     // 总预约数
      "checked_in": 280,             // 已签到数
      "checkin_rate": "87.50"        // 签到率
    },
    "ambassadors": {
      "total": 50,
      "level_distribution": {        // 等级分布
        "level_1": 30,
        "level_2": 12,
        "level_3": 5,
        "level_4": 2,
        "level_5": 1
      }
    },
    "today": {
      "users": 12,
      "orders": 5,
      "appointments": 8,
      "feedbacks": 3
    }
  }
}
```

---

## 📊 枚举值参考

### 订单支付状态（pay_status）
```javascript
const PAY_STATUS = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已关闭',
  4: '已退款'
};
```

### 课程类型（type）
```javascript
const COURSE_TYPE = {
  1: '初探班',
  2: '密训班',
  3: '咨询服务'
};
```

### 预约状态（status）
```javascript
const APPOINTMENT_STATUS = {
  0: '待确认',
  1: '已确认',
  2: '已签到',
  3: '已取消'
};
```

### 大使等级（ambassador_level）
```javascript
const AMBASSADOR_LEVEL = {
  0: '普通用户',
  1: '初级大使',
  2: '中级大使',
  3: '高级大使',
  4: '资深大使',
  5: '特级大使'
};
```

### 申请审核状态（status）
```javascript
const APPLICATION_STATUS = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝'
};
```

### 管理员角色（role）
```javascript
const ADMIN_ROLE = {
  'super_admin': '超级管理员',
  'admin': '管理员',
  'operator': '运营人员'
};
```

### 提现审核状态（status）
```javascript
const WITHDRAW_STATUS = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝'
};
```

---

## 🛠️ 统一错误处理

### 错误响应格式

```json
{
  "success": false,
  "code": 401,
  "message": "Token 已过期，请重新登录",
  "error": {
    "name": "TokenExpiredError",
    "message": "jwt expired"
  }
}
```

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 400 | 参数错误 | 检查请求参数是否完整、格式是否正确 |
| 401 | 未授权/Token过期 | 重定向到登录页面 |
| 403 | 无权限 | 提示用户权限不足 |
| 404 | 资源不存在 | 提示用户数据不存在 |
| 500 | 服务器内部错误 | 记录日志，提示用户稍后重试 |

### 错误处理示例

```javascript
async function callCloudFunction(name, action, data) {
  try {
    const token = localStorage.getItem('admin_token');
    
    const result = await app.callFunction({
      name,
      data: {
        action,
        jwtToken: token,
        ...data
      }
    });
    
    const { success, code, message, data: resData } = result.result;
    
    if (!success) {
      // 统一错误处理
      if (code === 401) {
        // Token 过期，跳转登录
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      
      // 其他错误提示
      alert(message);
      return null;
    }
    
    return resData;
    
  } catch (error) {
    console.error('调用云函数失败:', error);
    alert('网络错误，请稍后重试');
    return null;
  }
}

// 使用示例
const users = await callCloudFunction('user', 'getUserList', {
  page: 1,
  pageSize: 20
});
```

---

## 📝 开发建议

### 1. 封装统一的 API 调用模块

```javascript
// api/cloudbase.js
import cloudbase from '@cloudbase/node-sdk';

const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124',
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY
});

export class CloudBaseAPI {
  // 统一调用方法
  static async call(name, action, data = {}) {
    const token = localStorage.getItem('admin_token');
    
    try {
      const result = await app.callFunction({
        name,
        data: {
          action,
          jwtToken: token,
          ...data
        }
      });
      
      const { success, code, message, data: resData } = result.result;
      
      if (!success) {
        if (code === 401) {
          // Token 过期处理
          this.handleTokenExpired();
          throw new Error('Token 已过期');
        }
        throw new Error(message);
      }
      
      return resData;
      
    } catch (error) {
      console.error(`[${name}.${action}] 调用失败:`, error);
      throw error;
    }
  }
  
  static handleTokenExpired() {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  }
}

// 用户模块 API
export class UserAPI {
  static getUserList(params) {
    return CloudBaseAPI.call('user', 'getUserList', params);
  }
  
  static getUserDetail(userId) {
    return CloudBaseAPI.call('user', 'getUserDetail', { userId });
  }
  
  static updateUserReferee(params) {
    return CloudBaseAPI.call('user', 'updateUserReferee', params);
  }
}

// 订单模块 API
export class OrderAPI {
  static getOrderList(params) {
    return CloudBaseAPI.call('order', 'getOrderList', params);
  }
  
  static withdrawAudit(params) {
    return CloudBaseAPI.call('order', 'withdrawAudit', params);
  }
}

// ... 其他模块 API
```

### 2. 使用示例

```javascript
import { UserAPI, OrderAPI } from '@/api/cloudbase';

// 获取学员列表
async function loadUsers() {
  try {
    const data = await UserAPI.getUserList({
      page: 1,
      pageSize: 20,
      keyword: '张三'
    });
    
    console.log('学员列表:', data.list);
    console.log('总数:', data.total);
    
  } catch (error) {
    console.error('加载失败:', error);
  }
}

// 审核提现
async function auditWithdraw(withdrawalId, approved) {
  try {
    await OrderAPI.withdrawAudit({
      withdrawal_id: withdrawalId,
      status: approved ? 1 : 2,
      reject_reason: approved ? '' : '账户信息有误'
    });
    
    alert('审核成功');
    
  } catch (error) {
    alert('审核失败: ' + error.message);
  }
}
```

### 3. 分页组件封装建议

```javascript
// components/CloudBaseTable.vue
<template>
  <div>
    <el-table :data="list" :loading="loading">
      <slot></slot>
    </el-table>
    
    <el-pagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script>
export default {
  props: {
    apiFunction: Function,  // API 调用函数
    queryParams: Object     // 查询参数
  },
  
  data() {
    return {
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      loading: false
    };
  },
  
  async mounted() {
    await this.loadData();
  },
  
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const data = await this.apiFunction({
          page: this.page,
          pageSize: this.pageSize,
          ...this.queryParams
        });
        
        this.list = data.list;
        this.total = data.total;
        
      } catch (error) {
        this.$message.error('加载失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    handlePageChange(page) {
      this.page = page;
      this.loadData();
    }
  }
};
</script>
```

---

## 🔗 相关文档

- [完整 API 文档](./后台管理接口文档.md) - 详细的接口说明和参数
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [项目开发规范](./项目开发规范.md)

---

**最后更新**: 2026-02-12  
**维护**: 天道文化技术团队









