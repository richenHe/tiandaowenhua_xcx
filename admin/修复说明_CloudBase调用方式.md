# CloudBase 调用方式修复说明

## 🐛 问题根源

### 原因分析
管理后台之前使用 **HTTP API** 方式调用云函数：
```javascript
fetch(`https://${ENV_ID}.service.tcloudbase.com/${name}`, {...})
```

这种方式需要为每个云函数配置 **HTTP 触发器**，但云函数实际上没有配置，导致所有调用都返回 `Failed to fetch`。

### 测试结果
- ❌ user 模块：4个接口全部失败（Failed to fetch）
- ❌ order 模块：4个接口全部失败（Failed to fetch）
- ❌ course 模块：20个接口全部失败（Failed to fetch）
- ❌ ambassador 模块：15个接口全部失败（Failed to fetch）

**通过率仅 4.69%（3/64）**

## ✅ 修复方案

### 1. 统一调用方式
将 HTTP API 方式改为 **CloudBase SDK 方式**，与小程序端保持一致：

**修改前**（需要 HTTP 触发器）：
```javascript
const apiUrl = `https://${CONFIG.ENV_ID}.service.tcloudbase.com/${name}`;
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action, jwtToken: token, ...data })
});
```

**修改后**（无需 HTTP 触发器）：
```javascript
const app = cloudbase.init({ env: CONFIG.ENV_ID });
const res = await app.callFunction({
  name: name,
  data: { action, jwtToken: token, ...data }
});
```

### 2. 优势对比

| 特性 | HTTP API | CloudBase SDK |
|------|----------|---------------|
| 需要 HTTP 触发器 | ✅ 必须配置 | ❌ 不需要 |
| 与小程序端一致 | ❌ 不同 | ✅ 完全一致 |
| 配置复杂度 | 🔴 高（需要为每个函数配置） | 🟢 低（零配置） |
| 维护成本 | 🔴 高 | 🟢 低 |
| 性能 | 🟡 一般 | 🟢 更好（直接调用） |
| 鉴权方式 | 手动传 JWT Token | 支持 SDK 自动鉴权 + JWT Token |

### 3. 修改文件
- ✅ `admin/assets/js/admin-api.js` - 核心 API 调用类
  - 添加 CloudBase SDK 初始化逻辑
  - 使用 `app.callFunction()` 替代 `fetch()`
  - 保持 JWT Token 鉴权不变

## 🔍 技术细节

### CloudBase SDK 初始化
```javascript
static app = null;

static init() {
  if (!this.app) {
    this.app = window.cloudbase.init({
      env: CONFIG.ENV_ID
    });
    console.log('✅ CloudBase SDK 初始化成功');
  }
  return this.app;
}
```

### 云函数调用
```javascript
static async call(name, action, data = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  
  if (!token && action !== 'login') {
    throw new Error('未登录，请先登录');
  }

  try {
    // 初始化 SDK
    this.init();

    // 调用云函数
    const res = await this.app.callFunction({
      name: name,
      data: {
        action,
        jwtToken: token,  // 管理端使用 JWT Token 鉴权
        ...data
      }
    });

    // 处理返回结果
    if (!res.result) {
      throw new Error('云函数返回结果为空');
    }

    const result = res.result;

    if (!result.success) {
      if (result.code === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error('登录已过期');
      }
      throw new Error(result.message || '请求失败');
    }

    return result.data;
  } catch (error) {
    console.error(`[${name}.${action}] 调用失败:`, error);
    throw error;
  }
}
```

## 📊 预期效果

修复后，所有接口应该可以正常调用：
- ✅ user 模块：4个接口全部恢复
- ✅ order 模块：4个接口全部恢复
- ✅ course 模块：20个接口全部恢复
- ✅ ambassador 模块：15个接口全部恢复
- ✅ system 模块：21个接口继续正常

**预期通过率：≥ 85%**（部分接口需要真实数据）

## 🚀 下一步

1. **刷新浏览器缓存**：确保加载新的 admin-api.js
2. **重新运行测试**：打开 `api-test-full.html`
3. **查看测试结果**：对比修复前后的差异
4. **处理剩余问题**：修复参数错误和逻辑错误的接口

## 📌 注意事项

### 1. 浏览器缓存
修改 JS 文件后，务必**硬刷新**浏览器：
- Windows: `Ctrl + F5` 或 `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 2. SDK 加载顺序
确保 HTML 中的脚本加载顺序正确：
```html
<!-- 1. CloudBase SDK（必须最先加载）-->
<script src="./assets/libs/tcb.js"></script>

<!-- 2. 配置文件 -->
<script src="./assets/js/config.js"></script>

<!-- 3. API 工具类 -->
<script src="./assets/js/admin-api.js"></script>
```

### 3. 兼容性
CloudBase Web SDK 支持所有现代浏览器：
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## 🔗 相关文档

- [CloudBase Web SDK 文档](https://docs.cloudbase.net/api-reference/webv2/initialization)
- [callFunction 方法](https://docs.cloudbase.net/api-reference/webv2/functions)
- [云函数开发指南](https://docs.cloudbase.net/cloud-function/introduction)

---

**修复时间**：2026-02-13  
**修复人**：AI Assistant  
**影响范围**：管理后台所有 API 调用




