# Callbacks HTTP 云函数 API 文档

**版本**: V1.0
**类型**: HTTP 云函数
**回调接口数**: 3个
**更新时间**: 2026-02-10

---

## 📋 接口清单

| 回调类型 | URL 路径 | HTTP 方法 | 说明 |
|---------|---------|----------|------|
| 微信消息推送 | `/callbacks/message-push` | GET/POST | 接入验证 + 订阅消息事件接收 |
| 微信支付回调 | `/callbacks/payment` | POST | 支付结果通知 |
| 微信退款回调 | `/callbacks/refund` | POST | 退款结果通知 |

---

## 🔵 微信消息推送回调

### 接口信息

- **路径**: `/callbacks/message-push`
- **方法**: `GET`（接入验证）、`POST`（消息接收）
- **权限**: 公开（需验签）

### GET 请求：接入验证

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| signature | string | 是 | 微信加密签名 |
| timestamp | string | 是 | 时间戳 |
| nonce | string | 是 | 随机数 |
| echostr | string | 是 | 随机字符串 |

**验证逻辑**:

1. 将 `token`、`timestamp`、`nonce` 三个参数进行字典序排序
2. 将三个参数字符串拼接成一个字符串进行 SHA1 加密
3. 将加密后的字符串与 `signature` 对比，相同则验证通过

**响应**:

- 验证成功：返回 `echostr` 参数值（原样返回）
- 验证失败：返回 403 Forbidden

**示例**:

```bash
# 微信服务器发送的验证请求
GET /callbacks/message-push?signature=xxx&timestamp=123&nonce=456&echostr=test

# 验证成功响应
HTTP/1.1 200 OK
Content-Type: text/plain

test
```

### POST 请求：消息接收

**请求体**: JSON 格式的微信消息

**支持的事件类型**:

#### 1. 订阅消息发送事件 (`subscribe_msg_sent_event`)

**消息结构**:

```json
{
  "ToUserName": "gh_xxxxxxxxxxxx",
  "FromUserName": "oMgHVjngRipVsoxxx",
  "CreateTime": 1707123456,
  "MsgType": "event",
  "Event": "subscribe_msg_sent_event",
  "SubscribeMsgSentEvent": {
    "List": [
      {
        "TemplateId": "xxx",
        "MsgId": "123456",
        "ErrorCode": 0,
        "ErrorStatus": "success"
      }
    ]
  }
}
```

**处理逻辑**:

- 记录消息发送结果到 `notification_logs` 表
- 更新消息发送状态

#### 2. 用户拒绝订阅事件 (`subscribe_msg_popup_event`)

**消息结构**:

```json
{
  "ToUserName": "gh_xxxxxxxxxxxx",
  "FromUserName": "oMgHVjngRipVsoxxx",
  "CreateTime": 1707123456,
  "MsgType": "event",
  "Event": "subscribe_msg_popup_event",
  "SubscribeMsgPopupEvent": {
    "List": [
      {
        "TemplateId": "xxx",
        "SubscribeStatusString": "reject",
        "PopupScene": "0"
      }
    ]
  }
}
```

**处理逻辑**:

- 记录用户订阅偏好到 `notification_configs` 表
- 更新用户的订阅状态

**响应**:

- 必须返回字符串 `"success"`（微信要求）
- 即使处理失败也返回 `"success"`，避免微信重复推送

**示例**:

```bash
# 微信服务器推送的消息
POST /callbacks/message-push
Content-Type: application/json

{
  "MsgType": "event",
  "Event": "subscribe_msg_sent_event",
  ...
}

# 响应
HTTP/1.1 200 OK
Content-Type: text/plain

success
```

---

## 🔵 微信支付回调

### 接口信息

- **路径**: `/callbacks/payment`
- **方法**: `POST`
- **权限**: 公开（需验签）
- **数据格式**: XML

### 请求体

**XML 格式的支付结果通知**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
  <appid><![CDATA[wx1234567890]]></appid>
  <mch_id><![CDATA[1234567890]]></mch_id>
  <nonce_str><![CDATA[5K8264ILTKCH16CQ2502SI8ZNMTM67VS]]></nonce_str>
  <sign><![CDATA[C380BEC2BFD727A4B6845133519F3AD6]]></sign>
  <result_code><![CDATA[SUCCESS]]></result_code>
  <openid><![CDATA[oUpF8uMuAJO_M2pxb1Q9zNjWeS6o]]></openid>
  <trade_type><![CDATA[JSAPI]]></trade_type>
  <bank_type><![CDATA[CMC]]></bank_type>
  <total_fee>1</total_fee>
  <cash_fee>1</cash_fee>
  <transaction_id><![CDATA[4200001234567890]]></transaction_id>
  <out_trade_no><![CDATA[ORD202602100001]]></out_trade_no>
  <time_end><![CDATA[20260210143025]]></time_end>
</xml>
```

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| return_code | string | 通信标识：SUCCESS/FAIL |
| result_code | string | 业务结果：SUCCESS/FAIL |
| out_trade_no | string | 商户订单号 |
| transaction_id | string | 微信支付订单号 |
| total_fee | int | 订单金额（分） |
| openid | string | 用户标识 |
| time_end | string | 支付完成时间（yyyyMMddHHmmss） |
| sign | string | 签名 |

### 处理流程

1. **解析 XML 数据**
2. **验证签名**（使用商户密钥 `MCH_KEY`）
3. **检查通信标识**（`return_code`）
4. **检查业务结果**（`result_code`）
5. **更新订单状态**：
   - 更新 `orders` 表：`pay_status = 1`
   - 记录支付时间和微信订单号
6. **生成用户课程记录**（如果是课程订单）
7. **发放推荐人奖励**（如果有推荐人）
8. **发送支付成功通知**

### 响应格式

**成功响应**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>
```

**失败响应**:

```xml
<xml>
  <return_code><![CDATA[FAIL]]></return_code>
  <return_msg><![CDATA[签名验证失败]]></return_msg>
</xml>
```

### 签名验证算法

1. 提取所有参数（除 `sign` 字段）
2. 按参数名 ASCII 字典序排序
3. 拼接参数：`key1=value1&key2=value2&...&key=商户密钥`
4. MD5 加密并转大写
5. 与 `sign` 字段对比

---

## 🔵 微信退款回调

### 接口信息

- **路径**: `/callbacks/refund`
- **方法**: `POST`
- **权限**: 公开（需解密）
- **数据格式**: XML（加密）

### 请求体

**XML 格式的退款结果通知**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
  <appid><![CDATA[wx1234567890]]></appid>
  <mch_id><![CDATA[1234567890]]></mch_id>
  <nonce_str><![CDATA[5K8264ILTKCH16CQ2502SI8ZNMTM67VS]]></nonce_str>
  <req_info><![CDATA[加密的退款信息]]></req_info>
</xml>
```

### 解密退款信息

**加密方式**: AES-256-ECB

**密钥生成**: `MD5(商户密钥)`

**解密后的数据结构**:

```xml
<root>
  <out_trade_no><![CDATA[ORD202602100001]]></out_trade_no>
  <out_refund_no><![CDATA[REFUND202602100001]]></out_refund_no>
  <refund_id><![CDATA[50000001234567890]]></refund_id>
  <refund_status><![CDATA[SUCCESS]]></refund_status>
  <settlement_refund_fee>100</settlement_refund_fee>
  <success_time><![CDATA[2026-02-10 14:30:25]]></success_time>
</root>
```

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| out_trade_no | string | 商户订单号 |
| out_refund_no | string | 商户退款单号 |
| refund_id | string | 微信退款单号 |
| refund_status | string | 退款状态：SUCCESS/FAIL |
| settlement_refund_fee | int | 退款金额（分） |
| success_time | string | 退款成功时间 |

### 处理流程

#### 退款成功 (`refund_status = SUCCESS`)

1. **更新订单状态**：
   - 更新 `orders` 表：`refund_status = 1`
   - 记录退款时间和退款金额
2. **删除用户课程记录**（如果是课程订单）
3. **回退推荐人奖励**：
   - 扣减推荐人的 `cash_points_available`
   - 记录积分变动到 `cash_points_records`
4. **发送退款成功通知**

#### 退款失败 (`refund_status = FAIL`)

1. **更新订单状态**：
   - 更新 `orders` 表：`refund_status = 2`（失败）

### 响应格式

**成功响应**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>
```

**失败响应**:

```xml
<xml>
  <return_code><![CDATA[FAIL]]></return_code>
  <return_msg><![CDATA[解密失败]]></return_msg>
</xml>
```

---

## 🔧 环境变量配置

| 变量名 | 说明 | 示例值 | 必填 |
|--------|------|--------|------|
| `WECHAT_TOKEN` | 微信消息推送验证 Token | `tiandao_wechat_2026` | 是 |
| `MCH_KEY` | 微信商户 API 密钥 | `e6f4c2a8b1d5973820fedcba56789012` | 是（支付/退款） |

---

## 🔐 安全注意事项

### 1. 签名验证

- ✅ 所有回调接口必须验证签名/解密
- ✅ 防止恶意请求和数据篡改

### 2. 防重放攻击

- ✅ 检查订单状态，避免重复处理
- ✅ 记录 `MsgId` 或 `transaction_id`

### 3. HTTPS 加密

- ✅ 回调地址必须使用 HTTPS 协议
- ✅ 确保数据传输安全

### 4. 敏感信息保护

- ✅ Token、密钥存储在环境变量中
- ✅ 不在代码中硬编码敏感信息

### 5. 快速响应

- ✅ 5秒内返回响应，避免微信重复推送
- ✅ 异步处理复杂业务逻辑

### 6. 幂等性

- ✅ 确保重复推送不会导致数据异常
- ✅ 检查订单状态后再执行业务逻辑

---

## 📝 第三方平台配置

### 微信公众平台配置（消息推送）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **开发 → 开发设置 → 消息推送配置**
3. 配置参数：
   - **服务器地址**: `https://your-domain.com/callbacks/message-push`
   - **Token**: `tiandao_wechat_2026`
   - **EncodingAESKey**: 随机生成（可选）
   - **消息加密方式**: 明文模式（或安全模式）
4. 点击 **提交** 完成验证

### 微信商户平台配置（支付/退款回调）

1. 登录 [微信商户平台](https://pay.weixin.qq.com/)
2. 进入 **产品中心 → 开发配置**
3. 配置参数：
   - **支付结果通知URL**: `https://your-domain.com/callbacks/payment`
   - **退款结果通知URL**: `https://your-domain.com/callbacks/refund`
4. 保存配置

---

## 🧪 测试验证

### 测试消息推送接入验证

```bash
curl "https://your-domain.com/callbacks/message-push?signature=xxx&timestamp=123&nonce=456&echostr=test"

# 预期返回：test
```

### 测试订阅消息回调

```bash
curl -X POST "https://your-domain.com/callbacks/message-push" \
  -H "Content-Type: application/json" \
  -d '{
    "MsgType": "event",
    "Event": "subscribe_msg_sent_event",
    "SubscribeMsgSentEvent": {
      "List": [{
        "TemplateId": "xxx",
        "MsgId": "123456",
        "ErrorCode": 0,
        "ErrorStatus": "success"
      }]
    }
  }'

# 预期返回：success
```

### 查看云函数日志

访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb/scf/detail?id=callbacks) 查看日志。

---

## ❌ 错误码

| 状态码 | 说明 | 原因 |
|--------|------|------|
| 200 | 成功 | 请求处理成功 |
| 400 | 参数错误 | 缺少必要参数 |
| 403 | 验证失败 | 签名验证失败 |
| 404 | 路径不存在 | 未匹配的回调路径 |
| 405 | 方法不允许 | HTTP 方法错误 |
| 500 | 服务器错误 | 内部处理失败 |

---

## 📌 注意事项

### 1. 响应格式要求

- **消息推送回调**: 必须返回字符串 `"success"`
- **支付/退款回调**: 必须返回 XML 格式响应

### 2. 超时处理

- 微信服务器超时时间为 **5秒**
- 超时会触发重复推送（最多 3 次）
- 建议异步处理复杂业务逻辑

### 3. 重复推送处理

- 检查订单状态，避免重复处理
- 使用数据库事务确保数据一致性

### 4. 日志记录

- 记录所有回调请求和处理结果
- 便于问题排查和数据追溯

### 5. 开发调试

- 使用内网穿透工具（如 ngrok）进行本地调试
- 或使用微信提供的测试工具

---

## 🔗 相关文档

- [微信消息推送文档](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html)
- [微信支付回调文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7)
- [微信退款回调文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_16&index=10)
- [CloudBase HTTP 云函数文档](https://docs.cloudbase.net/cloud-function/develop/how-to-writing-functions-code)
