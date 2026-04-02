# Order 云函数 API 文档

**云函数名称**: `order`
**版本**: V1.0
**更新时间**: 2026-02-10
**运行时**: Nodejs18.15

---

## 📋 目录

1. [公开接口](#公开接口)（1个）
2. [客户端接口](#客户端接口)（8个）
3. [管理端接口](#管理端接口)（4个）

---

## 调用方式

### 云函数调用
```javascript
wx.cloud.callFunction({
  name: 'order',
  data: {
    action: 'create',  // 接口名称
    // 其他参数...
  }
})
```

### 通用响应格式
```json
{
  "code": 0,           // 0成功，非0失败
  "message": "成功",
  "data": {}           // 业务数据
}
```

### 常见错误码
- `401`: 未登录或登录态失效
- `403`: 资料未完善（需要完善资料）
- `404`: 资源不存在
- `422`: 参数验证失败
- `500`: 服务器内部错误

---

## 公开接口

### 1. paymentCallback - 支付回调

**Action**: `paymentCallback`
**权限**: 公开（无需登录）
**状态**: ⚠️ 功能开发中

**说明**: 微信支付成功回调，根据不同订单类型执行相应业务逻辑

**请求参数**: 由微信服务器发送

**响应数据**:
```json
{
  "code": 0,
  "message": "支付回调功能开发中",
  "data": {
    "status": "developing",
    "message": "支付回调功能开发中，待配置商户信息后启用"
  }
}
```

**注意**: 待配置微信商户信息后启用

---

## 客户端接口

### 1. create - 创建订单

**Action**: `create`
**权限**: 需要登录
**资料检查**: ✅ 需要完善资料

**说明**: 统一订单创建接口，仅用于涉及真实金钱的交易场景

**适用场景**:
- `order_type=1`: 课程购买（初探班/密训班）
- `order_type=2`: 复训费支付
- `order_type=4`: 需支付的大使升级

**请求参数**:
```json
{
  "action": "create",
  "order_type": 1,           // 必填，1课程/2复训/4升级
  "item_id": 1,              // 必填，项目ID（根据order_type含义不同）
  "class_record_id": 5,      // 可选，上课记录ID（复训专用）
  "referee_id": 100          // 可选，推荐人ID（不传则使用用户资料中的推荐人）
}
```

**参数说明**:
- `order_type=1` 时，`item_id` 为课程ID
- `order_type=2` 时，`item_id` 为用户课程ID，`class_record_id` 必填
- `order_type=4` 时，`item_id` 为目标等级

**响应数据**:
```json
{
  "code": 0,
  "message": "订单创建成功",
  "data": {
    "order_no": "ORD202602100001",
    "order_type": 1,
    "order_name": "初探班",
    "amount": 1688.00,
    "referee_id": 100,
    "referee_uid": "cloud-uid-100",
    "referee_name": "推荐人姓名",
    "referee_level": 2,
    "status": 0,
    "expires_at": "2026-02-10 11:00:00"
  }
}
```

**业务逻辑**:
1. 检查用户资料是否完善（`profile_completed = 1`）
2. 根据 `order_type` 验证不同业务规则
3. 生成订单号（ORD + 年月日 + 10位随机数）
4. 设置30分钟过期时间
5. 返回订单信息

**错误示例**:
```json
{
  "code": 403,
  "message": "请先完善资料",
  "data": {
    "action": "complete_profile",
    "redirect_url": "/pages/auth/complete-profile/index"
  }
}
```

---

### 2. createPayment - 发起支付

**Action**: `createPayment`
**权限**: 需要登录
**状态**: ⚠️ 功能开发中

**说明**: 调用微信支付统一下单，返回支付参数

**请求参数**:
```json
{
  "action": "createPayment",
  "order_no": "ORD202602100001"  // 必填，订单号
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "支付功能开发中",
  "data": {
    "status": "developing",
    "message": "支付功能开发中，待配置商户信息后启用",
    "order_no": "ORD202602100001",
    "amount": 1688.00
  }
}
```

**注意**: 待配置微信商户信息后启用

---

### 3. getDetail - 订单详情

**Action**: `getDetail`
**权限**: 需要登录

**说明**: 查询订单详细信息

**请求参数**:
```json
{
  "action": "getDetail",
  "order_no": "ORD202602100001"  // 必填，订单号
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "order_no": "ORD202602100001",
    "user_id": 1,
    "order_type": 1,
    "order_name": "初探班",
    "original_amount": 1688.00,
    "final_amount": 1688.00,
    "pay_status": 0,
    "pay_status_name": "待支付",
    "pay_time": null,
    "pay_method": null,
    "transaction_id": null,
    "is_reward_granted": false,
    "reward_granted_at": null,
    "created_at": "2026-02-10 10:00:00",
    "expires_at": "2026-02-10 10:30:00",
    "referee_id": 100,
    "referee_uid": "cloud-uid-100",
    "referee_name": "推荐人姓名",
    "referee_level": 2,
    "course_id": 1,
    "course_name": "初探班",
    "course_type": 1
  }
}
```

**支付状态说明**:
- `0`: 待支付
- `1`: 已支付
- `2`: 已取消
- `3`: 已关闭
- `4`: 已退款

---

### 4. getList - 订单列表

**Action**: `getList`
**权限**: 需要登录

**说明**: 查询当前用户的订单列表

**请求参数**:
```json
{
  "action": "getList",
  "status": 1,        // 可选，支付状态筛选（0待支付/1已支付/2已取消/3已关闭/4已退款）
  "page": 1,          // 可选，页码，默认1
  "page_size": 10     // 可选，每页数量，默认10
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 10,
    "list": [
      {
        "order_no": "ORD202602100001",
        "order_type": 1,
        "order_name": "初探班",
        "final_amount": 1688.00,
        "pay_status": 1,
        "pay_status_name": "已支付",
        "pay_time": "2026-02-10 10:30:00",
        "referee_name": "推荐人",
        "is_reward_granted": true,
        "created_at": "2026-02-10 10:00:00",
        "expires_at": "2026-02-10 10:30:00"
      }
    ]
  }
}
```

---

### 5. cancel - 取消订单

**Action**: `cancel`
**权限**: 需要登录

**说明**: 取消待支付订单

**请求参数**:
```json
{
  "action": "cancel",
  "order_no": "ORD202602100001",  // 必填，订单号
  "cancel_reason": "不想买了"      // 可选，取消原因
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "订单已取消",
  "data": {
    "order_no": "ORD202602100001",
    "status": 2,
    "status_name": "已取消"
  }
}
```

**业务规则**:
- 只能取消待支付订单（`pay_status = 0`）
- 已支付、已取消、已关闭的订单不能取消

---

### 6. getMallGoods - 商城商品列表

**Action**: `getMallGoods`
**权限**: 游客可读（不要求 `users` 表已注册，2026-04-02）；兑换类接口仍须登录

**说明**: 查询商城可兑换商品列表

**请求参数**:
```json
{
  "action": "getMallGoods",
  "keyword": "初探班",  // 可选，关键词搜索
  "page": 1,           // 可选，页码，默认1
  "page_size": 10      // 可选，每页数量，默认10
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 10,
    "list": [
      {
        "id": 1,
        "goods_name": "初探班名额券",
        "goods_image": "https://example.com/image.jpg",
        "merit_points_price": 1688.00,
        "stock_quantity": 50,
        "sold_quantity": 20,
        "description": "商品描述",
        "is_unlimited_stock": false,
        "can_exchange": true
      }
    ]
  }
}
```

**字段说明**:
- `stock_quantity = -1`: 无限库存
- `is_unlimited_stock`: 是否无限库存
- `can_exchange`: 是否可兑换（有库存或无限库存）

---

### 7. exchangeGoods - 功德分兑换商品

**Action**: `exchangeGoods`
**权限**: 需要登录
**资料检查**: ✅ 需要完善资料

**说明**: 使用功德分（+积分）兑换商品，直接完成扣除

**重要说明**:
- 不走支付接口，在商城页面直接完成
- 不创建 orders 表记录
- 直接扣除功德分/积分并创建兑换记录

**请求参数**:
```json
{
  "action": "exchangeGoods",
  "goods_id": 1,                          // 必填，商品ID
  "quantity": 1,                          // 可选，数量，默认1
  "use_cash_points_if_not_enough": true   // 可选，功德分不足时是否使用积分补充，默认false
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "兑换成功",
  "data": {
    "exchange_no": "EX202602100001",
    "goods_name": "初探班名额券",
    "quantity": 1,
    "merit_points_used": 1500.00,
    "cash_points_used": 188.00,
    "total_cost": 1688.00,
    "status": "兑换成功",
    "pickup_info": "请凭兑换单号到前台领取"
  }
}
```

**业务逻辑**:
1. 检查用户资料是否完善
2. 验证商品存在且上架
3. 检查库存充足
4. 计算混合支付：
   - 功德分足够：全部使用功德分
   - 功德分不足且允许补充：使用功德分 + 积分
   - 功德分不足且不允许补充：返回错误
5. 事务处理：
   - 扣除功德分和积分
   - 更新商品库存
   - 创建兑换记录
   - 插入功德分/积分明细记录

**错误示例**:
```json
{
  "code": 400,
  "message": "现金积分不足，还需 188 积分"
}
```

---

### 8. getExchangeRecords - 兑换记录列表

**Action**: `getExchangeRecords`
**权限**: 需要登录

**说明**: 查询用户的功德分兑换记录

**请求参数**:
```json
{
  "action": "getExchangeRecords",
  "status": 1,        // 可选，状态筛选（1已兑换/2已领取/3已取消）
  "page": 1,          // 可选，页码，默认1
  "page_size": 10     // 可选，每页数量，默认10
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "total": 5,
    "page": 1,
    "page_size": 10,
    "list": [
      {
        "exchange_no": "EX202602100001",
        "goods_name": "初探班名额券",
        "quantity": 1,
        "merit_points_used": 1500.00,
        "cash_points_used": 188.00,
        "total_cost": 1688.00,
        "status": 1,
        "status_name": "已兑换",
        "created_at": "2026-02-10 10:00:00"
      }
    ]
  }
}
```

**兑换状态说明**:
- `1`: 已兑换
- `2`: 已领取
- `3`: 已取消

---

## 管理端接口

### 1. getOrderList - 订单列表（管理端）

**Action**: `getOrderList`
**权限**: 需要管理员权限

**说明**: 管理员查询所有订单列表

**请求参数**:
```json
{
  "action": "getOrderList",
  "pay_status": 1,              // 可选，支付状态筛选
  "start_date": "2026-02-01",   // 可选，开始日期
  "end_date": "2026-02-28",     // 可选，结束日期
  "keyword": "张三",             // 可选，关键词（用户姓名/手机号/订单号）
  "page": 1,                    // 可选，页码，默认1
  "page_size": 20               // 可选，每页数量，默认20
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "order_no": "ORD202602100001",
        "user_name": "张三",
        "user_phone": "138****8000",
        "order_type": 1,
        "order_name": "初探班",
        "final_amount": 1688.00,
        "pay_status": 1,
        "pay_status_name": "已支付",
        "pay_time": "2026-02-10 10:30:00",
        "referee_name": "推荐人",
        "is_reward_granted": true,
        "created_at": "2026-02-10 10:00:00"
      }
    ]
  }
}
```

---

### 2. getOrderDetail - 订单详情（管理端）

**Action**: `getOrderDetail`
**权限**: 需要管理员权限

**说明**: 管理员查询订单详细信息

**请求参数**:
```json
{
  "action": "getOrderDetail",
  "order_no": "ORD202602100001"  // 必填，订单号
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "order_no": "ORD202602100001",
    "user_id": 1,
    "user_name": "张三",
    "user_phone": "13800138000",
    "order_type": 1,
    "order_name": "初探班",
    "original_amount": 1688.00,
    "final_amount": 1688.00,
    "pay_status": 1,
    "pay_status_name": "已支付",
    "pay_time": "2026-02-10 10:30:00",
    "pay_method": "微信支付",
    "transaction_id": "wx_trans_id",
    "prepay_id": "prepay_id",
    "is_reward_granted": true,
    "reward_granted_at": "2026-02-10 10:31:00",
    "cancel_reason": null,
    "cancel_time": null,
    "refund_reason": null,
    "refund_time": null,
    "created_at": "2026-02-10 10:00:00",
    "expires_at": "2026-02-10 10:30:00",
    "order_metadata": null,
    "referee_id": 100,
    "referee_uid": "cloud-uid-100",
    "referee_name": "推荐人姓名",
    "referee_phone": "13900139000",
    "referee_level": 2,
    "course_id": 1,
    "course_name": "初探班",
    "course_type": 1
  }
}
```

---

### 3. refund - 订单退款

**Action**: `refund`
**权限**: 需要管理员权限
**状态**: ⚠️ 功能开发中

**说明**: 管理员执行订单退款

**请求参数**:
```json
{
  "action": "refund",
  "order_no": "ORD202602100001",  // 必填，订单号
  "refund_reason": "用户申请退款"  // 必填，退款原因
}
```

**响应数据**:
```json
{
  "code": 0,
  "message": "退款功能开发中",
  "data": {
    "status": "developing",
    "message": "退款功能开发中，待配置商户信息后启用",
    "order_no": "ORD202602100001",
    "refund_amount": 1688.00
  }
}
```

**注意**: 待配置微信商户信息后启用

---

### 4. withdrawAudit - 提现审核

**Action**: `withdrawAudit`
**权限**: 需要管理员权限

**说明**: 管理员审核用户提现申请

**请求参数**:
```json
{
  "action": "withdrawAudit",
  "withdrawal_id": 1,                // 必填，提现记录ID
  "status": 1,                       // 必填，审核结果（1通过/2拒绝）
  "reject_reason": "信息不完整"       // 可选，拒绝原因（status=2时必填）
}
```

**响应数据（审核通过）**:
```json
{
  "code": 0,
  "message": "审核通过",
  "data": {
    "withdrawal_id": 1,
    "status": 1,
    "status_name": "审核通过"
  }
}
```

**响应数据（审核拒绝）**:
```json
{
  "code": 0,
  "message": "审核拒绝",
  "data": {
    "withdrawal_id": 1,
    "status": 2,
    "status_name": "审核拒绝",
    "reject_reason": "信息不完整"
  }
}
```

**业务逻辑**:
- **审核通过**：扣除冻结积分，记录积分变动
- **审核拒绝**：解冻积分退回到可用积分，记录积分变动

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
- `ambassador_quotas` - 大使名额表

---

## 🔧 技术规范

### 1. 数据库连接
使用 CloudBase SDK `rdb()` 方法连接数据库，无需配置环境变量。

### 2. 字段映射
- ✅ 使用 `referee_code`（不是 referral_code）
- ✅ 使用 `cash_points_available`（不是 cash_points）
- ✅ 使用 `cash_points_frozen`（不是 frozen_cash_points）

### 3. 响应格式
统一使用 `response.success()` 和 `response.error()` 返回数据。

### 4. 错误处理
所有接口都包含完整的 try-catch 错误处理和日志记录。

---

## ⚠️ 注意事项

### 1. 支付功能
以下接口暂时返回"功能开发中"，待配置微信商户信息后启用：
- `createPayment` - 发起支付
- `paymentCallback` - 支付回调
- `refund` - 订单退款

### 2. 资料完善检查
以下接口需要检查用户资料是否完善（`profile_completed = 1`）：
- `create` - 创建订单
- `exchangeGoods` - 功德分兑换商品

未完善资料时返回 403 错误，引导用户完善资料。

### 3. 订单过期时间
创建订单后，订单有效期为 30 分钟，超时后订单状态自动变为"已关闭"。

### 4. 混合支付
功德分兑换商品支持混合支付：
- 功德分足够：全部使用功德分
- 功德分不足：可选择使用积分补充（需设置 `use_cash_points_if_not_enough = true`）

---

## 📝 更新日志

### V1.0 (2026-02-10)
- ✅ 完成 13 个接口开发
- ✅ 遵循云函数标准部署规范 V2.0
- ✅ 使用 CloudBase SDK rdb() 连接数据库
- ✅ 使用正确的字段名映射
- ⚠️ 支付功能暂时返回"功能开发中"

---

**文档生成时间**: 2026-02-10
**维护者**: 开发团队
**联系方式**: 参考项目文档
