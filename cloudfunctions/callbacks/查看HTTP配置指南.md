# 查看 callbacks HTTP 访问配置指南

## ⚠️ 重要说明

在 CloudBase 中，**HTTP 云函数 = 普通云函数 + HTTP 访问服务绑定**

- 在 **云函数列表** 中显示"普通触发"是正常的
- HTTP 配置需要在 **"访问服务"** 页面查看

## 🔍 查看 HTTP 访问配置的步骤

### 方法1：直接访问 HTTP 访问服务页面

1. **打开访问服务页面**
   ```
   https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/http
   ```

2. **查看 callbacks 的 HTTP 路径配置**
   - 在"访问服务"列表中找到 callbacks 相关的配置
   - 应该可以看到绑定的路径: `/callbacks`

### 方法2：通过云函数详情页查看

1. **打开 callbacks 云函数详情**
   ```
   https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/detail?id=callbacks&NameSpace=cloud1-0gnn3mn17b581124
   ```

2. **查看 HTTP 访问服务配置**
   - 在函数详情页面，找到"HTTP 访问服务"部分
   - 查看已绑定的 HTTP 路径

## 📊 已配置的 HTTP 访问地址

### 基础访问路径
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks
```

### 实际回调路径
根据云函数内部路由，支持以下三个回调路径：

1. **微信消息推送**: `/callbacks/message-push`
2. **微信支付回调**: `/callbacks/payment`
3. **微信退款回调**: `/callbacks/refund`

## 🧪 验证 HTTP 访问是否生效

### 测试基础路径（浏览器访问）
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks
```

预期返回：路由错误提示（因为没有指定具体回调类型）

### 测试消息推送路径（浏览器访问）
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks/message-push
```

预期返回：接入验证相关信息

## ⏱️ 生效时间

- **HTTP 访问服务配置**：通常需要 3-5 分钟生效
- **CDN 缓存**：可能需要几分钟才能完全生效
- **建议**：配置完成后等待 5 分钟再测试

## 🔄 如果看不到 HTTP 配置

1. **刷新浏览器页面**
2. **清除浏览器缓存**
3. **等待 5 分钟后再查看**
4. **检查访问服务页面是否有错误提示**

## 📝 区别说明

### 云函数列表显示
- **触发方式**: 显示为"普通触发"（这是正常的）
- **原因**: CloudBase 不区分"HTTP 函数"和"普通函数"，都是普通云函数
- **HTTP 能力**: 通过"访问服务"绑定路径后获得

### 访问服务页面显示
- **显示内容**: HTTP 路径绑定信息
- **域名**: 默认域名或自定义域名
- **路径**: `/callbacks`
- **关联资源**: callbacks 云函数

## 🎯 总结

✅ **callbacks 已经是 HTTP 云函数了！**

- 云函数本身已创建：✅
- HTTP 路径已绑定：✅（通过 createFunctionHTTPAccess）
- 访问地址可用：✅（等待 5 分钟生效）

**在云函数列表中看到"普通触发"是正常的**，这不影响 HTTP 访问功能！

HTTP 访问功能由"访问服务"提供，而不是云函数本身的触发器类型。




