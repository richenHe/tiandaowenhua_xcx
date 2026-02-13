# Web 管理后台鉴权改造总结

## 问题背景

**原问题**：后台管理员使用用户名+密码登录，返回JWT Token，但云函数调用时需要 OPENID，Web 端无法提供 OPENID。

**原因分析**：
- 小程序端：可以通过 `cloud.getWXContext().OPENID` 自动获取
- Web 管理后台：没有微信环境，无法获取 OPENID
- 管理员使用用户名+密码登录，与 OPENID 机制不兼容

## 解决方案

### 方案概述

改造云函数鉴权层，支持**双鉴权机制**：
1. **小程序端**：继续使用 OPENID（保持兼容）
2. **Web 管理端**：使用 JWT Token（新增支持）

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
    │  - if (jwtToken) → JWT 鉴权         │
    │  - else → OPENID 鉴权               │
    └─────────────────────────────────────┘
```

### 实施步骤

#### 1. 鉴权层已具备 JWT Token 功能

`cloudfunctions/common/auth.js` 已包含：
- ✅ `generateAdminToken()` - 生成 JWT Token
- ✅ `verifyAdminToken()` - 验证 JWT Token
- ✅ `checkAdminAuthByToken()` - 基于 JWT Token 的鉴权

#### 2. 改造云函数入口

改造 5 个云函数的 `index.js`，支持 JWT Token 鉴权：
- ✅ `user/index.js`
- ✅ `order/index.js`
- ✅ `course/index.js`
- ✅ `ambassador/index.js`
- ✅ `system/index.js`

**改造内容**：

**改造前**：
```javascript
// 管理端接口（需管理员鉴权）
if (ROUTES.admin.includes(action)) {
  const admin = await checkAdminAuth(OPENID);
  return await adminHandlers[action](event, { OPENID, admin });
}
```

**改造后**：
```javascript
// 管理端接口（需管理员鉴权）
if (ROUTES.admin.includes(action)) {
  // 支持两种鉴权方式：Web端JWT Token 和 小程序端OPENID
  let admin;
  if (event.jwtToken) {
    admin = checkAdminAuthByToken(event.jwtToken);
  } else {
    admin = await checkAdminAuth(OPENID);
  }
  return await adminHandlers[action](event, { OPENID, admin });
}
```

#### 3. 部署更新

已使用 MCP 工具批量更新所有云函数：
```
✅ user 云函数更新成功（RequestId: 07e62170-9989-4bc8-9a17-5cccef763e97）
✅ order 云函数更新成功（RequestId: 8ac228ca-f141-4a0f-99fc-71b322905510）
✅ course 云函数更新成功（RequestId: ce129924-ed0d-4874-bb16-4fa26e77b5fa）
✅ ambassador 云函数更新成功（RequestId: 011c1d28-7ef8-4643-8601-3a050ec203ce）
✅ system 云函数更新成功（RequestId: fb60662d-2dfc-414a-820d-731feae2c859）
```

## Web 端调用示例

### 1. 管理员登录

```javascript
// 调用登录接口
const result = await cloudbase.callFunction({
  name: 'system',
  data: {
    action: 'login',
    username: 'admin',
    password: '123456'
  }
});

// 保存 Token
const { token, admin } = result.result.data;
localStorage.setItem('adminToken', token);
localStorage.setItem('adminInfo', JSON.stringify(admin));
```

### 2. 调用管理端接口

```javascript
const token = localStorage.getItem('adminToken');

// 示例：获取用户列表
const result = await cloudbase.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: token,  // ⚠️ 必须携带 jwtToken
    page: 1,
    pageSize: 20
  }
});

// 示例：审核大使申请
const result = await cloudbase.callFunction({
  name: 'ambassador',
  data: {
    action: 'auditApplication',
    jwtToken: token,  // ⚠️ 必须携带 jwtToken
    applicationId: 123,
    status: 2
  }
});
```

### 3. 封装 API 工具类（推荐）

```javascript
class AdminAPI {
  static async call(name, action, data = {}) {
    const token = localStorage.getItem('adminToken');
    
    const result = await cloudbase.callFunction({
      name,
      data: {
        action,
        jwtToken: token,  // 自动注入 Token
        ...data
      }
    });

    const response = result.result;

    // 处理 Token 过期
    if (response.code === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
      throw new Error('登录已过期');
    }

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data;
  }

  // 用户模块
  static async getUserList(page, pageSize) {
    return this.call('user', 'getUserList', { page, pageSize });
  }

  // 订单模块
  static async getOrderList(params) {
    return this.call('order', 'getOrderList', params);
  }
}

export default AdminAPI;
```

## 技术细节

### JWT Token 配置

**生成 Token**：
```javascript
jwt.sign(
  {
    id: adminInfo.id,
    username: adminInfo.username,
    role: adminInfo.role,
    type: 'admin'
  },
  process.env.JWT_SECRET,  // 从环境变量读取密钥
  {
    expiresIn: '24h',           // 24小时过期
    issuer: 'tiandao-admin',    // 签发者
    audience: 'admin-panel'     // 接收者
  }
);
```

**验证 Token**：
```javascript
jwt.verify(token, process.env.JWT_SECRET, {
  issuer: 'tiandao-admin',
  audience: 'admin-panel'
});
```

### 错误处理

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 401 | Token 无效或过期 | 清除本地 Token，跳转登录页 |
| 403 | 权限不足 | 提示用户无权限 |
| 400 | 参数错误 | 检查请求参数 |

### 安全机制

1. **Token 签名**：使用 HMAC SHA256 算法，防止篡改
2. **Token 有效期**：24小时自动过期
3. **Token 类型验证**：必须是 `type: 'admin'`
4. **签发者/接收者验证**：防止 Token 被其他系统复用

## 兼容性说明

### 小程序端（无影响）

小程序管理端仍然可以使用 OPENID 鉴权：
```javascript
// 小程序端调用（无需 jwtToken）
wx.cloud.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    // 不需要传 jwtToken，云函数自动使用 OPENID 鉴权
    page: 1,
    pageSize: 20
  }
});
```

### Web 端（新增支持）

Web 管理后台使用 JWT Token 鉴权：
```javascript
// Web 端调用（需要 jwtToken）
cloudbase.callFunction({
  name: 'user',
  data: {
    action: 'getUserList',
    jwtToken: token,  // 必须携带
    page: 1,
    pageSize: 20
  }
});
```

## 测试验证

### 测试步骤

1. **登录接口测试**：
   ```javascript
   const result = await cloudbase.callFunction({
     name: 'system',
     data: { action: 'login', username: 'admin', password: '123456' }
   });
   console.log('Token:', result.result.data.token);
   ```

2. **管理端接口测试**：
   ```javascript
   const result = await cloudbase.callFunction({
     name: 'user',
     data: { action: 'getUserList', jwtToken: token, page: 1, pageSize: 10 }
   });
   console.log('用户列表:', result.result.data);
   ```

3. **Token 过期测试**：
   ```javascript
   // 使用过期或无效的 Token
   const result = await cloudbase.callFunction({
     name: 'user',
     data: { action: 'getUserList', jwtToken: 'invalid-token' }
   });
   // 应返回 { success: false, code: 401, message: '未登录或登录已过期' }
   ```

### 预期结果

- ✅ 登录成功返回有效的 JWT Token
- ✅ 使用 Token 可以正常调用管理端接口
- ✅ Token 过期自动返回 401 错误
- ✅ 小程序端仍可使用 OPENID 鉴权（向下兼容）

## 支持的云函数与接口

| 云函数 | 管理端接口数量 | JWT Token 支持 |
|-------|---------------|----------------|
| user | 4个 | ✅ 已支持 |
| order | 4个 | ✅ 已支持 |
| course | 20个 | ✅ 已支持 |
| ambassador | 16个 | ✅ 已支持 |
| system | 18个 | ✅ 已支持 |

**共计 62 个管理端接口全部支持 JWT Token 鉴权！**

## 相关文档

- [Web 管理后台调用云函数指南](./Web管理后台调用云函数指南.md) - 详细的使用指南
- [项目开发规范](../项目开发规范.md) - 云函数开发规范

## 总结

### 改造成果

✅ **问题解决**：Web 管理后台可以通过 JWT Token 调用云函数，无需 OPENID
✅ **向下兼容**：小程序端仍可使用 OPENID 鉴权，不受影响
✅ **全面覆盖**：5 个云函数、62 个管理端接口全部支持
✅ **安全可靠**：JWT Token 签名验证、24小时自动过期
✅ **易于使用**：封装 API 工具类，自动注入 Token

### 下一步

1. **Web 管理后台开发**：
   - 实现登录页面
   - 封装 API 工具类
   - 实现路由守卫

2. **功能测试**：
   - 测试登录流程
   - 测试管理端接口调用
   - 测试 Token 过期处理

3. **安全加固**：
   - 配置 HTTPS（生产环境必须）
   - 实现 Token 刷新机制（可选）
   - 添加登录日志审计

---

**改造完成时间**：2026-02-12  
**改造人员**：AI 助手  
**影响范围**：5 个云函数（user, order, course, ambassador, system）





