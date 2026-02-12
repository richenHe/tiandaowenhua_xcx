# Web 管理后台快速开始指南

## 前置条件

- ✅ 云函数已完成 JWT Token 鉴权改造（参考：[Web管理后台鉴权改造总结](./Web管理后台鉴权改造总结.md)）
- ✅ 已创建管理员账号（在 `admin_users` 表中）
- ✅ 前端项目使用 Vue 3 + Vite（或其他框架）

## 第一步：安装依赖

```bash
npm install @cloudbase/js-sdk
```

## 第二步：初始化 CloudBase

在项目中创建 `src/utils/cloudbase.js`：

```javascript
import cloudbase from '@cloudbase/js-sdk';

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'  // 替换为你的环境ID
});

export default app;
```

## 第三步：复制 API 工具类

将 `docs/examples/admin-api.js` 复制到 `src/utils/admin-api.js`：

```bash
cp docs/examples/admin-api.js src/utils/admin-api.js
```

确保修改环境ID：

```javascript
// src/utils/admin-api.js
const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'  // 替换为你的环境ID
});
```

## 第四步：创建登录页面

将 `docs/examples/LoginPage.vue` 复制到 `src/views/admin/LoginPage.vue`：

```bash
mkdir -p src/views/admin
cp docs/examples/LoginPage.vue src/views/admin/LoginPage.vue
```

## 第五步：配置路由

将 `docs/examples/router-guard.js` 的内容添加到 `src/router/index.js`：

```bash
cp docs/examples/router-guard.js src/router/index.js
```

## 第六步：测试登录

### 1. 创建测试管理员账号

在 CloudBase 控制台或使用 MCP 工具执行：

```sql
INSERT INTO tiandao_culture.admin_users 
  (username, password, real_name, role, status, created_at) 
VALUES 
  ('admin', '$2a$10$YourHashedPassword', '管理员', 'superadmin', 1, NOW());
```

**注意**：密码需要使用 bcrypt 加密。你可以使用以下 Node.js 代码生成密码哈希：

```javascript
const bcrypt = require('bcryptjs');
const password = '123456';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);  // 将输出的哈希值插入数据库
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问登录页

打开浏览器访问：`http://localhost:5173/admin/login`

### 4. 登录测试

- 用户名：`admin`
- 密码：`123456`

## 第七步：调用管理端接口

### 示例1：获取用户列表

```vue
<template>
  <div>
    <h1>用户列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>大使等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.real_name }}</td>
            <td>{{ user.phone }}</td>
            <td>{{ user.ambassador_level }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AdminAPI from '@/utils/admin-api';

const loading = ref(true);
const users = ref([]);

async function loadUsers() {
  try {
    loading.value = true;
    const result = await AdminAPI.getUserList(1, 20);
    users.value = result.list;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    alert('获取用户列表失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadUsers();
});
</script>
```

### 示例2：审核大使申请

```vue
<template>
  <div>
    <h1>大使申请审核</h1>
    <div v-for="application in applications" :key="application.id">
      <h3>{{ application.user_name }}</h3>
      <p>申请等级: {{ application.target_level }}</p>
      <button @click="handleAudit(application.id, 2)">通过</button>
      <button @click="handleAudit(application.id, 3)">拒绝</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AdminAPI from '@/utils/admin-api';

const applications = ref([]);

async function loadApplications() {
  try {
    const result = await AdminAPI.getApplicationList({ status: 1 });
    applications.value = result.list;
  } catch (error) {
    console.error('获取申请列表失败:', error);
  }
}

async function handleAudit(applicationId, status) {
  try {
    await AdminAPI.auditApplication(applicationId, status);
    alert('审核成功');
    loadApplications();  // 重新加载列表
  } catch (error) {
    console.error('审核失败:', error);
    alert('审核失败: ' + error.message);
  }
}

onMounted(() => {
  loadApplications();
});
</script>
```

### 示例3：订单退款

```vue
<template>
  <div>
    <h1>订单退款</h1>
    <form @submit.prevent="handleRefund">
      <div>
        <label>订单ID:</label>
        <input v-model="form.orderId" type="number" required />
      </div>
      <div>
        <label>退款金额（元）:</label>
        <input v-model="form.amount" type="number" step="0.01" required />
      </div>
      <div>
        <label>退款原因:</label>
        <textarea v-model="form.reason" required></textarea>
      </div>
      <button type="submit">提交退款</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdminAPI from '@/utils/admin-api';

const form = ref({
  orderId: null,
  amount: 0,
  reason: ''
});

async function handleRefund() {
  try {
    // 将元转换为分
    const refundAmount = Math.round(form.value.amount * 100);
    
    await AdminAPI.refundOrder(
      form.value.orderId,
      refundAmount,
      form.value.reason
    );
    
    alert('退款成功');
    
    // 重置表单
    form.value = {
      orderId: null,
      amount: 0,
      reason: ''
    };
  } catch (error) {
    console.error('退款失败:', error);
    alert('退款失败: ' + error.message);
  }
}
</script>
```

## 常见问题

### Q1: 登录后跳转到首页，但立即又跳回登录页？

**原因**：路由守卫检测到 Token 无效或管理员信息不存在。

**解决**：
1. 检查浏览器控制台是否有错误
2. 检查 `localStorage` 中是否有 `adminToken` 和 `adminInfo`
3. 检查 Token 是否过期（24小时有效期）

### Q2: 调用接口时返回 401 错误？

**原因**：Token 过期或无效。

**解决**：
1. 清除 `localStorage` 中的 Token
2. 重新登录获取新 Token
3. 检查 `JWT_SECRET` 环境变量是否配置正确

### Q3: 调用接口时返回 403 错误？

**原因**：权限不足。

**解决**：
1. 检查管理员账号的 `role` 字段（应为 `admin` 或 `superadmin`）
2. 检查管理员账号的 `status` 字段（应为 `1`）
3. 部分接口需要 `superadmin` 权限

### Q4: 云函数调用失败，提示"未找到 checkAdminAuthByToken"？

**原因**：云函数代码未更新或 `common/auth.js` 缺少该函数。

**解决**：
1. 检查 `cloudfunctions/common/auth.js` 是否包含 `checkAdminAuthByToken` 函数
2. 使用 MCP 工具重新部署云函数代码

### Q5: 如何生成密码哈希？

**方法1：使用 Node.js**

```javascript
const bcrypt = require('bcryptjs');
const password = '123456';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

**方法2：在线工具**

访问 https://bcrypt-generator.com/ 输入密码生成哈希值。

## 下一步

### 1. 完善页面

- 实现用户管理页面（列表、详情、编辑）
- 实现订单管理页面（列表、详情、退款）
- 实现课程管理页面（列表、创建、编辑）
- 实现大使管理页面（列表、申请审核、活动管理）

### 2. 优化体验

- 添加加载动画
- 添加错误提示组件
- 实现分页组件
- 实现表单验证

### 3. 安全加固

- 启用 HTTPS（生产环境必须）
- 实现 Token 刷新机制
- 添加操作日志记录
- 实现权限精细化控制

### 4. 性能优化

- 实现接口缓存
- 实现虚拟列表（大数据量）
- 优化打包体积
- 实现懒加载

## 完整示例项目结构

```
src/
├── main.js                  # 入口文件
├── App.vue                  # 根组件
├── router/
│   └── index.js             # 路由配置（包含路由守卫）
├── utils/
│   ├── cloudbase.js         # CloudBase 初始化
│   └── admin-api.js         # API 工具类
├── views/
│   ├── admin/
│   │   ├── LoginPage.vue    # 登录页
│   │   ├── Dashboard.vue    # 仪表盘
│   │   ├── UserList.vue     # 用户列表
│   │   ├── UserDetail.vue   # 用户详情
│   │   ├── OrderList.vue    # 订单列表
│   │   ├── CourseList.vue   # 课程列表
│   │   └── ...
│   └── NotFound.vue         # 404 页面
├── layouts/
│   └── AdminLayout.vue      # 管理后台布局
└── components/
    ├── Loading.vue          # 加载组件
    ├── ErrorMessage.vue     # 错误提示组件
    └── Pagination.vue       # 分页组件
```

## 参考文档

- [Web 管理后台调用云函数指南](./Web管理后台调用云函数指南.md)
- [Web 管理后台鉴权改造总结](./Web管理后台鉴权改造总结.md)
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/zh/)

---

**祝开发顺利！如有问题，请参考上述文档或联系开发团队。**

