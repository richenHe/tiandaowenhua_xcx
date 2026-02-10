# Order 云函数模块

**版本**: V1.0
**更新时间**: 2026-02-10
**运行时**: Nodejs18.15

---

## 📋 模块概述

Order 云函数模块负责处理订单相关的所有业务逻辑，包括：
- 订单创建（课程购买、复训费、大使升级）
- 微信支付集成
- 功德分商城兑换
- 提现审核
- 订单管理

---

## 🔧 配置说明

### 1. 环境变量配置

在 `cloudfunction.json` 中已配置以下环境变量：

```json
{
  "envVariables": {
    "MYSQL_HOST": "gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com",
    "MYSQL_PORT": "22483",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "",
    "MYSQL_DATABASE": "tiandao_db",
    "WECHAT_APPID": "wx26753b179de5c25c",
    "WECHAT_APP_SECRET": "1cb66fd3f66540f6d003fbcb77695e7a",
    "MCH_ID": "1710089873",
    "MCH_KEY": "e6f4c2a8b1d5973820fedcba56789012",
    "MCH_API_V3_KEY": "Kj8mP2nQ5rT9wX3yZ6aB4cD7eF0gH1iL"
  }
}
```

### 2. 层（Layers）配置

已配置以下两个层：

```json
{
  "layers": [
    {
      "name": "common_cloud1-0gnn3mn17b581124",
      "version": "v2"
    },
    {
      "name": "business-logic_cloud1-0gnn3mn17b581124",
      "version": "v1"
    }
  ]
}
```

### 3. OpenAPI 权限配置

已配置以下微信 API 权限：

```json
{
  "permissions": {
    "openapi": [
      "wxpay.unifiedOrder",
      "wxpay.refund",
      "wxpay.queryOrder",
      "subscribeMessage.send"
    ]
  }
}
```

---

## 📦 依赖说明

### package.json

```json
{
  "name": "order",
  "version": "1.0.0",
  "description": "订单模块云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest",
    "@cloudbase/node-sdk": "latest",
    "jsonwebtoken": "^9.0.3"
  }
}
```

---

## 🚀 使用的 SDK 功能

### 1. Common 层 SDK

从 `common` 层引用以下功能：

```javascript
const { response, checkClientAuth, checkAdminAuth } = require('common');
const { findOne, insert, update, query, db } = require('common/db');
const { getPagination } = require('common/utils');
```

**主要功能**：
- `response`: 统一响应格式（success/error/paramError/notFound/forbidden）
- `checkClientAuth`: 客户端用户鉴权
- `checkAdminAuth`: 管理员鉴权
- `findOne/insert/update/query`: 数据库操作
- `getPagination`: 分页参数处理

### 2. Business-Logic 层 SDK

从 `business-logic` 层引用以下功能：

```javascript
const business = require('business-logic');
business.init(cloud); // 必须初始化
```

**主要功能**：

#### 支付相关
```javascript
// 创建微信支付
const payParams = await business.payment.createWechatPayment({
  orderNo: 'ORD202602100001',
  amount: 1688.00,
  description: '初探班课程'
}, openid);

// 验证支付回调
const paymentResult = business.payment.verifyPaymentCallback(event);

// 处理退款
const refundResult = await business.payment.processRefund(
  orderNo,
  refundAmount,
  totalAmount,
  reason
);
```

#### 工具函数
```javascript
// 生成订单号
const orderNo = business.utils.generateOrderNo('ORD');
const exchangeNo = business.utils.generateOrderNo('EX');
```

---

## 📂 目录结构

```
order/
├── index.js                          # 主入口文件
├── package.json                      # 依赖配置
├── cloudfunction.json                # 云函数配置（层+环境变量+权限）
├── API文档.md                        # 接口文档
├── README.md                         # 本文件
└── handlers/                         # 处理器目录
    ├── public/                       # 公开接口
    │   └── paymentCallback.js        # 支付回调
    ├── client/                       # 客户端接口
    │   ├── create.js                 # 创建订单
    │   ├── createPayment.js          # 发起支付
    │   ├── getDetail.js              # 订单详情
    │   ├── getList.js                # 订单列表
    │   ├── cancel.js                 # 取消订单
    │   ├── getMallGoods.js           # 商城商品列表
    │   ├── exchangeGoods.js          # 功德分兑换
    │   └── getExchangeRecords.js     # 兑换记录
    └── admin/                        # 管理端接口
        ├── getOrderList.js           # 订单列表（管理端）
        ├── getOrderDetail.js         # 订单详情（管理端）
        ├── refund.js                 # 订单退款
        └── withdrawAudit.js          # 提现审核
```

---

## 🔄 业务流程

### 1. 订单创建流程

```
用户下单 → 验证资料 → 验证业务规则 → 生成订单号 → 插入订单记录 → 返回订单信息
```

**涉及的处理器**：
- `handlers/client/create.js`

**使用的 SDK**：
- `business.utils.generateOrderNo()` - 生成订单号
- `common/db` - 数据库操作

### 2. 支付流程

```
创建订单 → 发起支付 → 微信支付 → 支付回调 → 更新订单状态 → 发放奖励
```

**涉及的处理器**：
- `handlers/client/createPayment.js` - 发起支付
- `handlers/public/paymentCallback.js` - 支付回调

**使用的 SDK**：
- `business.payment.createWechatPayment()` - 创建微信支付
- `business.payment.verifyPaymentCallback()` - 验证支付回调

### 3. 退款流程

```
管理员发起退款 → 调用微信退款 API → 更新订单状态 → 回退业务逻辑
```

**涉及的处理器**：
- `handlers/admin/refund.js`

**使用的 SDK**：
- `business.payment.processRefund()` - 处理退款

### 4. 功德分兑换流程

```
选择商品 → 验证库存 → 计算混合支付 → 扣除功德分/积分 → 更新库存 → 创建兑换记录
```

**涉及的处理器**：
- `handlers/client/exchangeGoods.js`

**使用的 SDK**：
- `business.utils.generateOrderNo('EX')` - 生成兑换单号
- `common/db` - 数据库事务操作

---

## ⚠️ 重要注意事项

### 1. 初始化顺序

必须按照以下顺序初始化：

```javascript
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const business = require('business-logic');
business.init(cloud); // ⚠️ 必须在 cloud.init() 之后
```

### 2. 引用路径

所有处理器文件必须使用以下引用方式：

```javascript
// ✅ 正确
const { response } = require('common');
const { findOne } = require('common/db');
const business = require('business-logic');

// ❌ 错误
const { response } = require('../../common');
const { findOne } = require('../../common/db');
const business = require('../../business-logic');
```

### 3. 支付回调幂等性

支付回调处理器已实现幂等性检查：

```javascript
// 检查订单是否已支付
if (order.pay_status === 1) {
  console.log(`订单已支付，跳过处理`);
  return response.success(null, '订单已支付');
}
```

### 4. 混合支付逻辑

功德分兑换支持混合支付：

```javascript
if (user.merit_points >= totalCost) {
  // 功德分足够，全部使用功德分
  merit_points_used = totalCost;
  cash_points_used = 0;
} else if (use_cash_points_if_not_enough) {
  // 功德分不足，使用积分补充
  merit_points_used = user.merit_points;
  cash_points_used = totalCost - merit_points_used;
}
```

---

## 📊 数据库表关系

### 主要操作表

- `orders` - 订单表
- `courses` - 课程表
- `user_courses` - 用户课程表
- `mall_goods` - 商城商品表
- `mall_exchange_records` - 兑换记录表
- `merit_points_records` - 功德分明细表
- `cash_points_records` - 积分明细表
- `withdrawals` - 提现记录表
- `class_records` - 上课记录表
- `appointments` - 预约记录表
- `ambassador_level_configs` - 大使等级配置表

---

## 🧪 测试建议

### 1. 订单创建测试

```javascript
wx.cloud.callFunction({
  name: 'order',
  data: {
    action: 'create',
    order_type: 1,
    item_id: 1
  }
})
```

### 2. 支付测试

```javascript
wx.cloud.callFunction({
  name: 'order',
  data: {
    action: 'createPayment',
    order_no: 'ORD202602100001'
  }
})
```

### 3. 功德分兑换测试

```javascript
wx.cloud.callFunction({
  name: 'order',
  data: {
    action: 'exchangeGoods',
    goods_id: 1,
    quantity: 1,
    use_cash_points_if_not_enough: true
  }
})
```

---

## 📝 更新日志

### V1.0 (2026-02-10)

- ✅ 完成 13 个接口开发
- ✅ 配置环境变量和层
- ✅ 集成 business-logic SDK
- ✅ 实现支付、退款、兑换等核心功能
- ✅ 统一引用路径为 `common` 和 `business-logic`

---

## 📞 技术支持

如有问题，请参考：
- [API 文档](./API文档.md)
- [Common 层文档](../layers/common/README.md)
- [Business-Logic 层文档](../layers/business-logic/README.md)
- [云函数标准部署规范](../云函数标准部署规范.md)

---

**维护者**: 开发团队
**最后更新**: 2026-02-10
