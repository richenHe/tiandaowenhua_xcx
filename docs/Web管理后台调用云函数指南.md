# Web 管理后台调用云函数指南

## 架构说明

Web 管理后台使用 **JWT Token** 方式调用云函数，无需依赖微信小程序的 OPENID。

```
┌─────────────────┐         ┌─────────────────┐
│   小程序客户端    │         │   Web管理后台    │
│  (使用OPENID)   │         │  (使用JWT Token)│
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ OPENID 自动获取            │ JWT Token (登录后获取)
         │                           │
         ▼                           ▼
    ┌─────────────────────────────────────┐
    │         云函数入口 (index.js)        │
    │  - 自动识别请求类型                  │
    │  - OPENID → checkAdminAuth          │
    │  - JWT Token → checkAdminAuthByToken│
    └─────────────────────────────────────┘
```

## 管理员登录流程

### 1. 登录接口

**接口名称**：`system.login`

**请求参数**：
```javascript
{
  action: 'login',
  username: '管理员账号',
  password: '密码'
}
```

**响应数据**：
```javascript
{
  success: true,
  code: 0,
  message: '登录成功',
  data: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // JWT Token（24小时有效）
    admin: {
      id: 1,
      username: 'admin',
      real_name: '管理员',
      role: 'superadmin'  // 或 'admin'
    }
  }
}
```

**前端处理**：
```javascript
// 1. 调用登录接口
const loginResult = await cloudbase.callFunction({
  name: 'system',
  data: {
    action: 'login',
    username: 'admin',
    password: '123456'
  }
});

// 2. 保存 Token 到本地存储
const { token, admin } = loginResult.result.data;
localStorage.setItem('adminToken', token);
localStorage.setItem('adminInfo', JSON.stringify(admin));

// 3. 跳转到管理后台首页
window.location.href = '/admin/dashboard';
```

## 调用管理端接口

### 2. 标准调用方式

**所有管理端接口都需要携带 `jwtToken` 参数**：

```javascript
const token = localStorage.getItem('adminToken');

// 示例1：获取用户列表
const result = await cloudbase.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: token,  // ⚠️ 必须携带
    page: 1,
    pageSize: 20
  }
});

// 示例2：审核大使申请
const result = await cloudbase.callFunction({
  name: 'ambassador',
  data: {
    action: 'auditApplication',
    jwtToken: token,  // ⚠️ 必须携带
    applicationId: 123,
    status: 2,  // 2=通过, 3=拒绝
    rejectReason: ''
  }
});

// 示例3：订单退款
const result = await cloudbase.callFunction({
  name: 'order',
  data: {
    action: 'refund',
    jwtToken: token,  // ⚠️ 必须携带
    orderId: 456,
    refundAmount: 99800,  // 单位：分
    refundReason: '用户申请退款'
  }
});
```

### 3. 封装 API 工具类

**推荐封装统一的 API 调用工具**：

```javascript
// src/utils/api.js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'your-env-id'
});

class AdminAPI {
  /**
   * 调用云函数
   * @param {string} name - 云函数名称（user/order/course/ambassador/system）
   * @param {string} action - 接口 action
   * @param {object} data - 请求参数
   */
  static async call(name, action, data = {}) {
    // 获取 Token
    const token = localStorage.getItem('adminToken');
    
    if (!token && action !== 'login') {
      throw new Error('未登录，请先登录');
    }

    try {
      const result = await app.callFunction({
        name,
        data: {
          action,
          jwtToken: token,  // 自动注入 Token
          ...data
        }
      });

      const response = result.result;

      // 处理响应
      if (!response.success) {
        // Token 过期或无效
        if (response.code === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          window.location.href = '/admin/login';
          throw new Error('登录已过期，请重新登录');
        }
        
        throw new Error(response.message || '请求失败');
      }

      return response.data;
    } catch (error) {
      console.error(`[${name}.${action}] 调用失败:`, error);
      throw error;
    }
  }

  // 用户模块
  static async getUserList(page = 1, pageSize = 20) {
    return this.call('user', 'getUserList', { page, pageSize });
  }

  static async getUserDetail(userId) {
    return this.call('user', 'getUserDetail', { userId });
  }

  // 订单模块
  static async getOrderList(params) {
    return this.call('order', 'getOrderList', params);
  }

  static async refundOrder(orderId, refundAmount, refundReason) {
    return this.call('order', 'refund', { orderId, refundAmount, refundReason });
  }

  // 大使模块
  static async getApplicationList(params) {
    return this.call('ambassador', 'getApplicationList', params);
  }

  static async auditApplication(applicationId, status, rejectReason) {
    return this.call('ambassador', 'auditApplication', { 
      applicationId, 
      status, 
      rejectReason 
    });
  }

  // 系统模块
  static async login(username, password) {
    const result = await this.call('system', 'login', { username, password });
    // 登录成功后保存 Token
    if (result.token) {
      localStorage.setItem('adminToken', result.token);
      localStorage.setItem('adminInfo', JSON.stringify(result.admin));
    }
    return result;
  }

  static async logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
  }

  static async getStatistics() {
    return this.call('system', 'getStatistics');
  }
}

export default AdminAPI;
```

### 4. 使用示例

```javascript
// 页面中使用
import AdminAPI from '@/utils/api';

// 登录
async function handleLogin() {
  try {
    const result = await AdminAPI.login('admin', '123456');
    console.log('登录成功:', result);
    window.location.href = '/admin/dashboard';
  } catch (error) {
    alert('登录失败: ' + error.message);
  }
}

// 获取用户列表
async function loadUserList() {
  try {
    const users = await AdminAPI.getUserList(1, 20);
    console.log('用户列表:', users);
  } catch (error) {
    alert('获取用户列表失败: ' + error.message);
  }
}

// 审核大使申请
async function auditApplication(id, status) {
  try {
    await AdminAPI.auditApplication(id, status, '');
    alert('审核成功');
  } catch (error) {
    alert('审核失败: ' + error.message);
  }
}
```

## Token 管理

### 1. Token 有效期

- JWT Token 有效期：**24小时**
- 过期后需要重新登录

### 2. Token 刷新策略

**方案1：自动跳转登录页（推荐）**
```javascript
// 在 API 工具类中统一处理
if (response.code === 401) {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login';
}
```

**方案2：静默刷新（未来可扩展）**
```javascript
// 后续可支持刷新 Token 机制
static async refreshToken() {
  const oldToken = localStorage.getItem('adminToken');
  const result = await this.call('system', 'refreshToken', { oldToken });
  localStorage.setItem('adminToken', result.token);
  return result.token;
}
```

### 3. 路由守卫

```javascript
// router.js
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('adminToken');
  
  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!token) {
      next('/admin/login');
    } else {
      next();
    }
  } else {
    next();
  }
});
```

## 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 401 | 未登录或登录已过期 | 清除本地Token，跳转登录页 |
| 403 | 权限不足 | 提示用户无权限 |
| 400 | 参数错误 | 检查请求参数 |
| 500 | 服务器错误 | 提示用户稍后重试 |

### 统一错误处理

```javascript
// 在 API 工具类中统一处理
static async call(name, action, data = {}) {
  try {
    const result = await app.callFunction({ name, data: { action, jwtToken, ...data } });
    const response = result.result;

    if (!response.success) {
      switch (response.code) {
        case 401:
          this.logout();
          throw new Error('登录已过期，请重新登录');
        case 403:
          throw new Error('权限不足');
        case 400:
          throw new Error(response.message || '参数错误');
        default:
          throw new Error(response.message || '请求失败');
      }
    }

    return response.data;
  } catch (error) {
    console.error(`[${name}.${action}] 调用失败:`, error);
    throw error;
  }
}
```

## 安全建议

### 1. HTTPS 传输

- 生产环境必须使用 HTTPS
- 避免 Token 在网络传输中被窃取

### 2. Token 存储

- 推荐使用 `localStorage`（刷新页面不丢失）
- 敏感环境可使用 `sessionStorage`（关闭浏览器清除）
- **不要**将 Token 存储在 Cookie 中（容易被 XSS 攻击）

### 3. XSS 防护

```javascript
// 避免直接插入 HTML
element.textContent = userData;  // ✅ 正确
element.innerHTML = userData;    // ❌ 错误，可能被 XSS 攻击
```

### 4. 定期更换密码

- 建议管理员定期更换密码
- 密码复杂度要求：至少8位，包含大小写字母、数字、特殊符号

## 支持的云函数

| 云函数名 | 说明 | 管理端接口数量 |
|---------|------|---------------|
| user | 用户模块 | 4个 |
| order | 订单模块 | 4个 |
| course | 课程模块 | 20个 |
| ambassador | 大使模块 | 16个 |
| system | 系统模块 | 18个 |

**所有管理端接口都已支持 JWT Token 鉴权！**

## 快速开始

1. **登录获取 Token**
```javascript
const result = await AdminAPI.login('admin', '123456');
```

2. **调用管理端接口**
```javascript
const users = await AdminAPI.getUserList(1, 20);
```

3. **处理 Token 过期**
```javascript
// 自动跳转登录页（已在 API 工具类中处理）
```

## 示例代码仓库

完整的 Web 管理后台示例代码请参考：
- `src/utils/api.js` - API 工具类
- `src/views/Login.vue` - 登录页面
- `src/router/index.js` - 路由守卫

---

**技术支持**：如有问题，请联系开发团队





