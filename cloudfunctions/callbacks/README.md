# Callbacks HTTP 云函数

> **统一回调处理云函数** - 处理微信消息推送、支付回调、退款回调

**版本**: V1.0
**类型**: HTTP 云函数
**回调接口数**: 3个
**更新时间**: 2026-02-10

---

## 📋 功能概述

本云函数采用 **HTTP 云函数** 模式，统一处理第三方平台的回调接口：

| 回调类型 | URL 路径 | 说明 |
|---------|---------|------|
| 微信消息推送 | `/callbacks/message-push` | 接入验证 + 订阅消息事件 |
| 微信支付回调 | `/callbacks/payment` | 支付结果通知 |
| 微信退款回调 | `/callbacks/refund` | 退款结果通知 |

---

## 🏗️ 目录结构

```
callbacks/
├── index.js                    # HTTP 云函数主入口（路由分发）
├── package.json                # 依赖配置
├── cloudfunction.json          # 云函数配置
├── scf_bootstrap               # 启动脚本
├── common/                     # 公共模块（数据库、权限、响应）
├── business-logic/             # 业务逻辑层（支付、通知、订单）
├── handlers/                   # 回调处理器
│   ├── message-push.js         # 微信消息推送
│   ├── payment.js              # 微信支付
│   └── refund.js               # 微信退款
├── API文档.md                  # 完整接口文档
├── 开发报告.md                 # 开发总结报告
└── README.md                   # 本文档
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd cloudfunctions/callbacks
npm install
```

### 2. 配置环境变量

在 `cloudfunction.json` 中配置：

```json
{
  "envVariables": {
    "WECHAT_TOKEN": "tiandao_wechat_2026",
    "MCH_KEY": "your-mch-key"
  }
}
```

### 3. 部署云函数

```javascript
// 使用 MCP 工具部署
mcp_cloudbase_createFunction({
  name: "callbacks",
  runtime: "Nodejs18.15",
  functionRootPath: "d:\\project\\cursor\\work\\xcx\\cloudfunctions"
})
```

### 4. 配置第三方平台

**微信公众平台**（消息推送）：
- 服务器地址：`https://your-domain.com/callbacks/message-push`
- Token：`tiandao_wechat_2026`

**微信商户平台**（支付/退款）：
- 支付回调：`https://your-domain.com/callbacks/payment`
- 退款回调：`https://your-domain.com/callbacks/refund`

---

## 🔑 核心功能

### 1. 微信消息推送回调

**功能**：
- ✅ GET 请求：接入验证（SHA1 签名）
- ✅ POST 请求：订阅消息事件接收

**处理事件**：
- `subscribe_msg_sent_event` - 消息发送成功
- `subscribe_msg_popup_event` - 用户拒绝订阅

### 2. 微信支付回调

**功能**：
- ✅ XML 解析
- ✅ MD5 签名验证
- ✅ 订单状态更新
- ✅ 异步业务逻辑处理

**订单类型处理**：
- **order_type=1**（课程购买）
  - 创建用户课程记录
  - 密训班自动赠送初探班
  - 首次购买锁定推荐人
  - 发放推荐人奖励（功德分+冻结积分）

- **order_type=2**（复训费支付）
  - 创建预约记录
  - 更新课程预约人数
  - 不发放推荐人奖励

- **order_type=4**（大使升级）
  - 更新用户等级
  - 发放初探班/密训班名额
  - 发放冻结积分

### 3. 微信退款回调

**功能**：
- ✅ AES-256-ECB 解密
- ✅ 订单退款状态更新
- ✅ 课程记录删除
- ✅ 推荐人奖励回退
- ✅ 退款成功通知

---

## 🔐 安全措施

| 安全措施 | 说明 |
|---------|------|
| ✅ 签名验证 | 所有回调接口验证签名/解密 |
| ✅ 防重放攻击 | 检查订单状态，避免重复处理 |
| ✅ HTTPS 加密 | 回调地址使用 HTTPS 协议 |
| ✅ 敏感信息保护 | Token、密钥存储在环境变量 |
| ✅ 快速响应 | 5秒内返回，避免重复推送 |
| ✅ 幂等性保证 | 重复推送不会导致数据异常 |

---

## 📦 依赖说明

```json
{
  "dependencies": {
    "wx-server-sdk": "latest",
    "@cloudbase/node-sdk": "latest",
    "xml2js": "^0.6.2"
  }
}
```

- `wx-server-sdk` - 微信云开发 SDK
- `@cloudbase/node-sdk` - CloudBase Node SDK（数据库）
- `xml2js` - XML 解析库（支付/退款）

---

## 🧪 测试验证

### 本地测试

```bash
# 启动函数
./scf_bootstrap

# 测试接入验证
curl "http://localhost:9000/callbacks/message-push?signature=xxx&timestamp=123&nonce=456&echostr=test"
```

### 云端测试

1. 部署云函数到 CloudBase
2. 配置微信平台回调地址
3. 触发实际回调事件
4. 查看云函数日志

---

## 📝 相关文档

- [API文档.md](./API文档.md) - 完整的接口文档
- [开发报告.md](./开发报告.md) - 开发总结报告
- [支付回调测试指南.md](./支付回调测试指南.md) - 支付业务逻辑测试文档
- [云函数标准部署规范](../云函数标准部署规范.md) - 部署规范

---

## 💡 业务逻辑说明

### 推荐人奖励机制

**奖励计算**：
- 所有比例从 `ambassador_level_configs` 表读取
- 功德分：立即到账
- 积分：发放到冻结余额，首次上课时解冻

**解冻机制**：
- 触发时机：推荐的学员首次上课签到
- 解冻金额：从配置表 `unfreeze_per_referral` 读取
- 实现位置：`course/handlers/client/checkin.js`

**配置字段**：
```sql
merit_rate_basic        -- 推荐初探班功德分比例
merit_rate_advanced     -- 推荐密训班功德分比例
cash_rate_basic         -- 推荐初探班积分比例
cash_rate_advanced      -- 推荐密训班积分比例
unfreeze_per_referral   -- 每次解冻金额
can_earn_reward         -- 是否可获得奖励
```

### 异步处理机制

**为什么使用异步**：
1. 快速响应微信（< 2秒）
2. 避免超时导致重复回调
3. 提升用户体验

**实现方式**：
```javascript
// 1. 立即更新订单状态
await updateOrderStatus(orderNo);

// 2. 返回成功响应给微信
return buildXMLResponse('SUCCESS', 'OK');

// 3. 异步处理业务逻辑
setImmediate(async () => {
  await processOrderBusiness(order);
});
```

---

## ⚠️ 注意事项

### 1. 响应格式要求

- **消息推送**：必须返回字符串 `"success"`
- **支付/退款**：必须返回 XML 格式

### 2. 超时处理

- 微信服务器超时时间为 **5秒**
- 超时会触发重复推送（最多 3 次）

### 3. 环境变量配置

- `WECHAT_TOKEN` - 必填
- `MCH_KEY` - 支付/退款功能必填

### 4. 公共模块同步

- 使用前必须同步 `common/` 和 `business-logic/`
- 执行：`.\同步公共模块.ps1`

---

## 🔗 外部链接

- [微信消息推送文档](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html)
- [微信支付回调文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7)
- [微信退款回调文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_16&index=10)
- [CloudBase HTTP 云函数文档](https://docs.cloudbase.net/cloud-function/develop/how-to-writing-functions-code)

---

**开发完成**: 2026-02-10
**状态**: ✅ 已完成
**准备部署**: ✅ 是
