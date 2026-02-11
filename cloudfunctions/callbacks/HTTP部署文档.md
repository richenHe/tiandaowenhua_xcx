# Callbacks HTTP 云函数部署文档

## 部署信息

- **云函数名称**: `callbacks`
- **云函数类型**: HTTP 云函数
- **运行时**: Nodejs18.15
- **环境ID**: cloud1-0gnn3mn17b581124
- **Region**: ap-shanghai
- **部署时间**: 2026-02-10

## HTTP 访问地址

### 基础路径
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks
```

### 微信回调地址

#### 1. 微信消息推送回调
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks/message-push
```

**用途**: 接收微信消息推送通知
- **GET 请求**: 接入验证（SHA1 签名校验）
- **POST 请求**: 订阅消息事件处理

**配置位置**: 微信公众平台 → 开发 → 开发设置 → 服务器配置
- **URL**: 上述消息推送回调地址
- **Token**: `tiandao_wechat_2026`（环境变量 WECHAT_TOKEN）

#### 2. 微信支付回调
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks/payment
```

**用途**: 接收微信支付成功通知
- **XML 格式**: 解析支付结果
- **MD5 签名验证**: 确保回调安全性
- **自动处理**:
  - 更新订单状态为已支付
  - 生成用户课程记录
  - 处理推荐人奖励
  - 发送支付成功通知

**配置位置**: 微信支付商户平台 → 产品中心 → 开发配置 → 支付通知 URL

#### 3. 微信退款回调
```
https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks/refund
```

**用途**: 接收微信退款结果通知
- **AES-256-ECB 解密**: 解密退款信息
- **自动处理**:
  - 更新订单退款状态
  - 软删除用户课程记录
  - 回滚推荐人奖励
  - 发送退款通知

**配置位置**: 微信支付商户平台 → 产品中心 → 开发配置 → 退款通知 URL

## 环境变量配置

| 变量名 | 说明 | 配置状态 |
|--------|------|---------|
| `WECHAT_TOKEN` | 微信服务器配置 Token | ✅ 已配置: tiandao_wechat_2026 |
| `MCH_KEY` | 微信支付商户密钥 | ⚠️ 待配置（需在微信支付商户平台获取） |

### 配置 MCH_KEY
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入 **账户中心** → **API安全** → **API密钥**
3. 复制 32 位商户密钥
4. 在 [CloudBase 控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/detail?id=callbacks&NameSpace=cloud1-0gnn3mn17b581124) 配置环境变量

## 云函数控制台

- **函数列表**: https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf
- **函数详情**: https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/detail?id=callbacks&NameSpace=cloud1-0gnn3mn17b581124
- **HTTP 访问服务**: https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/http

## 路由架构

云函数内部根据 URL 路径自动路由：

```javascript
const { url } = context.httpContext;

if (url.includes('/message-push')) {
  // 处理微信消息推送
  return await messagePushHandler(event, context);
}

if (url.includes('/payment')) {
  // 处理微信支付回调
  return await paymentHandler(event, context);
}

if (url.includes('/refund')) {
  // 处理微信退款回调
  return await refundHandler(event, context);
}
```

## 安全特性

1. **微信消息推送**
   - SHA1 签名验证（Token: tiandao_wechat_2026）
   - 随机字符串 + 时间戳防重放

2. **微信支付回调**
   - MD5 签名验证（使用商户密钥）
   - XML 格式防篡改

3. **微信退款回调**
   - AES-256-ECB 加密数据
   - MD5 签名验证

## 测试验证

### 1. 微信消息推送测试
```bash
# GET 请求测试（接入验证）
curl "https://cloud1-0gnn3mn17b581124.ap-shanghai.app.tcloudbase.com/callbacks/message-push?signature=xxx&timestamp=xxx&nonce=xxx&echostr=test"
```

### 2. 微信支付回调测试（需要微信服务器发送真实回调）
- 在微信支付商户平台创建测试订单
- 完成支付后自动触发回调
- 查看云函数日志验证处理结果

### 3. 微信退款回调测试（需要微信服务器发送真实回调）
- 在微信支付商户平台发起退款
- 退款成功后自动触发回调
- 查看云函数日志验证处理结果

## 日志查看

在 [云函数控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/detail?id=callbacks&NameSpace=cloud1-0gnn3mn17b581124) 查看执行日志：

- 点击 **日志** 标签
- 查看最近执行记录
- 查看错误日志和调试信息

## 更新云函数

### 更新代码
```bash
# 使用 MCP 工具更新
mcp_cloudbase_updateFunctionCode({
  name: "callbacks",
  functionRootPath: "d:\\project\\cursor\\work\\xcx\\cloudfunctions"
})
```

### 更新环境变量
在 [云函数控制台](https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/detail?id=callbacks&NameSpace=cloud1-0gnn3mn17b581124) → **函数配置** → **环境变量** 中更新

## 注意事项

1. **CDN 缓存**: HTTP 访问服务有 CDN 缓存，更新代码后可能需要等待几分钟生效
2. **超时设置**: 当前超时时间为 60 秒，确保足够处理回调逻辑
3. **MCH_KEY 配置**: 必须配置商户密钥才能正常处理支付和退款回调
4. **日志监控**: 建议定期查看日志，确保回调处理正常
5. **错误处理**: 所有错误都会记录在日志中，便于排查问题

## 相关文档

- [README.md](./README.md) - 云函数功能说明
- [API文档.md](./API文档.md) - 接口详细说明
- [开发报告.md](./开发报告.md) - 开发过程记录





