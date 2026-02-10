# User 云函数 API 文档

**版本**: V1.0
**更新时间**: 2026-02-09
**云函数名称**: `user`

---

## 接口说明

**调用方式**:
```javascript
wx.cloud.callFunction({
  name: 'user',
  data: {
    action: 'client:login',  // 或 'admin:getUserList'
    // 其他参数...
  }
})
```

**认证方式**:
- **客户端接口**: 使用微信小程序的 OPENID 自动认证
- **管理端接口**: 需要管理员 JWT token 认证

**通用响应格式**:
```json
{
  "code": 0,           // 0成功，非0失败
  "message": "成功",
  "data": {}           // 业务数据
}
```

---

## 客户端接口 (client:)

### 1. client:login - 微信登录/注册

**接口概述**: 用户首次登录自动注册，生成唯一推荐码，支持绑定推荐人

**请求参数**:
```json
{
  "action": "client:login",
  "scene": "ref_ABC123"  // 可选，场景值（推荐码）
}
```

**业务逻辑**:
1. 从微信上下文获取 OPENID
2. 查询用户是否已存在
3. 如果不存在，创建新用户：
   - 生成唯一的6位推荐码（大写字母+数字）
   - 从 scene 参数解析推荐人推荐码
   - 绑定推荐人关系
4. 返回用户信息

**响应数据**:
```json
{
  "id": 1,
  "_openid": "oABC123...",
  "referral_code": "A1B2C3",
  "referee_id": 100,
  "profile_completed": 0,
  "created_at": "2026-02-09 10:00:00"
}
```

---

### 2. client:getProfile - 获取个人资料

**接口概述**: 获取当前登录用户的完整资料信息

**请求参数**:
```json
{
  "action": "client:getProfile"
}
```

**响应数据**:
```json
{
  "id": 1,
  "_openid": "oABC123...",
  "real_name": "张三",
  "phone": "13800138000",
  "city": "深圳",
  "avatar": "https://...",
  "referral_code": "A1B2C3",
  "referee_id": 100,
  "ambassador_level": 1,
  "merit_points": 1000,
  "cash_points": 500,
  "frozen_cash_points": 0,
  "profile_completed": 1,
  "referee_confirmed_at": null,
  "created_at": "2026-02-09 10:00:00"
}
```

---

### 3. client:updateProfile - 更新个人资料

**接口概述**: 更新用户的姓名、手机、城市、头像等信息

**请求参数**:
```json
{
  "action": "client:updateProfile",
  "real_name": "张三",
  "phone": "13800138000",
  "city": "深圳",
  "avatar": "https://..."
}
```

**业务逻辑**:
1. 验证必填字段（real_name, phone）
2. 验证手机号格式
3. 检查手机号是否被其他用户使用
4. 更新用户资料
5. 判断资料是否完善（姓名+手机+城市）

**响应数据**:
```json
{
  "profile_completed": 1
}
```

---

### 4. client:updateReferee - 修改推荐人

**接口概述**: 用户修改推荐人，有7天限制和锁定规则

**请求参数**:
```json
{
  "action": "client:updateReferee",
  "newReferralCode": "XYZ789"
}
```

**业务规则**:
- 7天内只能修改1次
- 首次支付后推荐人锁定，无法修改
- 不能推荐自己
- 不能形成循环推荐关系

**业务逻辑**:
1. 检查推荐人是否已锁定（referee_confirmed_at）
2. 检查7天内是否已修改过
3. 验证新推荐码是否存在
4. 检查循环推荐关系
5. 更新推荐人
6. 记录变更日志

**响应数据**:
```json
{
  "message": "推荐人修改成功"
}
```

---

### 5. client:getMyCourses - 获取我的课程列表

**接口概述**: 查询用户已购买的课程列表

**请求参数**:
```json
{
  "action": "client:getMyCourses",
  "page": 1,
  "pageSize": 20
}
```

**响应数据**:
```json
{
  "total": 5,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "title": "天道文化基础课",
      "cover_image": "https://...",
      "price": 9800,
      "purchase_date": "2026-01-15 10:00:00",
      "progress": 60,
      "completed_at": null
    }
  ]
}
```

---

### 6. client:getMyOrders - 获取我的订单列表

**接口概述**: 查询用户的订单列表，支持状态筛选

**请求参数**:
```json
{
  "action": "client:getMyOrders",
  "page": 1,
  "pageSize": 20,
  "status": 1  // 可选：0待支付/1已支付/2已取消/3已退款
}
```

**响应数据**:
```json
{
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "order_no": "TD202602091234567890",
      "course_id": 1,
      "course_title": "天道文化基础课",
      "total_amount": 9800,
      "status": 1,
      "created_at": "2026-02-09 10:00:00",
      "paid_at": "2026-02-09 10:05:00"
    }
  ]
}
```

---

### 7. client:getMeritPoints - 获取功德分余额

**接口概述**: 查询用户的功德分余额和统计信息

**请求参数**:
```json
{
  "action": "client:getMeritPoints"
}
```

**响应数据**:
```json
{
  "balance": 1000,
  "totalEarned": 1500,
  "totalSpent": 500
}
```

---

### 8. client:getMeritPointsHistory - 功德分明细

**接口概述**: 查询功德分变动明细记录

**请求参数**:
```json
{
  "action": "client:getMeritPointsHistory",
  "page": 1,
  "pageSize": 20
}
```

**响应数据**:
```json
{
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "change_amount": 100,
      "balance_after": 1000,
      "change_type": "purchase",
      "related_id": 123,
      "remark": "购买课程获得",
      "created_at": "2026-02-09 10:00:00"
    }
  ]
}
```

---

### 9. client:getCashPoints - 获取积分余额

**接口概述**: 查询用户的积分余额（可用、冻结、提现中）

**请求参数**:
```json
{
  "action": "client:getCashPoints"
}
```

**响应数据**:
```json
{
  "available": 500,
  "frozen": 100,
  "withdrawing": 50,
  "totalEarned": 1000,
  "totalWithdrawn": 350
}
```

---

### 10. client:getCashPointsHistory - 积分明细

**接口概述**: 查询积分变动明细记录

**请求参数**:
```json
{
  "action": "client:getCashPointsHistory",
  "page": 1,
  "pageSize": 20
}
```

**响应数据**:
```json
{
  "total": 30,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "change_amount": 50,
      "balance_after": 500,
      "change_type": "referral",
      "related_id": 456,
      "remark": "推荐用户购课奖励",
      "created_at": "2026-02-09 10:00:00"
    }
  ]
}
```

---

### 11. client:applyWithdraw - 申请积分提现

**接口概述**: 用户申请将积分提现到微信或支付宝

**请求参数**:
```json
{
  "action": "client:applyWithdraw",
  "amount": 100,
  "withdrawType": "wechat",  // wechat/alipay
  "accountInfo": {
    "name": "张三",
    "account": "13800138000"
  }
}
```

**业务规则**:
- 提现金额必须大于系统配置的最低金额（默认100元）
- 可用积分必须充足
- 使用事务处理，确保数据一致性

**业务逻辑**:
1. 验证提现金额和账户信息
2. 查询系统配置的最低提现金额
3. 验证可用积分余额
4. 开启事务：
   - 冻结积分（cash_points - amount, frozen_cash_points + amount）
   - 创建提现记录（状态：待审核）
   - 记录积分变动
5. 提交事务

**响应数据**:
```json
{
  "message": "提现申请已提交，等待审核"
}
```

---

### 12. client:getWithdrawRecords - 提现记录

**接口概述**: 查询用户的提现记录列表

**请求参数**:
```json
{
  "action": "client:getWithdrawRecords",
  "page": 1,
  "pageSize": 20,
  "status": 0  // 可选：0待审核/1已通过/2已拒绝
}
```

**响应数据**:
```json
{
  "total": 5,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "withdraw_no": "WD202602091234567890",
      "amount": 100,
      "withdraw_type": "wechat",
      "account_info": "{\"name\":\"张三\",\"account\":\"13800138000\"}",
      "status": 0,
      "audit_remark": null,
      "created_at": "2026-02-09 10:00:00",
      "audited_at": null
    }
  ]
}
```

---

### 13. client:getMyReferees - 我推荐的用户

**接口概述**: 查询当前用户推荐的所有用户列表

**请求参数**:
```json
{
  "action": "client:getMyReferees",
  "page": 1,
  "pageSize": 20
}
```

**响应数据**:
```json
{
  "total": 15,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 2,
      "real_name": "李四",
      "phone": "13900139000",
      "avatar": "https://...",
      "ambassador_level": 0,
      "created_at": "2026-02-08 15:00:00"
    }
  ]
}
```

---

## 管理端接口 (admin:)

### 14. admin:getUserList - 学员列表

**接口概述**: 管理员查询学员列表，支持搜索和筛选

**请求参数**:
```json
{
  "action": "admin:getUserList",
  "page": 1,
  "pageSize": 20,
  "keyword": "张三",  // 可选，搜索姓名或手机号
  "ambassadorLevel": 1,  // 可选，筛选大使等级
  "startDate": "2026-01-01",  // 可选，注册开始日期
  "endDate": "2026-02-09"  // 可选，注册结束日期
}
```

**业务逻辑**:
1. 构建查询条件（关键词、等级、日期范围）
2. 分页查询用户列表
3. 查询总数
4. 返回列表和分页信息

**响应数据**:
```json
{
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "_openid": "oABC123...",
      "real_name": "张三",
      "phone": "13800138000",
      "city": "深圳",
      "avatar": "https://...",
      "referral_code": "A1B2C3",
      "referee_id": 100,
      "ambassador_level": 1,
      "merit_points": 1000,
      "cash_points": 500,
      "frozen_cash_points": 0,
      "profile_completed": 1,
      "created_at": "2026-02-09 10:00:00"
    }
  ]
}
```

---

### 15. admin:getUserDetail - 学员详情

**接口概述**: 管理员查看学员的详细信息，包括课程、订单、积分等统计

**请求参数**:
```json
{
  "action": "admin:getUserDetail",
  "userId": 1
}
```

**业务逻辑**:
1. 查询用户基本信息
2. 查询推荐人信息
3. 统计推荐的用户数量
4. 查询已购课程列表
5. 统计订单数据（总订单数、已支付订单数、总消费金额）
6. 查询最近5条订单
7. 统计功德分（总获得、总消耗、当前余额）
8. 统计积分（总获得、总提现、可用、冻结）
9. 统计提现数据（总提现次数、已通过金额、待审核金额）

**响应数据**:
```json
{
  "user": { /* 用户基本信息 */ },
  "referee": {
    "id": 100,
    "real_name": "推荐人",
    "phone": "13700137000",
    "referral_code": "XYZ789",
    "ambassador_level": 2
  },
  "refereeCount": 15,
  "courses": [ /* 已购课程列表 */ ],
  "orderStats": {
    "totalOrders": 10,
    "paidOrders": 8,
    "totalSpent": 78400
  },
  "recentOrders": [ /* 最近5条订单 */ ],
  "meritPointsStats": {
    "totalEarned": 1500,
    "totalSpent": 500,
    "balance": 1000
  },
  "cashPointsStats": {
    "totalEarned": 1000,
    "totalWithdrawn": 400,
    "available": 500,
    "frozen": 100
  },
  "withdrawStats": {
    "totalWithdrawals": 5,
    "approvedAmount": 400,
    "pendingAmount": 100
  }
}
```

---

### 16. admin:updateUserReferee - 修改学员推荐人

**接口概述**: 管理员强制修改用户的推荐人关系

**请求参数**:
```json
{
  "action": "admin:updateUserReferee",
  "userId": 1,
  "newRefereeId": 200,  // 可选，为空表示清除推荐人
  "remark": "管理员修改推荐人"
}
```

**业务规则**:
- 管理员可以无视7天限制和锁定状态
- 不能将自己设为推荐人
- 不能形成循环推荐关系
- 必须记录变更日志

**业务逻辑**:
1. 查询用户信息
2. 如果 newRefereeId 为空，清除推荐人
3. 验证新推荐人是否存在
4. 检查循环推荐关系
5. 更新推荐人
6. 记录变更日志（操作类型：admin_update/admin_clear）

**响应数据**:
```json
{
  "oldRefereeId": 100,
  "newRefereeId": 200,
  "oldRefereeName": "原推荐人",
  "newRefereeName": "新推荐人"
}
```

---

### 17. admin:getRefereeChangeLogs - 推荐人变更日志

**接口概述**: 管理员查看推荐人变更的审计日志

**请求参数**:
```json
{
  "action": "admin:getRefereeChangeLogs",
  "userId": 1,  // 可选，指定用户ID
  "page": 1,
  "pageSize": 20
}
```

**响应数据**:
```json
{
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "list": [
    {
      "id": 1,
      "userId": 1,
      "userName": "张三",
      "userPhone": "13800138000",
      "oldReferee": {
        "id": 100,
        "name": "原推荐人",
        "phone": "13700137000"
      },
      "newReferee": {
        "id": 200,
        "name": "新推荐人",
        "phone": "13600136000"
      },
      "changeType": "admin_update",
      "changeTypeText": "管理员修改",
      "operatorType": "admin",
      "operatorInfo": "管理员 1",
      "remark": "管理员修改推荐人",
      "createdAt": "2026-02-09 10:00:00"
    }
  ]
}
```

---

## 数据库表

### users 表
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  _openid VARCHAR(128) UNIQUE NOT NULL,
  real_name VARCHAR(50),
  phone VARCHAR(20),
  city VARCHAR(50),
  avatar VARCHAR(255),
  referral_code VARCHAR(6) UNIQUE NOT NULL,
  referee_id INT,
  ambassador_level TINYINT DEFAULT 0,
  merit_points INT DEFAULT 0,
  cash_points DECIMAL(10,2) DEFAULT 0,
  frozen_cash_points DECIMAL(10,2) DEFAULT 0,
  profile_completed TINYINT DEFAULT 0,
  referee_confirmed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  INDEX idx_openid (_openid),
  INDEX idx_referral_code (referral_code),
  INDEX idx_referee_id (referee_id)
);
```

### referee_change_logs 表
```sql
CREATE TABLE referee_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  old_referee_id INT,
  new_referee_id INT,
  change_type VARCHAR(20) NOT NULL,  -- user_update/admin_update/admin_clear
  operator_type VARCHAR(20) NOT NULL,  -- user/admin
  operator_id INT,
  remark VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);
```

### withdrawals 表
```sql
CREATE TABLE withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  withdraw_no VARCHAR(32) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  withdraw_type VARCHAR(20) NOT NULL,  -- wechat/alipay
  account_info TEXT,
  status TINYINT DEFAULT 0,  -- 0待审核/1已通过/2已拒绝
  audit_remark VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  audited_at DATETIME,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### merit_points_records 表
```sql
CREATE TABLE merit_points_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  change_amount INT NOT NULL,
  balance_after INT NOT NULL,
  change_type VARCHAR(20) NOT NULL,
  related_id INT,
  remark VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);
```

### cash_points_records 表
```sql
CREATE TABLE cash_points_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  change_type VARCHAR(20) NOT NULL,
  related_id INT,
  remark VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);
```
