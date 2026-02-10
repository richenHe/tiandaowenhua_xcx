# 后端 API 接口文档

> **📋 文档说明**：本文档仅包含 API 接口定义，接口概述和业务逻辑，不包含数据库表、业务需求、架构设计等其他内容。

**版本**: V2.2
**更新时间**: 2026-02-08

---

## 接口说明

**接口标注**:
- 🔵 小程序端接口
- 🔴 管理后台接口
- 🟢 通用接口

**用户标识说明**:
- **用户唯一标识**：CloudBase 的 `uid`（格式：`cloud-uid-xxx`）
- **持久化特性**：`uid` 是持久化的，即使 token 失效重新登录，同一用户的 `uid` 也不会变化
- **微信小程序**：额外提供 `openid` 作为微信用户的辅助标识
- **数据关联**：所有用户相关数据使用 `uid` 作为主键和外键

**通用响应格式**:
```json
{
  "code": 0,           // 0成功，非0失败
  "message": "成功",
  "data": {}           // 业务数据
}
```


**常见错误码**:
- `401`: 未登录或登录态失效
- `403`: 资料未完善（预览模式限制）
- `404`: 资源不存在
- `422`: 参数验证失败

**错误码403详细说明**:

当用户资料未完善(`profile_completed = 0`)时,操作类接口返回403错误:

```json
{
  "code": 403,
  "message": "请先完善资料",
  "action": "complete_profile",
  "redirect_url": "/pages/auth/complete-profile/index"
}
```

**需要检查的接口**(操作类):
- 创建订单(所有类型)
- 创建预约
- 商城兑换
- 申请大使
- 提现申请
- 大使升级

**白名单接口**(无需检查,查看类):
- 获取课程列表/详情
- 获取商学院介绍/素材/案例
- 获取用户信息
- 商城商品列表
- 获取大使信息
- 功德分/积分余额查询

### 关键设计原则
1. **主键使用 id**：所有表使用自增 `id INT AUTO_INCREMENT PRIMARY KEY` 作为主键
2. **uid 唯一索引**：CloudBase 的 `uid` 设置为 `UNIQUE NOT NULL`，用于用户身份识别
3. **外键关联灵活**：可以使用 `id`（性能优）或 `uid`（语义清晰），推荐使用 `referee_id` + `referee_uid` 双字段
4. **数据持久化**：CloudBase 登录后，通过 `uid` 查询用户记录，获取对应的 `id`
5. **接口响应**：接口返回时同时提供 `id` 和 `uid`，前端优先使用 `id` 进行业务操作

### 数据库表结构示例

**用户表（users）**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,    -- 主键（自增ID）
  uid VARCHAR(64) UNIQUE NOT NULL,      -- CloudBase 用户唯一标识（唯一索引）
  openid VARCHAR(128),                  -- 微信 OpenID
  real_name VARCHAR(50),                -- 真实姓名
  phone VARCHAR(20),                    -- 手机号
  gender TINYINT,                       -- 性别：0女/1男
  ambassador_level TINYINT DEFAULT 0,   -- 大使等级：0普通/1准青鸾/2青鸾/3鸿鹄
  referee_id INT,                       -- 推荐人 id（外键，关联 users.id）
  referee_uid VARCHAR(64),              -- 推荐人 uid（辅助字段）
  profile_completed BOOLEAN DEFAULT FALSE,     -- 资料是否完善
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uid (uid),                  -- uid 索引用于 CloudBase 查询
  INDEX idx_referee_id (referee_id),    -- 推荐人 id 索引
  INDEX idx_phone (phone)               -- 手机号索引
);
```

**说明**:
- `id` 作为主键（PRIMARY KEY），自增整数，用于表间关联和快速查询
- `uid` 设置为唯一索引（UNIQUE NOT NULL），用于 CloudBase 用户身份识别
- 外键关联使用 `referee_id` 关联其他用户的 `id`，提高查询性能
- `referee_uid` 作为辅助字段保存，方便调试和数据追溯
- 后端逻辑：通过 `context.user.uid` 获取 uid，然后查询对应的用户记录获取 `id`

---

## 目录

1. [用户模块](#1-用户模块)
2. [课程模块](#2-课程模块)
3. [订单模块](#3-订单模块)
4. [预约模块](#4-预约模块)
5. [商学院模块](#5-商学院模块)
6. [传播大使模块](#6-传播大使模块)
7. [协议模块](#7-协议模块)
8. [反馈模块](#8-反馈模块)
9. [消息提醒模块](#9-消息提醒模块)
10. [后台管理模块](#10-后台管理模块)

---

## 1. 用户模块

**认证方式**: 使用 CloudBase SDK 的 OpenID 登录，前端调用 `signInWithOpenId()` 后，CloudBase 会自动创建用户并返回 `uid`。所有接口使用 CloudBase 的登录态进行身份验证。

**后端实现逻辑**:
1. 从 CloudBase 登录态获取 `context.user.uid`
2. 通过 `uid` 查询数据库用户表，获取用户的 `id`
3. 后续业务逻辑使用 `id` 进行关联查询（性能更优）
4. 接口响应同时返回 `id` 和 `uid`，前端优先使用 `id`

### 🔵 1.1 微信登录
**说明**: 前端直接使用 CloudBase SDK 的 `signInWithOpenId()` 进行登录，无需调用后端接口。CloudBase 会自动处理用户创建和登录态维护。

**前端代码示例**:
```javascript
import { signInWithOpenId } from '@/utils/cloudbase';
const loginResult = await signInWithOpenId();
// loginResult.user.uid 即为用户唯一标识
```

### 🔵 1.2 保存/更新用户资料
**接口**: `POST /api/user/profile`

**接口概述**: 保存或更新用户资料,判断资料是否完善

**认证**: CloudBase 登录态（自动从 CloudBase SDK 获取当前登录用户的 uid）

**请求参数**:
```json
{
  "real_name": "张三",      // 必填
  "phone": "13800138000",   // 必填
  "gender": 1,              // 可选：0女/1男
  "birth_bazi": {           // 可选
    "year": "1990",
    "month": "01",
    "day": "01",
    "hour": "10"
  },
  "industry": "互联网",      // 可选
  "province": "广东省",      // 可选
  "city": "深圳市",          // 可选
  "personal_intro": "简介",  // 可选
  "temp_referee_id": 123    // 可选，扫码带来的临时推荐人ID
}
```

**业务逻辑**:
- 使用 CloudBase 登录态获取当前用户的 `uid`
- 通过 `uid` 查询数据库，如果用户资料不存在，则创建新记录
- 如果用户资料已存在，则更新记录
- 首次保存资料时，如果传入 `temp_referee_id`，则设置为用户的推荐人
- **前5项完善判定**:
```
IF real_name AND phone AND gender AND birth_bazi AND (province OR city):
    profile_completed = 1
ELSE:
    profile_completed = 0

更新 users 表
```

**响应数据**:
```json
{
  "id": 1001,
  "uid": "cloud-uid-xxx",
  "profile_completed": true,
  "is_first_save": true,
  "referee_id": 123
}
```

**数据库设计注意点**:
- users 表需新增 `profile_completed` 字段(BOOLEAN, DEFAULT FALSE)

### 🔵 1.3 获取用户信息
**接口**: `GET /api/user/profile`

**认证**: CloudBase 登录态（自动从 CloudBase SDK 获取当前登录用户的 uid）

**响应数据**:
```json
{
  "id": 1001,
  "uid": "cloud-uid-xxx",
  "openid": "o6_xxx...",
  "real_name": "张三",
  "phone": "13800138000",
  "gender": 1,
  "birth_bazi": {
    "year": "1990",
    "month": "01",
    "day": "01",
    "hour": "10"
  },
  "industry": "互联网",
  "province": "广东省",
  "city": "深圳市",
  "personal_intro": "简介",
  "ambassador_level": 2,
  "ambassador_level_name": "青鸾大使",
  "referee_id": 100,
  "referee_name": "推荐人昵称",
  "referee_level": 3,
  "is_referee_confirmed": true,
  "referee_confirmed_at": "2024-01-15 10:00:00",
  "profile_completed": true,
  "created_at": "2024-01-15 10:00:00"
}
```

**说明**: 如果用户资料不存在，返回 `profile_completed: false` 和基础的 CloudBase 用户信息（uid、openid）

### 🔵 1.4 更新推荐人
**接口**: `PUT /api/user/referee`

**认证**: CloudBase 登录态

**请求参数**:
```json
{
  "referee_id": 200
}
```

**业务规则**:
- 7天内只能修改1次
- 不能选择自己
- 不能选择自己的下级
- 推荐人必须是准青鸾及以上
- 首次购买支付后不可修改
- 使用 CloudBase uid 作为用户唯一标识

**业务逻辑**:
```
1. 验证用户身份(CloudBase uid)
2. 查询用户上次修改时间:
   IF (NOW() - referee_updated_at) < 7天:
       返回错误: "7天内只能修改1次,下次可修改时间为: {referee_updated_at + 7天}"
3. 验证推荐人ID:
   - 不能是自己:
     IF referee_id = current_user_id:
         返回错误: "不能选择自己为推荐人"
   - 不能是自己的下级(递归查询推荐关系树):
     查询以当前用户为根的推荐树
     IF referee_id IN 推荐树:
         返回错误: "不能选择自己的下级为推荐人"
   - 推荐人必须是准青鸾及以上:
     IF referee.ambassador_level < 1:
         返回错误: "推荐人必须是传播大使"
4. 检查是否首次购买:
   IF EXISTS(SELECT 1 FROM orders WHERE user_id = ? AND pay_status = 1):
       返回错误: "首次购买支付后不可修改推荐人"
5. 更新推荐人并记录日志:
   UPDATE users SET 
     referee_id = ?,
     referee_uid = ?,
     referee_updated_at = NOW()
   WHERE id = ?
   
   INSERT INTO referee_change_logs (
     user_id, old_referee_id, new_referee_id,
     change_type = 2,  // 用户主动修改
     change_source = 1,  // 小程序用户资料
     change_ip = ?
   )
6. 返回成功及下次可修改时间: NOW() + 7天
```

**响应数据**:
```json
{
  "success": true,
  "referee_id": 200,
  "referee_name": "新推荐人",
  "can_modify_again_at": "2024-02-01 10:00:00"
}
```

### 🔵 1.5 获取可选传播大使列表
**接口**: `GET /api/user/ambassador-list`

**认证**: CloudBase 登录态

**请求参数**:
```
?course_type=1  // 可选：1初探班/2密训班/3咨询/4顾问
```

**响应数据**:
```json
{
  "list": [
    {
      "id": 100,
      "uid": "cloud-uid-100",
      "real_name": "大使姓名",
      "level": 2,
      "level_name": "青鸾大使",
      "can_recommend_course": true
    }
  ]
}
```

**业务规则**:
- 不传course_type：返回准青鸾及以上
- course_type=1：返回准青鸾及以上
- course_type=2/3/4：只返回青鸾及以上

### 🔵 1.6 验证推荐人资格
**接口**: `GET /api/user/validate-referee`

**认证**: CloudBase 登录态

**请求参数**:
```
?referee_id=100&course_type=2
// 或 ?referee_uid=cloud-uid-100&course_type=2
```

**业务逻辑**:
```
1. 查询推荐人信息(通过referee_id或referee_uid)
2. 验证推荐人是否存在:
   IF NOT EXISTS:
       返回错误: "推荐人不存在"
3. 验证推荐人等级:
   IF course_type = 1:  // 初探班
       IF referee.ambassador_level >= 1:  // 准青鸾及以上
           valid = true
       ELSE:
           valid = false
           error_message = "推荐人必须是传播大使才能推荐初探班"
   ELSE IF course_type IN (2,3,4):  // 密训班/咨询/顾问
       IF referee.ambassador_level >= 2:  // 青鸾及以上
           valid = true
       ELSE:
           valid = false
           error_message = "该推荐人暂时只能推荐初探班课程"
4. 检查协议有效性:
   IF referee.ambassador_level >= 1:
       查询协议签署记录
       IF 协议已过期:
           valid = false
           error_message = "推荐人协议已过期,暂不能推荐"
5. 返回验证结果和推荐人详细信息
```

**响应数据**:
```json
{
  "valid": false,
  "error_message": "该推荐人暂时只能推荐初探班课程",
  "referee_info": {
    "id": 100,
    "uid": "cloud-uid-100",
    "real_name": "大使姓名",
    "level": 1,
    "level_name": "准青鸾大使"
  }
}
```

### 🔵 1.7 查询资料完善状态
**接口**: `GET /api/user/profile-status`

**接口概述**: 查询用户资料是否完善，用于判断预览模式

**认证**: CloudBase 登录态

**响应数据**:
```json
{
  "profile_completed": false,
  "is_preview_mode": true,
  "missing_fields": ["real_name", "phone"],
  "complete_url": "/pages/auth/complete-profile/index"
}
```

**业务逻辑**:
```
1. 获取当前用户信息(通过CloudBase uid)
2. 检查 users 表的 profile_completed 字段
3. 如果 profile_completed = false:
   - 检查缺失的必填字段(real_name, phone, gender, birth_bazi, province/city)
   - 返回缺失字段列表
4. 返回结果:
   - is_preview_mode = !profile_completed
   - 如果是预览模式,返回完善资料页面URL
```

---

## 2. 课程模块

### 🔵 2.1 课程列表
**接口**: `GET /api/course/list`

**接口概述**: 获取课程列表,支持课程类型筛选(包括咨询服务)

**请求参数**:
```
?type=1&keyword=初探&page=1&page_size=10
// type: 1初探班/2密训班/3咨询服务
```

**业务逻辑**:
1. 查询 courses 表,type 支持 1/2/3(咨询服务作为课程类型统一管理)
2. 未登录用户 is_purchased 默认 false
3. 已登录用户 LEFT JOIN user_courses 判断是否已购买
4. 咨询服务(type=3)购买后由客服联系,无需预约排期

**响应数据**:
```json
{
  "total": 5,
  "page": 1,
  "page_size": 10,
  "list": [
    {
      "id": 1,
      "name": "初探班",
      "type": 1,
      "type_name": "初探班",
      "cover_image": "封面URL",
      "description": "简介",
      "current_price": 1688.00,
      "original_price": 1688.00,
      "is_purchased": false,
      "status": 1
    }
  ]
}
```

**数据库设计注意点**:
- courses 表的 type 字段需支持值 3(咨询)
- 建议为 type 字段添加索引
- user_courses 表需支持咨询类型记录

### 🔵 2.2 课程详情
**接口**: `GET /api/course/detail`

**接口概述**: 获取课程详细信息,包括购买状态和上课次数

**请求参数**:
```
?id=1
```

**业务逻辑**:
1. 查询 courses 基本信息
2. 如已登录且已购买,查询 user_courses 返回:
   - user_course_id: 用户课程记录ID
   - attend_count: 已上课次数(初始值为1,表示可以首次上课)
3. type=3 咨询服务特殊处理:购买后显示"已购买,客服将联系您"

**响应数据**:
```json
{
  "id": 1,
  "name": "初探班",
  "type": 1,
  "type_name": "初探班",
  "cover_image": "封面URL",
  "description": "简介",
  "content": "详细介绍HTML",
  "outline": "课程大纲",
  "teacher": "讲师信息",
  "duration": "2天",
  "current_price": 1688.00,
  "original_price": 1688.00,
  "retrain_price": 500.00,
  "allow_retrain": true,
  "is_purchased": false,
  "user_course_id": 10,
  "attend_count": 1,
  "included_courses": [
    {
      "id": 1,
      "name": "初探班",
      "original_price": 1688.00,
      "gift_note": "购买密训班赠送"
    }
  ],
  "combo_note": "本课程包含初探班，购买后可同时学习两门课程",
  "stock": 100,
  "status": 1
}
```

**字段说明**:
- `included_courses`: 包含的赠送课程列表（仅密训班等组合课程有此字段）
- `combo_note`: 组合课程说明文案

**数据库设计注意点**:
- user_courses 表:
  - `attend_count`: INT, DEFAULT 1(初始化即可首次上课)
  - `is_gift`: BOOLEAN DEFAULT 0, 是否赠送课程
  - `source_order_id`: INT, 来源订单ID（赠送课程关联原订单）
  - `source_course_id`: INT, 来源课程ID（赠送课程关联密训班ID）
  - `course_type`: TINYINT, 冗余存储课程类型便于查询
  - `status`: TINYINT DEFAULT 1, 状态(1有效/0失效，退款后失效)
- 建议添加复合索引: (user_id, course_id)
- 建议添加索引: (source_order_id) 用于退款时批量更新

### 🔵 2.3 我的课程
**接口**: `GET /api/course/my`

**响应数据**:
```json
{
  "list": [
    {
      "id": 1,
      "course_id": 1,
      "course_name": "初探班",
      "buy_time": "2024-01-15 10:00:00",
      "first_class_time": "2024-02-01 09:00:00",
      "attend_count": 3,
      "allow_retrain": true,
      "retrain_price": 500.00,
      "is_gift": false,
      "gift_source": null,
      "status": 1
    },
    {
      "id": 2,
      "course_id": 1,
      "course_name": "初探班",
      "buy_time": "2024-01-20 10:00:00",
      "first_class_time": null,
      "attend_count": 1,
      "allow_retrain": true,
      "retrain_price": 500.00,
      "is_gift": true,
      "gift_source": "购买密训班赠送",
      "status": 1
    }
  ]
}
```

**字段说明**:
- `is_gift`: 是否为赠送课程
- `gift_source`: 赠送来源说明（如"购买密训班赠送"）
- `status`: 课程状态（1有效/0失效，退款后失效）

### 🔴 2.4 课程管理 - 创建课程
**接口**: `POST /api/admin/course/create`

**请求参数**:
```json
{
  "name": "课程名称",
  "type": 1,
  "cover_image": "封面URL",
  "description": "简介",
  "content": "详细介绍HTML",
  "outline": "课程大纲",
  "teacher": "讲师信息",
  "duration": "2天",
  "original_price": 1688.00,
  "current_price": 1688.00,
  "retrain_price": 500.00,
  "allow_retrain": true,
  "included_course_ids": [2],
  "stock": 100,
  "sort": 1,
  "status": 1
}
```

### 🔴 2.5 课程管理 - 更新课程
**接口**: `PUT /api/admin/course/update`

**请求参数**:
```json
{
  "id": 1,
  "name": "新名称",
  "current_price": 1500.00
  // 其他可更新字段
}
```

### 🔴 2.6 课程管理 - 删除课程
**接口**: `DELETE /api/admin/course/delete`

**请求参数**:
```json
{
  "id": 1
}
```

### 🔴 2.7 课程管理 - 上下架
**接口**: `PUT /api/admin/course/toggle-status`

**请求参数**:
```json
{
  "id": 1,
  "status": 0  // 0下架/1上架
}
```

---

## 3. 订单模块

### 🔵 3.1 创建订单(统一订单接口 - 仅真实金钱交易)
**接口**: `POST /api/order/create`

**接口概述**: 统一订单创建接口,仅用于涉及真实金钱的交易场景

**认证**: CloudBase 登录态

**适用场景**:
- order_type=1: 课程购买(初探班/密训班/咨询服务)
- order_type=2: 复训费支付
- order_type=3: 咨询服务(已整合到课程模块,type=1处理)
- order_type=4: 需支付的大使升级(金额从 ambassador_level_configs 表读取)

**不适用场景**:
- 商城兑换(功德分/积分,无真实金钱)
- 无需支付的大使升级(如准青鸾→青鸾)

**请求参数**:
```json
{
  "order_type": 1,
  "item_id": 1,
  "class_record_id": 5,
  "referee_id": 100
}
```

**参数说明**:
- `order_type`: 必填,1课程/2复训/4大使升级
- `item_id`: 必填,项目ID(根据order_type含义不同)
- `class_record_id`: 可选,上课记录ID(复训专用)
- `referee_id`: 可选,推荐人ID(不传则使用用户资料中的推荐人)

**业务逻辑**:

1. **权限验证**
   - 检查用户登录态
   - 检查 `profile_completed` 是否为 1
   - 未完善返回 403:"请先完善资料"

2. **根据 order_type 处理**

| order_type | item_id 含义 | 业务处理 |
|-----------|-------------|---------|
| 1 课程 | 课程ID | 验证课程存在;验证推荐人资格;检查重复购买;密训班标记需赠送初探班 |
| 2 复训 | 用户课程ID | 验证用户已购买;检查复训截止时间(开课前3天);检查是否已预约 |
| 4 升级 | 目标等级 | 验证当前等级;验证升级条件;验证协议是否签署;金额从 ambassador_level_configs.upgrade_payment_amount 读取 |

3. **生成订单**
   - 生成订单号: `ORD + 年月日 + 8位随机数`
   - 插入 orders 表
   - 返回订单信息

**响应数据**:
```json
{
  "order_no": "ORD202401150001",
  "order_type": 1,
  "order_name": "初探班",
  "amount": 1688.00,
  "referee_id": 100,
  "referee_uid": "cloud-uid-100",
  "referee_name": "推荐人姓名",
  "referee_level": 2,
  "status": 0
}
```

**数据库设计注意点**:
- **orders 表关键字段**:
  - `order_type`: TINYINT(1课程/2复训/4升级)
  - `order_name`: VARCHAR(100),订单名称
  - `related_id`: INT,关联ID(根据type含义不同)
  - `class_record_id`: INT,上课记录ID(复训专用)
  - `final_amount`: DECIMAL(10,2),应付金额
  - `order_metadata`: JSON,订单元数据(如密训班标记)
- **索引建议**:
  - `idx_user_type_status` (user_id, order_type, pay_status)
  - `idx_order_no` (order_no) UNIQUE

### 🔵 3.2 修改订单推荐人
**接口**: `PUT /api/order/update-referee`

**认证**: CloudBase 登录态

**请求参数**:
```json
{
  "order_no": "ORD202401150001",
  "referee_id": 200
}
```

**业务规则**:
- 仅待支付订单可修改
- 验证推荐人资格
- 记录变更日志

**业务逻辑**:
```
1. 查询订单信息:
   SELECT * FROM orders WHERE order_no = ? AND user_id = ?
2. 验证订单状态:
   IF order.pay_status != 0:
       返回错误: "仅待支付订单可修改推荐人"
3. 根据订单类型确定课程类型:
   IF order_type = 1:  // 课程购买
       查询课程: SELECT type FROM courses WHERE id = order.related_id
       course_type = course.type
   ELSE IF order_type = 2:  // 复训
       查询用户课程: SELECT course_type FROM user_courses WHERE id = order.related_id
       course_type = user_course.course_type
   ELSE IF order_type = 4:  // 大使升级
       course_type = null  // 升级无需验证课程类型
4. 验证新推荐人资格:
   IF course_type IS NOT NULL:
       调用推荐人资格验证接口
       IF NOT valid:
           返回错误: error_message
5. 更新订单推荐人:
   UPDATE orders SET 
     referee_id = ?,
     referee_uid = ?,
     referee_updated_at = NOW()
   WHERE order_no = ? AND pay_status = 0
6. 记录变更日志:
   INSERT INTO referee_change_logs (
     user_id, order_no,
     old_referee_id, new_referee_id,
     change_type = 3,  // 订单页修改
     change_source = 2,  // 订单支付页
     change_ip = ?
   )
7. 返回更新后的推荐人信息
```

### 🔵 3.3 发起支付
**接口**: `POST /api/order/pay`

**请求参数**:
```json
{
  "order_no": "ORD202401150001"
}
```

**业务逻辑**:
```
1. 查询订单信息:
   SELECT * FROM orders WHERE order_no = ? AND user_id = ?
2. 验证订单状态:
   IF pay_status = 1:
       返回错误: "订单已支付"
   IF pay_status = 2:
       返回错误: "订单已取消"
3. 检查订单有效期:
   IF created_at + 30分钟 < NOW():
       UPDATE orders SET pay_status = 3  // 已关闭
       返回错误: "订单已超时，请重新下单"
4. 验证订单金额:
   IF final_amount <= 0:
       返回错误: "订单金额异常"
5. 调用微信支付统一下单API:
   请求参数:
   - appid: 小程序appid
   - mchid: 商户号
   - description: order_name
   - out_trade_no: order_no
   - notify_url: https://yourdomain.com/api/order/notify
   - amount: {
       total: final_amount * 100,  // 转为分
       currency: "CNY"
     }
   - payer: {
       openid: user.openid
     }
6. 微信返回prepay_id后,生成支付参数:
   timeStamp = 当前时间戳
   nonceStr = 随机字符串
   package = "prepay_id=" + prepay_id
   signType = "RSA"
   paySign = 使用商户私钥签名
7. 更新订单prepay_id:
   UPDATE orders SET prepay_id = ? WHERE order_no = ?
8. 返回支付参数给前端
```

**响应数据**:
```json
{
  "pay_params": {
    "timeStamp": "xxx",
    "nonceStr": "xxx",
    "package": "xxx",
    "signType": "xxx",
    "paySign": "xxx"
  }
}
```

### 🔵 3.4 支付回调（内部接口）
**接口**: `POST /api/order/notify`

**接口概述**: 微信支付成功回调,根据不同订单类型执行相应业务逻辑

**业务逻辑** - 根据 order_type 执行不同处理:

**公共处理**:
1. 验证微信签名
2. 更新订单状态为已支付
3. 记录支付时间和交易号

**type=1（课程购买）**:
```
1. 查询课程信息，获取 included_course_ids
2. 插入 user_courses 表（主课程）:
   - attend_count 初始值为 1
   - is_gift = 0
   - course_type 冗余存储课程类型

3. 如果是密训班（检查 included_course_ids 不为空）:
   FOR EACH gift_course_id IN included_course_ids:
       -- 检查用户是否已有该课程
       IF NOT EXISTS(SELECT 1 FROM user_courses WHERE user_id=? AND course_id=gift_course_id):
           INSERT INTO user_courses (
               user_id,
               course_id = gift_course_id,
               order_id,
               is_gift = 1,
               source_order_id = order_id,
               source_course_id = 密训班course_id,
               attend_count = 1,
               course_type = 1
           )
       -- 用户已有该课程则不重复添加

4. 首次购买: 锁定推荐人(referee_confirmed_at = NOW())

5. 计算推荐人奖励:
   -- 重要：只按订单金额计算，不重复计算赠送课程
   reward_base_amount = order.final_amount  -- 密训班38888元
   -- 不是 38888 + 1688

6. 发放功德分或解冻积分
7. 发送购买成功通知
```

**type=2（复训费）**:
```
1. 创建预约记录(appointments 表)
2. 标记 is_retrain = 1
3. 关联订单号(order_no)
4. 不发放推荐人奖励
5. 发送预约成功通知
```

**type=4（大使升级）**:
```
⚠️ 以下数值均从 ambassador_level_configs 表动态读取，不要硬编码

1. 更新用户等级(ambassador_level = target_level)
2. 从 ambassador_level_configs 读取目标等级配置:
   SELECT * FROM ambassador_level_configs WHERE level = target_level
   
3. 根据配置发放名额(如配置了 gift_quota_basic > 0):
   - 插入 ambassador_quotas 表
   - quota_type = 1(初探班)
   - total_quantity = config.gift_quota_basic
   - remaining_quantity = config.gift_quota_basic
   - expire_date = DATE_ADD(NOW(), INTERVAL 1 YEAR)
   - source_type = 1(大使升级)
   
   如配置了 gift_quota_advanced > 0:
   - 同理插入密训班名额
   
4. 根据配置发放冻结积分(如配置了 frozen_points > 0):
   - 发放 config.frozen_points 冻结积分
   - 更新 users.cash_points_frozen += config.frozen_points
   - 插入 cash_points_records(type=1获得冻结)
5. 发送升级成功通知
```

**数据库设计注意点**:
- **ambassador_quotas 表**(名额管理 - 适用于所有拥有赠送名额的大使等级):
  - `user_id`: 大使ID
  - `ambassador_level`: 大使等级(2青鸾/3鸿鹄/4金凤等)
  - `quota_type`: 名额类型(1初探班/2密训班)
  - `source_type`: 来源(1大使升级/2活动赠送/3系统发放)
  - `total_quantity`: 总数量
  - `remaining_quantity`: 剩余数量
  - `expire_date`: 过期日期
  - `status`: 状态(0失效/1有效)
  - **说明**: 不同等级大使的名额数量、类型、有效期根据业务规则配置
- **appointments 表**:
  - `is_retrain`: BOOLEAN,是否复训
  - `order_no`: VARCHAR(32),关联订单号(复训专用)

### 🔵 3.5 订单列表
**接口**: `GET /api/order/list`

**请求参数**:
```
?status=1&page=1&page_size=10
```

**响应数据**:
```json
{
  "total": 10,
  "list": [
    {
      "order_no": "ORD202401150001",
      "course_name": "初探班",
      "amount": 1688.00,
      "pay_status": 1,
      "pay_time": "2024-01-15 10:30:00",
      "referee_name": "推荐人",
      "is_reward_granted": true,
      "created_at": "2024-01-15 10:00:00"
    }
  ]
}
```

### 🔵 3.6 订单详情
**接口**: `GET /api/order/detail`

**请求参数**:
```
?order_no=ORD202401150001
```

**响应数据**:
```json
{
  "order_no": "ORD202401150001",
  "user_id": 1,
  "course_id": 1,
  "course_name": "初探班",
  "amount": 1688.00,
  "pay_status": 1,
  "pay_time": "2024-01-15 10:30:00",
  "pay_method": "微信支付",
  "transaction_id": "wx_trans_id",
  "referee_id": 100,
  "referee_name": "推荐人",
  "referee_level": 2,
  "referee_confirmed_at": "2024-01-15 10:30:00",
  "is_reward_granted": true,
  "reward_granted_at": "2024-01-15 10:31:00"
}
```

### 🔴 3.7 订单管理 - 列表
**接口**: `GET /api/admin/order/list`

**请求参数**:
```
?pay_status=1&start_date=2024-01-01&end_date=2024-01-31&keyword=张三&page=1&page_size=20
```

**响应数据**:
```json
{
  "total": 100,
  "list": [
    {
      "order_no": "ORD202401150001",
      "user_name": "张三",
      "user_phone": "138****8000",
      "course_name": "初探班",
      "amount": 1688.00,
      "pay_status": 1,
      "pay_time": "2024-01-15 10:30:00",
      "referee_name": "推荐人",
      "is_reward_granted": true
    }
  ]
}
```

### 🔴 3.8 订单管理 - 退款
**接口**: `POST /api/admin/order/refund`

**请求参数**:
```json
{
  "order_no": "ORD202401150001",
  "refund_reason": "用户申请退款"
}
```

**业务逻辑**:
```
1. 执行微信退款
2. 回退功德分/积分
3. 更新订单状态

4. 如果是密训班退款:
   a. 标记主课程(密训班) user_courses 记录失效:
      UPDATE user_courses SET status = 0
      WHERE order_id = {退款订单ID} AND is_gift = 0

   b. 标记赠送课程(初探班) user_courses 记录失效:
      UPDATE user_courses SET status = 0
      WHERE source_order_id = {退款订单ID}

5. 通知用户
```

**响应数据**:
```json
{
  "success": true,
  "refund_no": "RF202401150001",
  "refund_amount": 1688.00,
  "affected_courses": [
    {"course_name": "密训班", "is_gift": false},
    {"course_name": "初探班", "is_gift": true}
  ]
}
```

---

## 4. 预约模块

### 🔵 4.1 课程计划列表
**接口**: `GET /api/appointment/class-plans`

**请求参数**:
```
?course_id=1&status=upcoming
```

**响应数据**:
```json
{
  "list": [
    {
      "id": 1,
      "course_id": 1,
      "course_name": "初探班",
      "class_date": "2024-02-01",
      "class_time": "09:00-17:00",
      "class_location": "深圳市南山区",
      "teacher": "王老师",
      "period": "第10期",
      "total_quota": 30,
      "booked_quota": 15,
      "remaining_quota": 15,
      "booking_deadline": "2024-01-31 18:00:00",
      "retrain_deadline": "2024-01-29 00:00:00",
      "is_booked": false,
      "can_book": true
    }
  ]
}
```

### 🔵 4.2 创建预约
**接口**: `POST /api/appointment/create`

**接口概述**: 创建课程预约,根据上课次数判断是否需要支付复训费

**请求参数**:
```json
{
  "class_record_id": 1,
  "user_course_id": 10
}
```

**业务逻辑**:
```
1. 验证用户已购买该课程(查询 user_courses)
2. 获取用户该课程已上课次数(attend_count)
3. 判断是否需要支付复训费:
   
   IF attend_count = 1:
       首次预约,无需支付
       检查预约截止时间
       检查名额
       创建预约记录(appointments 表)
       返回:
       {
         "need_pay": false,
         "appointment_id": 100,
         "class_date": "2024-02-01"
       }
   
   ELSE IF attend_count > 1:
       需要支付复训费
       检查复训截止时间(开课前3天)
       调用"创建订单接口"(order_type=2)
       返回:
       {
         "need_pay": true,
         "order_no": "ORD202401150001",
         "retrain_price": 500.00,
         "payment_url": "/pages/order/payment/index?order_no=xxx"
       }
```

**特别说明**:
- `attend_count = 1` 表示首次上课(初始化值)
- 首次上课后,签到时 `attend_count` 更新为 2
- 第二次预约时(`attend_count > 1`)才需要复训费

**响应数据**:

首次预约(无需支付):
```json
{
  "need_pay": false,
  "appointment_id": 100,
  "class_record_id": 1,
  "class_date": "2024-02-01",
  "class_location": "深圳市南山区",
  "need_subscribe_message": true
}
```

复训预约(需支付):
```json
{
  "need_pay": true,
  "order_no": "ORD202401150001",
  "retrain_price": 500.00,
  "class_record_id": 1,
  "class_date": "2024-02-01",
  "payment_url": "/pages/order/payment/index?order_no=ORD202401150001"
}
```

**数据库设计注意点**:
- appointments 表:
  - `is_retrain`: BOOLEAN,是否复训
  - `order_no`: VARCHAR(32),关联订单号(复训专用)
- 建议添加索引: (user_id, class_record_id)

### 🔵 4.3 取消预约
**接口**: `DELETE /api/appointment/cancel`

**请求参数**:
```json
{
  "appointment_id": 100,
  "cancel_reason": "时间冲突"
}
```

**业务规则**:
- 复训：开课前3天可取消并退款
- 超过3天不可取消

**业务逻辑**:
```
1. 查询预约信息:
   SELECT a.*, cr.class_date, cr.course_id
   FROM appointments a
   JOIN class_records cr ON a.class_record_id = cr.id
   WHERE a.id = ? AND a.user_id = ?
2. 验证预约状态:
   IF status = 1:  // 已签到
       返回错误: "已签到的预约无法取消"
   IF status = 3:  // 已取消
       返回错误: "该预约已取消"
3. 检查取消时限:
   距离开课天数 = DATEDIFF(class_date, NOW())
   
   IF is_retrain = 1:  // 复训预约
       IF 距离开课天数 < 3:
           返回错误: "开课前3天内无法取消复训预约"
       can_refund = true
   ELSE:  // 首次预约
       IF 距离开课天数 < 1:
           返回错误: "开课前1天内无法取消预约"
       can_refund = false
4. 开启事务:
   a. 更新预约状态:
      UPDATE appointments SET
        status = 3,  // 已取消
        cancel_reason = ?,
        cancel_time = NOW()
      WHERE id = ?
   
   b. 释放课程名额:
      UPDATE class_records SET
        booked_quota = booked_quota - 1
      WHERE id = ?
   
   c. 如果是复训且需要退款:
      IF is_retrain = 1 AND can_refund:
         查询订单: SELECT * FROM orders WHERE order_no = appointment.order_no
         IF order.pay_status = 1:
            - 调用微信退款接口
            - 更新订单状态: pay_status = 4 (已退款)
            - 记录退款时间: refund_time = NOW()
5. 提交事务
6. 发送取消通知给用户
7. 返回取消成功及退款信息(如有)
```

### 🔵 4.4 我的预约
**接口**: `GET /api/appointment/my`

**响应数据**:
```json
{
  "list": [
    {
      "id": 100,
      "course_name": "初探班",
      "class_date": "2024-02-01",
      "class_time": "09:00-17:00",
      "class_location": "深圳市南山区",
      "teacher": "王老师",
      "is_retrain": false,
      "status": 0,
      "checkin_code": "ABC123"
    }
  ]
}
```

### 🔴 4.5 上课记录管理 - 创建
**接口**: `POST /api/admin/class-record/create`

**请求参数**:
```json
{
  "course_id": 1,
  "class_date": "2024-02-01",
  "class_time": "09:00-17:00",
  "class_location": "深圳市南山区",
  "teacher": "王老师",
  "period": "第10期",
  "total_quota": 30
}
```

**业务逻辑**:
- 自动根据课程消息配置生成提醒计划

### 🔴 4.6 签到管理 - 签到
**接口**: `POST /api/admin/attendance/checkin`

**请求参数**:
```json
{
  "class_record_id": 1,
  "user_id": 10,
  "checkin_time": "2024-02-01 09:05:00",
  "remark": ""
}
```

**业务逻辑**:
```
1. 查询预约记录:
   SELECT a.*, uc.attend_count, uc.course_id
   FROM appointments a
   JOIN user_courses uc ON a.user_course_id = uc.id
   WHERE a.class_record_id = ? AND a.user_id = ?
2. 验证预约是否存在:
   IF NOT EXISTS:
       返回错误: "未找到该学员的预约记录"
3. 检查是否重复签到:
   IF appointment.status = 1:  // 已签到
       返回提示: "该学员已签到,签到时间: {checkin_time}"
4. 判断是否首次上课:
   IF attend_count = 1:
       is_first_time = true
   ELSE:
       is_first_time = false
5. 开启事务:
   a. 更新签到记录:
      UPDATE appointments SET
        status = 1,  // 已签到
        checkin_time = ?,
        remark = ?
      WHERE id = ?
   
   b. 更新上课次数:
      UPDATE user_courses SET
        attend_count = attend_count + 1,
        last_attend_time = NOW()
      WHERE id = ?
   
   c. 如果是首次上课,处理推荐人奖励:
      ⚠️ 解冻金额从 ambassador_level_configs.unfreeze_per_referral 读取
      
      IF is_first_time:
         查询推荐人: SELECT referee_id FROM users WHERE id = ?
         IF referee_id IS NOT NULL:
            查询推荐人大使等级和配置:
            SELECT alc.* FROM ambassador_level_configs alc
            WHERE alc.level = referee.ambassador_level
            
            unfreeze_amount = config.unfreeze_per_referral  // 从配置读取
            
            IF unfreeze_amount > 0 AND referee.cash_points_frozen >= unfreeze_amount:
               UPDATE users SET
                 cash_points_frozen = cash_points_frozen - unfreeze_amount,
                 cash_points_available = cash_points_available + unfreeze_amount
               WHERE id = referee_id
               
               INSERT INTO cash_points_records (
                 user_id = referee_id,
                 type = 2,  // 解冻
                 amount = unfreeze_amount,
                 order_no = 对应订单号
               )
               
               // 青鸾大使首次推荐标记
               IF referee.ambassador_level = 2 AND referee.is_first_recommend = false:
                  UPDATE users SET is_first_recommend = true WHERE id = referee_id
6. 提交事务
7. 发送签到成功通知
8. 返回签到成功信息
```

### 🔴 4.7 签到管理 - 签到列表
**接口**: `GET /api/admin/attendance/list`

**请求参数**:
```
?class_record_id=1
```

---

## 5. 商学院模块

### 🔵 5.1 商学院介绍
**接口**: `GET /api/academy/intro`

**响应数据**:
```json
{
  "title": "商学院简介",
  "content": "HTML内容",
  "team": [
    {
      "name": "讲师姓名",
      "avatar": "头像URL",
      "title": "职称",
      "intro": "简介"
    }
  ]
}
```

### 🔵 5.2 朋友圈素材列表
**接口**: `GET /api/academy/materials`

**请求参数**:
```
?category=poster&page=1&page_size=10
```

**响应数据**:
```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "title": "素材标题",
      "category": "poster",
      "category_name": "海报",
      "image_url": "图片URL",
      "content": "文案内容",
      "created_at": "2024-01-15"
    }
  ]
}
```

### 🔵 5.3 学员案例列表
**接口**: `GET /api/academy/cases`

**响应数据**:
```json
{
  "list": [
    {
      "id": 1,
      "student_name": "学员姓名",
      "student_avatar": "头像URL",
      "title": "案例标题",
      "content": "学习心得",
      "video_url": "视频URL",
      "images": ["图片URL1", "图片URL2"]
    }
  ]
}
```

### 🔴 5.4 素材管理 - CRUD
**接口**:
- `POST /api/admin/material/create`
- `PUT /api/admin/material/update`
- `DELETE /api/admin/material/delete`
- `GET /api/admin/material/list`

### 🔴 5.5 学员案例管理 - 创建
**接口**: `POST /api/admin/case/create`

**请求参数**:
```json
{
  "student_name": "学员姓名",
  "student_avatar": "头像URL",
  "title": "案例标题",
  "content": "学习心得",
  "video_url": "视频URL",
  "images": ["图片URL1", "图片URL2"],
  "sort": 1,
  "status": 1
}
```

### 🔴 5.6 学员案例管理 - 更新
**接口**: `PUT /api/admin/case/update`

**请求参数**:
```json
{
  "id": 1,
  "title": "新标题",
  "content": "新内容",
  "sort": 2,
  "status": 1
}
```

### 🔴 5.7 学员案例管理 - 删除
**接口**: `DELETE /api/admin/case/delete`

**请求参数**:
```json
{
  "id": 1
}
```

### 🔴 5.8 学员案例管理 - 列表
**接口**: `GET /api/admin/case/list`

**请求参数**:
```
?status=1&keyword=学员&page=1&page_size=20
```

**响应数据**:
```json
{
  "total": 20,
  "list": [
    {
      "id": 1,
      "student_name": "学员姓名",
      "student_avatar": "头像URL",
      "title": "案例标题",
      "content": "学习心得",
      "video_url": "视频URL",
      "images": ["图片URL1", "图片URL2"],
      "sort": 1,
      "status": 1,
      "created_at": "2024-01-15 10:00:00"
    }
  ]
}
```

### 🔴 5.9 商学院介绍管理 - 获取
**接口**: `GET /api/admin/academy/intro`

**响应数据**:
```json
{
  "id": 1,
  "title": "商学院简介",
  "content": "HTML内容",
  "team": [
    {
      "name": "讲师姓名",
      "avatar": "头像URL",
      "title": "职称",
      "intro": "简介"
    }
  ],
  "updated_at": "2024-01-15 10:00:00"
}
```

### 🔴 5.10 商学院介绍管理 - 更新
**接口**: `PUT /api/admin/academy/intro`

**请求参数**:
```json
{
  "title": "商学院简介",
  "content": "HTML内容",
  "team": [
    {
      "name": "讲师姓名",
      "avatar": "头像URL",
      "title": "职称",
      "intro": "简介"
    }
  ]
}
```

---

## 6. 传播大使模块

### 🔵 6.1 大使信息
**接口**: `GET /api/ambassador/info`

**响应数据**:
```json
{
  "user_id": 1,
  "level": 2,
  "level_name": "青鸾大使",
  "merit_points": 5000.00,
  "cash_points_frozen": 0,
  "cash_points_available": 1688.00,
  "is_first_recommend": false,
  "contract_start": "2024-01-15",
  "contract_end": "2025-01-15",
  "referee_code": "ABC123",
  "total_referees": 10,
  "upgrade_progress": {
    "current_level": 2,
    "next_level": 3,
    "condition": "从 ambassador_level_configs 动态生成升级条件描述",
    "upgrade_payment_amount": 9800.00,
    "gift_quota_basic": 10,
    "gift_quota_advanced": 0
  }
}
```

### 🔵 6.2 申请成为准青鸾大使
**接口**: `POST /api/ambassador/apply`

**请求参数**:
```json
{
  "real_name": "张三",
  "phone": "13800138000",
  "wechat_id": "weixin123",
  "city": "深圳市",
  "occupation": "教育行业",
  "apply_reason": "申请原因",
  "understanding": "对天道文化的理解",
  "willing_help": true,
  "promotion_plan": "推广计划"
}
```

**前置条件**: 必须已购买密训班

**业务逻辑**:
```
1. 验证用户已登录(CloudBase uid)
2. 检查资料是否完善:
   IF profile_completed = 0:
       返回错误: "请先完善个人资料"
3. 检查是否已是大使:
   IF ambassador_level >= 1:
       返回错误: "您已经是传播大使,无需重复申请"
4. 验证前置条件:
   查询用户课程:
   IF NOT EXISTS(
       SELECT 1 FROM user_courses 
       WHERE user_id = ? AND course_type = 2  // 密训班
   ):
       返回错误: "必须先购买密训班才能申请成为传播大使"
5. 检查是否重复申请:
   IF EXISTS(
       SELECT 1 FROM ambassador_applications 
       WHERE user_id = ? AND status IN (0,1,2)  // 待审核/待面试/面试中
   ):
       返回错误: "您已提交申请,请等待审核结果"
6. 验证必填字段:
   IF real_name OR phone OR wechat_id OR city OR apply_reason 为空:
       返回错误: "请填写完整的申请信息"
7. 创建申请记录:
   INSERT INTO ambassador_applications (
     user_id, real_name, phone, wechat_id, city,
     occupation, apply_reason, understanding,
     willing_help, promotion_plan,
     status = 0,  // 待审核
     created_at = NOW()
   )
8. 发送通知给管理员(待审核提醒)
9. 返回申请成功信息:
   {
     "application_id": xxx,
     "status": 0,
     "message": "申请已提交,请耐心等待审核"
   }
```

### 🔵 6.3 查看申请状态
**接口**: `GET /api/ambassador/apply-status`

**响应数据**:
```json
{
  "status": 2,
  "status_name": "面试通过",
  "interview_time": "2024-01-20 14:00:00",
  "interview_remark": "请准时参加面试",
  "reject_reason": null
}
```

**状态枚举值**:
- `0`: 待审核
- `1`: 待面试
- `2`: 面试通过
- `3`: 已拒绝

### 🔵 6.4 生成推荐二维码
**接口**: `GET /api/ambassador/qrcode`

**云函数**: `ambassador` → `client:generateQRCode`

**前置条件**: 准青鸾及以上等级

**实现方式**: 调用 `business-logic` 层的 `generateAmbassadorQRCode` 方法

> 📖 **SDK 文档**: [`cloudfunctions/layers/business-logic/QRCODE_SDK.md`](cloudfunctions/layers/business-logic/QRCODE_SDK.md)

**业务逻辑**:
```javascript
// 云函数实现示例
case 'client:generateQRCode': {
  const business = require('/opt/business-logic');

  // 1. 验证用户是传播大使
  if (user.ambassador_level < 1) {
    return errorResponse('仅限传播大使使用该功能', null, 403);
  }

  // 2. 检查协议有效性
  const [contract] = await query(
    `SELECT * FROM contract_signatures
     WHERE user_id = ? AND status = 1
     ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  if (!contract || new Date(contract.contract_end) < new Date()) {
    return errorResponse('协议已过期,请先续签协议', null, 403);
  }

  // 3. 检查是否已有二维码
  if (user.qrcode_url) {
    return successResponse({
      qrcode_url: user.qrcode_url,
      referee_code: user.referee_code,
      level: user.ambassador_level,
      level_name: getLevelName(user.ambassador_level),
      tip: getTipByLevel(user.ambassador_level)
    });
  }

  // 4. 生成推荐码（如果没有）
  let referralCode = user.referee_code;
  if (!referralCode) {
    referralCode = generateReferralCode(); // 6位字母数字
    await update(
      'UPDATE users SET referee_code = ? WHERE id = ?',
      [referralCode, user.id]
    );
  }

  // 5. 调用 SDK 生成二维码并上传云存储
  const result = await business.generateAmbassadorQRCode({
    ambassadorId: user.uid,
    referralCode: referralCode,
    width: 430
  });

  // 6. 保存二维码URL到数据库
  await update(
    'UPDATE users SET qrcode_url = ? WHERE id = ?',
    [result.fileID, user.id]
  );

  // 7. 返回结果
  return successResponse({
    qrcode_url: result.fileID,
    referee_code: referralCode,
    level: user.ambassador_level,
    level_name: getLevelName(user.ambassador_level),
    tip: getTipByLevel(user.ambassador_level)
  });
}
```

**SDK 调用说明**:
```javascript
const business = require('/opt/business-logic');

// 生成大使推广码（自动上传云存储）
const result = await business.generateAmbassadorQRCode({
  ambassadorId: 'amb_123456',  // 大使 ID（用于文件命名）
  referralCode: 'A12345',      // 推荐码（编码到 scene 参数）
  width: 430                   // 可选，二维码宽度
});

// result 返回值
// {
//   buffer: Buffer,           // 图片二进制数据
//   cloudPath: string,        // 云存储路径：qrcodes/ambassadors/{id}_{timestamp}.png
//   fileID: string            // 云存储文件 ID（存入数据库）
// }
```

**小程序端解析推荐码**:
```javascript
// pages/auth/login/index.js
Page({
  onLoad(query) {
    if (query.scene) {
      const scene = decodeURIComponent(query.scene);
      // scene = 'ref=A12345'

      const params = {};
      scene.split('&').forEach(part => {
        const [key, value] = part.split('=');
        if (key) params[key] = value;
      });

      if (params.ref) {
        // 记录推荐人
        this.setData({ referralCode: params.ref });
      }
    }
  }
});
```

**数据库字段**:
- `users.qrcode_url`: 存储云存储文件 ID（格式：`cloud://xxx/qrcodes/ambassadors/{uid}_{timestamp}.png`）
- `users.referee_code`: 6位推荐码（大写字母+数字）

**响应数据**:
```json
{
  "qrcode_url": "cloud://cloud1-xxx/qrcodes/ambassadors/amb_123_1699999999999.png",
  "referee_code": "A12345",
  "level": 1,
  "level_name": "准青鸾大使",
  "tip": "您当前为准青鸾大使，暂时只能推荐初探班学员"
}
```

**注意事项**:
1. **scene 参数限制**: 最大 32 字符，只支持数字、英文及部分特殊字符
2. **小程序需已发布**: 生成的二维码只能打开已发布的小程序
3. **数量无限制**: 使用 `getUnlimited` 接口，生成数量无限制
4. **缓存策略**: 二维码生成后存入数据库，下次直接返回，避免重复生成

### 🔵 6.5 推荐学员列表
**接口**: `GET /api/ambassador/referees`

**响应数据**:
```json
{
  "total": 10,
  "stats": {
    "total_count": 10,
    "course_1_count": 8,
    "course_2_count": 2,
    "ambassador_count": 3
  },
  "list": [
    {
      "user_id": 50,
      "nickname": "学员昵称",
      "avatar": "头像URL",
      "phone": "138****8000",
      "level": 2,
      "level_name": "青鸾大使",
      "created_at": "2024-01-15",
      "total_amount": 40576.00,
      "course_count": 2,
      "merit_points_gained": 1200.00,
      "cash_points_gained": 1688.00
    }
  ]
}
```

### 🔵 6.6 功德分余额
**接口**: `GET /api/merit-points/balance`

**响应数据**:
```json
{
  "balance": 5000.00,
  "total_gained": 8000.00,
  "total_used": 3000.00
}
```

### 🔵 6.7 功德分明细
**接口**: `GET /api/merit-points/records`

**请求参数**:
```
?source=1&page=1&page_size=20
```

**来源枚举值(source)**:
- `1`: 推荐初探班
- `2`: 推荐密训班
- `3`: 辅导员
- `4`: 义工
- `5`: 沙龙活动
- `6`: 兑换
- `7`: 其他

**响应数据**:
```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "source": 2,
      "source_name": "推荐密训班",
      "amount": 7777.60,
      "order_no": "ORD202401150001",
      "referee_user_name": "学员姓名",
      "activity_name": null,
      "remark": "",
      "created_at": "2024-01-15 10:31:00"
    }
  ]
}
```

### 🔵 6.8 积分余额
**接口**: `GET /api/cash-points/balance`

**响应数据**:
```json
{
  "frozen": 0,
  "available": 1688.00,
  "total_withdrawn": 0,
  "pending_withdrawal": 0
}
```

### 🔵 6.9 积分明细
**接口**: `GET /api/cash-points/records`

**响应数据**:
```json
{
  "total": 2,
  "list": [
    {
      "id": 1,
      "type": 1,
      "type_name": "获得冻结",
      "amount": 1688.00,
      "order_no": null,
      "remark": "升级为青鸾大使",
      "created_at": "2024-01-10 10:00:00"
    },
    {
      "id": 2,
      "type": 2,
      "type_name": "解冻",
      "amount": 1688.00,
      "order_no": "ORD202401150001",
      "referee_user_name": "学员A",
      "created_at": "2024-01-15 10:31:00"
    }
  ]
}
```

### 🔵 6.10 申请提现
**接口**: `POST /api/cash-points/withdraw`

**请求参数**:
```json
{
  "amount": 1688.00,
  "account_type": 1,
  "account_info": {
    "account_name": "张三",
    "account_no": "微信账号"
  }
}
```

**业务逻辑**:
```
1. 验证用户资格:
   IF ambassador_level < 1:
       返回错误: "仅限传播大使提现"
   IF profile_completed = 0:
       返回错误: "请先完善个人资料"
2. 验证提现金额:
   IF amount < 100:
       返回错误: "最低提现金额为100元"
   IF amount > 50000:
       返回错误: "单笔提现最高金额为50000元"
   IF amount > cash_points_available:
       返回错误: "可提现积分不足,当前可提现: {cash_points_available}元"
3. 验证是否有待处理提现:
   IF EXISTS(
       SELECT 1 FROM withdrawals 
       WHERE user_id = ? AND status IN (0,1)  // 待审核/审核通过待转账
   ):
       返回错误: "您有待处理的提现申请,请等待处理完成"
4. 验证账户信息:
   IF account_type = 1:  // 微信
       验证 account_name 和 account_no 不为空
   ELSE IF account_type = 2:  // 支付宝
       验证账户信息格式
   ELSE IF account_type = 3:  // 银行卡
       验证银行卡号、开户行等信息
5. 开启事务:
   a. 冻结提现金额:
      UPDATE users SET
        cash_points_available = cash_points_available - ?,
        cash_points_pending = cash_points_pending + ?
      WHERE id = ? AND cash_points_available >= ?
   
   b. 创建提现记录:
      withdraw_no = "WD" + YYYYMMDD + 8位随机数
      INSERT INTO withdrawals (
        withdraw_no, user_id, amount,
        account_type, account_info,
        status = 0,  // 待审核
        apply_time = NOW()
      )
   
   c. 插入积分明细:
      INSERT INTO cash_points_records (
        user_id, type = 4,  // 提现申请
        amount = -amount,
        withdraw_no,
        remark = "申请提现"
      )
6. 提交事务
7. 发送审核通知给管理员
8. 返回提现申请成功:
   {
     "withdraw_no": xxx,
     "amount": xxx,
     "status": "待审核",
     "tip": "预计1-3个工作日内审核完成"
   }
```

### 🔵 6.11 提现记录
**接口**: `GET /api/cash-points/withdraw-list`

**响应数据**:
```json
{
  "list": [
    {
      "withdraw_no": "WD202401150001",
      "amount": 1688.00,
      "account_type": 1,
      "account_type_name": "微信",
      "status": 2,
      "status_name": "已转账",
      "apply_time": "2024-01-15 15:00:00",
      "transfer_time": "2024-01-16 10:00:00"
    }
  ]
}
```

### 🔵 6.12 商城商品列表
**接口**: `GET /api/mall/goods/list`

**接口概述**: 获取商城可兑换商品列表

**请求参数**:
```
?keyword=初探班    // 可选：关键词搜索
&page=1
&page_size=10
```

**业务逻辑**:
- 查询 mall_goods 表, status=1 的商品
- 按 sort_order 排序
- 商品不分类型(无实物/虚拟之分),都是现场兑换

**响应数据**:
```json
{
  "total": 10,
  "page": 1,
  "page_size": 10,
  "list": [
    {
      "id": 1,
      "goods_name": "初探班名额券",
      "goods_image": "图片URL",
      "merit_points_price": 1688.00,
      "stock_quantity": 50,
      "description": "商品描述",
      "sold_quantity": 20
    }
  ]
}
```

**数据库设计注意点**:
- **mall_goods 表关键字段**:
  - `goods_name`: VARCHAR(100),商品名称
  - `goods_image`: VARCHAR(255),商品图片
  - `description`: TEXT,商品描述
  - `merit_points_price`: DECIMAL(10,2),功德分价格
  - `stock_quantity`: INT(-1表示无限库存)
  - `sold_quantity`: INT,已售数量
  - `status`: TINYINT(0下架/1上架)
  - `sort_order`: INT,排序
- **说明**:
  - 不需要 goods_type 字段(商品不分类型)
  - 不需要物流相关字段(现场兑换)
  - status 用于上下架控制

### 🔵 6.13 创建兑换订单
**接口**: `POST /api/mall/exchange`

**接口概述**: 使用功德分(+积分)兑换商品,直接完成扣除

**重要说明**:
- 不走支付接口,在商城页面直接完成
- 不创建 orders 表记录
- 直接扣除功德分/积分并创建兑换记录

**请求参数**:
```json
{
  "goods_id": 1,
  "quantity": 1,
  "use_cash_points_if_not_enough": true
}
```

**业务逻辑**:
```
1. 验证用户已完善资料(profile_completed = 1)
2. 验证商品存在和库存充足
3. 计算混合支付:
   总成本 = goods.merit_points_price * quantity
   
   IF user.merit_points >= 总成本:
       merit_points_used = 总成本
       cash_points_used = 0
   ELSE IF use_cash_points_if_not_enough = true:
       merit_points_used = user.merit_points
       cash_points_used = 总成本 - merit_points_used
       
       IF user.cash_points_available < cash_points_used:
           返回错误:"现金积分不足,还需XXX积分"
   ELSE:
       返回错误:"功德分不足,还需XXX功德分"

4. 开启事务
5. 扣除功德分和积分:
   UPDATE users SET 
     merit_points = merit_points - {merit_points_used},
     cash_points_available = cash_points_available - {cash_points_used}
   WHERE id = {user_id}

6. 更新商品库存(如果 stock_quantity != -1):
   UPDATE mall_goods SET 
     sold_quantity = sold_quantity + {quantity},
     stock_quantity = stock_quantity - {quantity}
   WHERE id = {goods_id} AND stock_quantity >= {quantity}

7. 创建兑换记录:
   INSERT INTO mall_exchange_records (...)

8. 插入功德分/积分明细记录

9. 提交事务

10. 返回兑换成功
```

**响应数据**:
```json
{
  "exchange_no": "EX202401150001",
  "goods_name": "初探班名额券",
  "merit_points_used": 1500.00,
  "cash_points_used": 188.00,
  "status": "兑换成功",
  "pickup_info": "请凭兑换单号到前台领取"
}
```

**数据库设计注意点**:
- **mall_exchange_records 表**(兑换记录):
  - `exchange_no`: VARCHAR(32) UNIQUE,兑换单号
  - `user_id`: INT,用户ID
  - `goods_id`: INT,商品ID
  - `goods_name`: VARCHAR(100),商品名称(冗余存储)
  - `quantity`: INT,兑换数量
  - `merit_points_used`: DECIMAL(10,2),使用功德分
  - `cash_points_used`: DECIMAL(10,2),补充的积分
  - `total_cost`: DECIMAL(10,2),总成本
  - `status`: TINYINT(1已兑换/2已领取/3已取消)
  - `created_at`: DATETIME
- **注意**:
  - 无需物流字段(现场兑换)
  - 无需虚拟/实物区分字段
  - status 可用于追踪领取状态

### 🔵 6.14 兑换记录列表
**接口**: `GET /api/merit-points/exchange-records`

**接口概述**: 查询用户的功德分兑换记录

**请求参数**:
```
?status=1        // 可选：状态筛选(1已兑换/2已领取)
&page=1
&page_size=10
```

**业务逻辑**:
- 查询 mall_exchange_records 表
- 按创建时间倒序

**响应数据**:
```json
{
  "total": 5,
  "page": 1,
  "page_size": 10,
  "list": [
    {
      "exchange_no": "EX202401150001",
      "goods_name": "初探班名额券",
      "quantity": 1,
      "merit_points_used": 1500.00,
      "cash_points_used": 188.00,
      "total_cost": 1688.00,
      "status": 1,
      "status_name": "已兑换",
      "created_at": "2024-01-15 10:00:00"
    }
  ]
}
```

### 🔵 6.15 查询我的名额
**接口**: `GET /api/ambassador/my-quotas`

**接口概述**: 查询大使的可用名额（适用于所有拥有赠送名额的大使等级，包括但不限于鸿鹄大使、金凤大使等）

**响应数据**:
```json
{
  "list": [
    {
      "id": 1,
      "quota_type": 1,
      "quota_type_name": "初探班名额",
      "source_type": 1,
      "source_type_name": "大使升级",
      "total_quantity": 10,
      "used_quantity": 3,
      "remaining_quantity": 7,
      "expire_date": "2025-01-15",
      "days_remaining": 250,
      "ambassador_level": 3,
      "ambassador_level_name": "鸿鹄大使"
    }
  ],
  "summary": {
    "total_remaining": 7
  }
}
```

**业务逻辑**:
- 查询 ambassador_quotas 表
- 筛选 status=1 且未过期的记录
- 计算剩余天数

**数据库设计注意点**:
- **ambassador_quotas 表**(大使名额表):
  - `ambassador_id`: 大使ID
  - `ambassador_level`: 大使等级(2青鸾/3鸿鹄/4金凤等)
  - `quota_type`: 名额类型(1初探班/2密训班)
  - `source_type`: 来源类型(1大使升级/2活动奖励/3系统发放)
  - `total_quantity`: 总数量
  - `used_quantity`: 已使用数量
  - `remaining_quantity`: 剩余数量
  - `expire_date`: 过期日期
  - `status`: 状态(1有效/0失效)
- **quota_usage_records 表**(名额使用记录):
  - `quota_id`: 名额ID
  - `ambassador_id`: 大使ID
  - `recipient_id`: 受赠人ID
  - `recipient_name`: 受赠人姓名
  - `usage_type`: 使用类型(1赠送/2核销)
  - `course_id`: 课程ID
  - `status`: 状态(1已赠送/2已核销/3已取消)
- **说明**: 名额管理适用于所有拥有赠送权限的大使等级，不同等级的名额数量、类型和有效期可能不同

### 🔵 6.16 赠送名额
**接口**: `POST /api/ambassador/gift-quota`

**接口概述**: 大使赠送名额给用户（适用于所有拥有赠送名额的大使等级）

**请求参数**:
```json
{
  "quota_id": 1,
  "recipient_phone": "13800138000",
  "recipient_name": "张三",
  "message": "赠送初探班名额"
}
```

**业务逻辑**:
```
1. 验证名额充足(remaining_quantity > 0)
2. 验证名额未过期
3. 查询或创建受赠人用户记录
4. 创建赠送记录(quota_usage_records 表)
5. 扣减剩余名额:
   UPDATE ambassador_quotas SET
     used_quantity = used_quantity + 1,
     remaining_quantity = remaining_quantity - 1
   WHERE id = {quota_id}
6. 生成课程兑换券给受赠人
7. 发送通知给受赠人
```

**响应数据**:
```json
{
  "success": true,
  "usage_record_id": 100,
  "recipient_name": "张三",
  "remaining_quantity": 6
}
```

### 🔴 6.12 大使申请管理 - 列表
**接口**: `GET /api/admin/ambassador/applications`

**请求参数**:
```
?status=0&keyword=张三&page=1&page_size=20
```

**状态枚举值(status)**:
- `0`: 待审核
- `1`: 待面试
- `2`: 面试通过
- `3`: 已拒绝

### 🔴 6.13 大使申请管理 - 审核
**接口**: `POST /api/admin/ambassador/audit`

**请求参数**:
```json
{
  "application_id": 1,
  "action": "approve",  // approve/reject/arrange_interview
  "interview_time": "2024-01-20 14:00:00",
  "interview_remark": "面试备注",
  "reject_reason": "拒绝原因"
}
```

**业务逻辑**:
```
1. 查询申请记录:
   SELECT * FROM ambassador_applications WHERE id = ?
2. 验证申请状态:
   IF status NOT IN (0, 2):  // 仅待审核和待面试可操作
       返回错误: "该申请已处理,当前状态: {status_name}"
3. 验证操作权限:
   检查管理员是否有审核权限
4. 根据操作类型处理:
   
   IF action = "approve":  // 通过
       a. 开启事务
       b. 更新申请状态:
          UPDATE ambassador_applications SET
            status = 3,  // 已通过
            audit_admin_id = ?,
            audit_time = NOW(),
            audit_remark = ?
          WHERE id = ?
       
       c. 更新用户等级:
          UPDATE users SET
            ambassador_level = 1,  // 准青鸾
            ambassador_start_date = NOW()
          WHERE id = application.user_id
       
       d. 提交事务
       e. 发送通过通知给用户
       f. 返回: "审核通过,用户已升级为准青鸾大使"
   
   ELSE IF action = "arrange_interview":  // 安排面试
       IF interview_time 为空:
           返回错误: "请填写面试时间"
       
       UPDATE ambassador_applications SET
         status = 2,  // 待面试
         interview_time = ?,
         interview_remark = ?,
         audit_admin_id = ?
       WHERE id = ?
       
       发送面试通知给用户(包含面试时间和地点)
       返回: "已安排面试"
   
   ELSE IF action = "reject":  // 拒绝
       IF reject_reason 为空:
           返回错误: "请填写拒绝原因"
       
       UPDATE ambassador_applications SET
         status = 4,  // 已拒绝
         reject_reason = ?,
         audit_admin_id = ?,
         audit_time = NOW()
       WHERE id = ?
       
       发送拒绝通知给用户(包含拒绝原因)
       返回: "已拒绝申请"
   
   ELSE:
       返回错误: "无效的操作类型"
5. 记录操作日志:
   INSERT INTO admin_operation_logs (
     admin_id, operation_type = "ambassador_audit",
     related_id = application_id,
     action, remark
   )
6. 返回处理结果
```

### 🔴 6.14 大使管理 - 列表
**接口**: `GET /api/admin/ambassador/list`

**请求参数**:
```
?level=2&keyword=张三&page=1&page_size=20
```

### 🔴 6.15 大使管理 - 详情
**接口**: `GET /api/admin/ambassador/detail`

**请求参数**:
```
?user_id=10
```

**响应数据**:
```json
{
  "user_info": {},
  "merit_points": {
    "balance": 5000.00,
    "total_gained": 8000.00,
    "total_used": 3000.00
  },
  "cash_points": {
    "frozen": 0,
    "available": 1688.00,
    "total_withdrawn": 0
  },
  "referees": [],
  "activities": [],
  "orders": []
}
```

### 🔴 6.16 活动记录管理 - 添加
**接口**: `POST /api/admin/activity/create`

**请求参数**:
```json
{
  "user_id": 10,
  "activity_type": 3,
  "activity_name": "辅导员活动",
  "activity_date": "2024-01-20",
  "activity_location": "深圳",
  "merit_points": 500.00,
  "remark": ""
}
```

**活动类型枚举(activity_type)**:
- `3`: 辅导员
- `4`: 义工
- `5`: 沙龙活动
- `7`: 其他

### 🔴 6.17 活动记录管理 - 列表
**接口**: `GET /api/admin/activity/list`

**请求参数**:
```
?user_id=10&activity_type=1&start_date=2024-01-01&page=1&page_size=20
```

**响应数据**:
```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "user_id": 10,
      "user_name": "大使姓名",
      "activity_type": 3,
      "activity_type_name": "辅导员",
      "activity_name": "第10期初探班辅导",
      "activity_date": "2024-01-20",
      "activity_location": "深圳",
      "merit_points": 500.00,
      "remark": "",
      "admin_name": "管理员",
      "created_at": "2024-01-21 10:00:00"
    }
  ]
}
```

### 🔴 6.18 活动记录管理 - 更新
**接口**: `PUT /api/admin/activity/update`

**请求参数**:
```json
{
  "id": 1,
  "activity_name": "新活动名称",
  "merit_points": 600.00,
  "remark": "更新备注"
}
```

### 🔴 6.19 活动记录管理 - 删除
**接口**: `DELETE /api/admin/activity/delete`

**请求参数**:
```json
{
  "id": 1
}
```

**业务逻辑**:
```
1. 删除活动记录
2. 回退已发放的功德分:
   UPDATE users SET merit_points = merit_points - {activity.merit_points}
   WHERE id = {activity.user_id}
3. 插入功德分明细记录(type=回退)
4. 记录操作日志
```

### 🔵 6.17 大使升级接口
**接口**: `POST /api/ambassador/upgrade`

**接口概述**: 统一的大使升级接口,支持所有等级升级

**请求参数**:
```json
{
  "target_level": 2,
  "upgrade_type": 1
}
```

**参数说明**:
- `target_level`: 目标等级(1准青鸾/2青鸾/3鸿鹄)
- `upgrade_type`: 升级类型(1支付类型/2协议类型)

**业务逻辑**:

⚠️ 所有金额/积分/名额均从 `ambassador_level_configs` 表动态读取：
```
SELECT * FROM ambassador_level_configs WHERE level = target_level
```

**准青鸾→青鸾(upgrade_type=2,无需支付)**:
```
1. 验证条件:推荐初探班成功1次
2. 验证协议:必须已签署《青鸾大使协议》
3. 读取青鸾配置: SELECT * FROM ambassador_level_configs WHERE level = 2
4. 直接升级:
   - 更新 ambassador_level = 2
   - 如 config.frozen_points > 0:
     发放 config.frozen_points 冻结积分
5. 返回升级成功
```

**青鸾→鸿鹄(upgrade_type=1,需支付)**:
```
1. 验证条件:已签署《鸿鹄大使补充协议》
2. 读取鸿鹄配置: SELECT * FROM ambassador_level_configs WHERE level = 3
3. 创建订单(调用创建订单接口,order_type=4,金额=config.upgrade_payment_amount)
4. 返回订单信息和支付链接
5. 支付成功后在支付回调中完成升级(发放名额/积分等)
```

**响应数据**:

协议类型(无需支付):
```json
{
  "success": true,
  "new_level": 2,
  "new_level_name": "青鸾大使",
  "rewards": {
    "frozen_points": 1688.00,
    "_note": "frozen_points 从 ambassador_level_configs.frozen_points 读取"
  }
}
```

支付类型(需支付):
```json
{
  "need_pay": true,
  "order_no": "ORD202401150001",
  "amount": 9800.00,
  "_note": "amount 从 ambassador_level_configs.upgrade_payment_amount 读取",
  "payment_url": "/pages/order/payment/index?order_no=ORD202401150001"
}
```

**数据库设计注意点**:
- users 表的 ambassador_level 字段记录当前等级
- 升级记录可在 ambassador_upgrade_logs 表中追踪

### 🔵 6.18 获取升级指南信息
**接口**: `GET /api/ambassador/upgrade-guide`

**接口概述**: 获取用户当前等级和升级条件

**响应数据**:
```json
{
  "current_level": 1,
  "current_level_name": "准青鸾大使",
  "next_level": 2,
  "next_level_name": "青鸾大使",
  "upgrade_type": 2,
  "upgrade_type_name": "协议类型(无需支付)",
  "upgrade_conditions": [
    {
      "condition": "推荐初探班成功1次",
      "is_met": true
    },
    {
      "condition": "签署《青鸾大使协议》",
      "is_met": false,
      "action_text": "立即签署",
      "action_url": "/pages/ambassador/contract-sign/index?type=2"
    }
  ],
  "can_upgrade": false
}
```

**业务逻辑**:
```
1. 获取用户当前等级
2. 判断下一等级和升级类型:
   - 准青鸾→青鸾: upgrade_type=2(协议)
   - 青鸾→鸿鹄: upgrade_type=1(支付)
3. 检查升级条件是否满足
4. 检查是否已签署对应协议
5. 返回条件列表和可操作链接
```

### 🔴 6.19 积分提现审核
**接口**: `POST /api/admin/withdraw/audit`

**请求参数**:
```json
{
  "withdraw_no": "WD202401150001",
  "action": "approve",  // approve/reject
  "reject_reason": "拒绝原因"
}
```

---

## 7. 协议模块

### 🔵 7.1 获取协议模板
**接口**: `GET /api/contract/template`

**请求参数**:
```
?contract_type=1&ambassador_level=2
```

**业务逻辑**:
```
1. 验证用户已登录
2. 查询最新协议模板:
   SELECT * FROM contract_templates
   WHERE contract_type = ? 
     AND ambassador_level = ?
     AND status = 1  // 启用状态
   ORDER BY version DESC, created_at DESC
   LIMIT 1
3. 验证模板是否存在:
   IF NOT EXISTS:
       返回错误: "暂无可用的协议模板"
4. 获取当前用户信息:
   SELECT real_name, phone, city, referee.real_name as referee_name
   FROM users u
   LEFT JOIN users referee ON u.referee_id = referee.id
   WHERE u.id = ?
5. 填充协议变量:
   定义变量映射:
   {
     "{{real_name}}": user.real_name,
     "{{phone}}": user.phone,
     "{{city}}": user.city,
     "{{referee_name}}": user.referee_name || "无",
     "{{today}}": FORMAT(NOW(), "YYYY年MM月DD日"),
     "{{contract_start}}": FORMAT(NOW(), "YYYY年MM月DD日"),
     "{{contract_end}}": FORMAT(NOW() + 1年, "YYYY年MM月DD日"),
     "{{ambassador_level_name}}": 根据level返回名称,
     "{{year}}": YEAR(NOW())
   }
   
   content = template.content
   FOR EACH variable IN 变量映射:
       content = content.replace(variable.key, variable.value)
6. 检查用户是否已签署:
   SELECT id FROM contract_signatures
   WHERE user_id = ? 
     AND contract_template_id = ?
     AND status = 1
   
   IF EXISTS:
       already_signed = true
   ELSE:
       already_signed = false
7. 返回处理后的协议内容和状态
```

**响应数据**:
```json
{
  "id": 1,
  "contract_name": "传播大使合作协议",
  "contract_type": 1,
  "version": "v1.0",
  "content": "协议HTML内容（已填充用户变量）",
  "effective_time": "2024-01-01"
}
```

### 🔵 7.2 签署协议
**接口**: `POST /api/contract/sign`

**请求参数**:
```json
{
  "contract_template_id": 1,
  "ambassador_level": 2,
  "sign_phone_suffix": "8000",
  "sign_device": {
    "model": "iPhone 15 Pro",
    "os": "iOS",
    "version": "17.2"
  }
}
```

**业务逻辑**:
- 验证手机号后四位
- 记录签署IP和设备信息
- 保存协议完整快照
- 设置合同期限（1年）
- 防止重复签署

**响应数据**:
```json
{
  "signature_id": 10,
  "sign_time": "2024-01-15 10:00:00",
  "contract_start": "2024-01-15",
  "contract_end": "2025-01-15"
}
```

### 🔵 7.3 我的协议列表
**接口**: `GET /api/contract/my-list`

**响应数据**:
```json
{
  "list": [
    {
      "id": 10,
      "contract_name": "传播大使合作协议",
      "sign_time": "2024-01-15 10:00:00",
      "status": 1,
      "status_name": "有效",
      "contract_start": "2024-01-15",
      "contract_end": "2025-01-15",
      "remaining_days": 300
    }
  ]
}
```

### 🔵 7.4 协议详情
**接口**: `GET /api/contract/detail`

**请求参数**:
```
?signature_id=10
```

**响应数据**:
```json
{
  "id": 10,
  "contract_name": "传播大使合作协议",
  "contract_version": "v1.0",
  "contract_content": "协议完整HTML",
  "sign_time": "2024-01-15 10:00:00",
  "sign_ip": "192.168.1.1",
  "sign_device": {},
  "contract_start": "2024-01-15",
  "contract_end": "2025-01-15",
  "status": 1
}
```

### 🔴 7.5 协议模板管理 - CRUD
**接口**:
- `POST /api/admin/contract/template-create`
- `PUT /api/admin/contract/template-update`
- `DELETE /api/admin/contract/template-delete`
- `GET /api/admin/contract/template-list`
- `GET /api/admin/contract/template-versions`

### 🔴 7.6 协议签署记录管理
**接口**: `GET /api/admin/contract/signature-list`

**请求参数**:
```
?contract_type=1&status=1&start_date=2024-01-01&keyword=张三&page=1&page_size=20
```

### 🔴 7.7 协议到期提醒列表
**接口**: `GET /api/admin/contract/expiring-list`

**请求参数**:
```
?days=30  // 30天内到期
```

### 🔴 7.8 手动续签协议
**接口**: `POST /api/admin/contract/renew`

**请求参数**:
```json
{
  "user_id": 10,
  "renew_years": 1
}
```

**业务逻辑**:
```
1. 验证管理员权限
2. 查询用户信息:
   SELECT * FROM users WHERE id = ?
3. 验证用户是否是大使:
   IF ambassador_level < 1:
       返回错误: "该用户不是传播大使,无需签署协议"
4. 查询用户最近的协议签署记录:
   SELECT * FROM contract_signatures
   WHERE user_id = ? AND status = 1
   ORDER BY created_at DESC
   LIMIT 1
5. 判断是否需要续签:
   IF EXISTS AND contract_end > NOW() + 3个月:
       返回提示: "协议尚未临近到期(到期日: {contract_end}),确认要续签吗?"
6. 获取最新协议模板:
   SELECT * FROM contract_templates
   WHERE contract_type = 1
     AND ambassador_level = user.ambassador_level
     AND status = 1
   ORDER BY version DESC LIMIT 1
7. 填充协议内容(同获取协议模板逻辑):
   使用用户信息填充变量
8. 开启事务:
   a. 如果存在旧协议,更新为已过期:
      UPDATE contract_signatures SET
        status = 2  // 已过期
      WHERE id = old_contract_id
   
   b. 创建新的签署记录:
      contract_start = MAX(NOW(), old_contract_end)  // 从旧协议到期日或当前时间开始
      contract_end = contract_start + renew_years年
      
      INSERT INTO contract_signatures (
        user_id, contract_template_id,
        ambassador_level = user.ambassador_level,
        contract_name = template.contract_name,
        contract_version = template.version,
        contract_content = 填充后的协议内容,
        contract_start,
        contract_end,
        sign_time = NOW(),
        sign_type = 2,  // 管理员续签
        admin_id = ?,
        status = 1  // 有效
      )
9. 提交事务
10. 发送续签通知给用户:
    - 包含新的合同期限
    - 提醒用户协议内容
11. 记录操作日志:
    INSERT INTO admin_operation_logs (
      admin_id, operation_type = "contract_renew",
      related_id = user_id,
      remark = "手动续签协议{renew_years}年"
    )
12. 返回续签成功信息:
    {
      "signature_id": xxx,
      "contract_start": xxx,
      "contract_end": xxx,
      "message": "协议续签成功"
    }
```

---

## 8. 反馈模块

### 🔵 8.1 获取可反馈课程列表
**接口**: `GET /api/feedback/my-courses`

**响应数据**:
```json
{
  "list": [
    {
      "course_id": 1,
      "course_name": "初探班"
    }
  ]
}
```

### 🔵 8.2 获取反馈类型
**接口**: `GET /api/feedback/types`

**请求参数**:
```
?course_id=1  // 可选
```

**响应数据**:
```json
{
  "types": [
    {
      "value": 2,
      "label": "课程内容"
    },
    {
      "value": 3,
      "label": "课程服务"
    }
  ]
}
```

### 🔵 8.3 提交反馈
**接口**: `POST /api/feedback/submit`

**请求参数**:
```json
{
  "course_id": 1,  // 可选
  "feedback_type": 2,
  "content": "反馈内容",
  "images": ["图片URL1", "图片URL2"],
  "contact": "联系方式"
}
```

### 🔵 8.4 我的反馈列表
**接口**: `GET /api/feedback/my-list`

**响应数据**:
```json
{
  "list": [
    {
      "id": 1,
      "course_name": "初探班",
      "feedback_type": 2,
      "feedback_type_name": "课程内容",
      "content": "反馈内容",
      "status": 2,
      "status_name": "已处理",
      "reply": "回复内容",
      "created_at": "2024-01-15 10:00:00"
    }
  ]
}
```

### 🔴 8.5 反馈管理 - 列表
**接口**: `GET /api/admin/feedback/list`

**请求参数**:
```
?status=0&feedback_type=2&course_id=1&page=1&page_size=20
```

### 🔴 8.6 反馈管理 - 回复
**接口**: `POST /api/admin/feedback/reply`

**请求参数**:
```json
{
  "feedback_id": 1,
  "reply": "回复内容",
  "status": 2  // 更新为已处理
}
```

---

## 9. 消息提醒模块

### 🔵 9.1 获取消息配置
**接口**: `GET /api/notification/configs`

**请求参数**:
```
?course_id=1
```

### 🔵 9.2 订阅消息授权
**接口**: `POST /api/notification/subscribe`

**请求参数**:
```json
{
  "tmpl_ids": ["模板ID1", "模板ID2"]
}
```

### 🔴 9.3 消息配置管理 - CRUD
**接口**:
- `POST /api/admin/notification/config-create`
- `PUT /api/admin/notification/config-update`
- `GET /api/admin/notification/config-list`

### 🔴 9.4 消息发送记录
**接口**: `GET /api/admin/notification/logs`

**请求参数**:
```
?class_record_id=1&status=2&page=1&page_size=20
```

### 🔴 9.5 手动发送消息
**接口**: `POST /api/admin/notification/send`

**请求参数**:
```json
{
  "class_record_id": 1,
  "user_ids": [1, 2, 3],  // 可选，不传则发送给所有已预约学员
  "message_content": "自定义消息内容"
}
```

**业务逻辑**:
```
1. 验证管理员权限
2. 查询上课记录信息:
   SELECT cr.*, c.name as course_name
   FROM class_records cr
   JOIN courses c ON cr.course_id = c.id
   WHERE cr.id = ?
3. 验证上课记录是否存在:
   IF NOT EXISTS:
       返回错误: "上课记录不存在"
4. 确定接收人列表:
   IF user_ids 为空或null:
       // 发送给所有已预约学员
       SELECT DISTINCT u.id, u.openid, u.real_name
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       WHERE a.class_record_id = ? 
         AND a.status IN (0, 1)  // 待上课或已签到
         AND u.openid IS NOT NULL
   ELSE:
       // 发送给指定学员
       SELECT id, openid, real_name
       FROM users
       WHERE id IN (user_ids) AND openid IS NOT NULL
5. 获取消息模板配置:
   SELECT * FROM notification_configs
   WHERE course_id = class_record.course_id
     AND trigger_type = 5  // 手动发送
   ORDER BY created_at DESC LIMIT 1
   
   IF NOT EXISTS:
       使用默认模板
6. 准备消息参数:
   template_data = {
     "thing1": {  // 课程名称
       "value": course_name
     },
     "time2": {  // 上课时间
       "value": class_record.class_date + " " + class_record.class_time
     },
     "thing3": {  // 上课地点
       "value": class_record.class_location
     },
     "thing4": {  // 备注
       "value": message_content || "请准时参加"
     }
   }
7. 批量发送小程序订阅消息:
   success_count = 0
   fail_count = 0
   
   FOR EACH user IN 接收人列表:
       TRY:
           调用微信订阅消息API:
           POST https://api.weixin.qq.com/cgi-bin/message/subscribe/send
           {
             "touser": user.openid,
             "template_id": template.template_id,
             "page": "pages/appointment/detail/index?id=" + class_record_id,
             "data": template_data
           }
           
           IF 发送成功:
               success_count++
               send_status = 1
           ELSE:
               fail_count++
               send_status = 2
       CATCH error:
           fail_count++
           send_status = 2
           error_message = error.message
       
       记录发送日志:
       INSERT INTO notification_logs (
         user_id = user.id,
         class_record_id,
         template_id = template.id,
         send_status,
         send_time = NOW(),
         error_message,
         admin_id = ?
       )
8. 记录操作日志:
   INSERT INTO admin_operation_logs (
     admin_id,
     operation_type = "send_notification",
     related_id = class_record_id,
     remark = "手动发送消息给{total}位学员"
   )
9. 返回发送统计:
   {
     "total": 接收人列表.length,
     "success_count": success_count,
     "fail_count": fail_count,
     "message": "消息发送完成"
   }
```

---

## 10. 后台管理模块

### 🔴 10.1 管理员登录
**接口**: `POST /api/admin/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应数据**:
```json
{
  "token": "admin_token",
  "admin_info": {
    "id": 1,
    "username": "admin",
    "real_name": "管理员",
    "role": "超级管理员"
  }
}
```

### 🔴 10.2 学员管理 - 列表
**接口**: `GET /api/admin/user/list`

**请求参数**:
```
?level=2&keyword=张三&start_date=2024-01-01&page=1&page_size=20
```

**响应数据**:
```json
{
  "total": 100,
  "list": [
    {
      "id": 1,
      "nickname": "用户昵称",
      "avatar": "头像URL",
      "real_name": "张三",
      "phone": "138****8000",
      "level": 2,
      "level_name": "青鸾大使",
      "referee_name": "推荐人",
      "total_amount": 40576.00,
      "course_count": 2,
      "created_at": "2024-01-15"
    }
  ]
}
```

### 🔴 10.3 学员管理 - 详情
**接口**: `GET /api/admin/user/detail`

**请求参数**:
```
?user_id=1
```

**响应数据**: 包含完整用户信息、购买记录、上课记录、推荐关系等

### 🔴 10.4 学员管理 - 修改推荐人
**接口**: `PUT /api/admin/user/update-referee`

**请求参数**:
```json
{
  "user_id": 1,
  "new_referee_id": 100,
  "remark": "管理员修改原因"
}
```

**业务规则**:
- 记录详细变更日志
- 标注管理员ID

**业务逻辑**:
```
1. 验证管理员权限(需要高级管理员权限)
2. 查询用户当前推荐人信息:
   SELECT u.*, referee.real_name as old_referee_name
   FROM users u
   LEFT JOIN users referee ON u.referee_id = referee.id
   WHERE u.id = ?
3. 验证用户是否存在:
   IF NOT EXISTS:
       返回错误: "用户不存在"
4. 验证新推荐人:
   a. 新推荐人不能是用户自己:
      IF new_referee_id = user_id:
          返回错误: "不能将用户的推荐人设置为自己"
   
   b. 新推荐人不能是用户的下级:
      递归查询以user_id为根的推荐关系树
      IF new_referee_id IN 推荐树:
          返回错误: "不能将用户的下级设置为推荐人"
   
   c. 新推荐人必须存在且是大使:
      SELECT * FROM users WHERE id = new_referee_id
      IF NOT EXISTS:
          返回错误: "新推荐人不存在"
      IF ambassador_level < 1:
          返回警告: "新推荐人不是传播大使,确认要设置吗?"
5. 检查是否会影响已有订单:
   SELECT COUNT(*) as order_count, SUM(final_amount) as total_amount
   FROM orders
   WHERE user_id = ? AND pay_status = 1
   
   IF order_count > 0:
       返回提示信息:
       "该用户有{order_count}笔已支付订单(总金额{total_amount}元),
        修改推荐人可能影响推荐人的奖励统计,确认要修改吗?"
6. 验证修改原因:
   IF remark 为空或长度 < 10:
       返回错误: "请填写详细的修改原因(至少10个字符)"
7. 开启事务:
   a. 更新用户推荐人:
      UPDATE users SET
        referee_id = ?,
        referee_uid = (SELECT uid FROM users WHERE id = ?),
        referee_updated_at = NOW()
      WHERE id = ?
   
   b. 记录变更日志:
      INSERT INTO referee_change_logs (
        user_id,
        old_referee_id = user.referee_id,
        old_referee_uid = user.referee_uid,
        new_referee_id,
        new_referee_uid,
        change_type = 3,  // 管理员修改
        change_source = 3,  // 后台管理
        admin_id = ?,
        remark,
        change_ip = ?
      )
   
   c. 如果用户有未支付订单,同步更新订单推荐人:
      UPDATE orders SET
        referee_id = ?,
        referee_uid = ?
      WHERE user_id = ? AND pay_status = 0
8. 提交事务
9. 发送通知给用户(可选):
   "您的推荐人已由管理员修改为: {new_referee_name}"
10. 记录管理员操作日志:
    INSERT INTO admin_operation_logs (
      admin_id,
      operation_type = "update_referee",
      related_id = user_id,
      remark = "修改推荐人: {old_referee_name} → {new_referee_name}"
    )
11. 返回修改成功信息:
    {
      "success": true,
      "old_referee_name": xxx,
      "new_referee_name": xxx,
      "affected_orders": xxx  // 受影响的订单数量
    }
```

### 🔴 10.5 推荐人变更审计
**接口**: `GET /api/admin/referee-log/list`

**请求参数**:
```
?change_type=2&user_id=1&start_date=2024-01-01&page=1&page_size=20
```

**响应数据**:
```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "user_name": "张三",
      "old_referee_name": "推荐人A",
      "new_referee_name": "推荐人B",
      "change_type": 2,
      "change_type_name": "用户主动修改",
      "change_source": 1,
      "change_source_name": "小程序用户资料",
      "order_no": null,
      "change_ip": "192.168.1.1",
      "created_at": "2024-01-15 10:00:00"
    }
  ],
  "stats": {
    "today_count": 5,
    "week_count": 20,
    "abnormal_count": 2
  }
}
```

### 🔴 10.6 通知公告管理 - CRUD
**接口**:
- `POST /api/admin/announcement/create`
- `PUT /api/admin/announcement/update`
- `DELETE /api/admin/announcement/delete`
- `GET /api/admin/announcement/list`

### 🔴 10.7 系统配置管理
**接口**:
- `GET /api/admin/config/get`
- `PUT /api/admin/config/update`

**配置项**:
```json
{
  "retrain_rules": {},
  "merit_points_rules": {},
  "cash_points_rules": {},
  "commission_rates": {}
}
```

### 🔴 10.8 大使等级配置管理
> 管理 `ambassador_level_configs` 表，所有大使相关的积分、金额、名额均从此表读取

**接口**:
- `GET /api/admin/ambassador-level-config/list` - 获取所有等级配置
- `PUT /api/admin/ambassador-level-config/update` - 更新指定等级配置
- `POST /api/admin/ambassador-level-config/init` - 初始化默认配置（仅首次）

**获取配置列表响应**:
```json
{
  "list": [
    {
      "id": 1,
      "level": 0,
      "level_name": "普通用户",
      "merit_rate_basic": 0.0000,
      "merit_rate_advanced": 0.0000,
      "cash_rate_basic": 0.0000,
      "cash_rate_advanced": 0.0000,
      "frozen_points": 0.00,
      "unfreeze_per_referral": 0.00,
      "upgrade_payment_amount": 0.00,
      "gift_quota_basic": 0,
      "gift_quota_advanced": 0,
      "can_earn_reward": 0
    },
    {
      "id": 2,
      "level": 2,
      "level_name": "青鸾大使",
      "merit_rate_basic": 0.3000,
      "merit_rate_advanced": 0.2000,
      "cash_rate_basic": 0.1000,
      "cash_rate_advanced": 0.0500,
      "frozen_points": 1688.00,
      "unfreeze_per_referral": 100.00,
      "upgrade_payment_amount": 9800.00,
      "gift_quota_basic": 5,
      "gift_quota_advanced": 0,
      "can_earn_reward": 1
    }
  ]
}
```

**更新配置请求**:
```json
{
  "level": 2,
  "updates": {
    "merit_rate_basic": 0.3500,
    "frozen_points": 2000.00,
    "gift_quota_basic": 8
  }
}
```

**字段说明**:
| 字段 | 说明 | 影响范围 |
|------|------|---------|
| merit_rate_basic | 推荐初探班功德分比例 | 积分计算 |
| merit_rate_advanced | 推荐密训班功德分比例 | 积分计算 |
| cash_rate_basic | 推荐初探班可提现积分比例 | 积分计算 |
| cash_rate_advanced | 推荐密训班可提现积分比例 | 积分计算 |
| frozen_points | 升级发放的冻结积分 | 大使升级 |
| unfreeze_per_referral | 每次推荐解冻积分金额 | 签到/推荐奖励 |
| upgrade_payment_amount | 支付升级所需金额 | 创建订单 |
| gift_quota_basic | 升级赠送初探班名额 | 大使升级 |
| gift_quota_advanced | 升级赠送密训班名额 | 大使升级 |
| can_earn_reward | 是否可获得推荐奖励 | 推荐奖励判断 |

### 🔴 10.9 后台用户管理 - CRUD
**接口**:
- `POST /api/admin/admin-user/create`
- `PUT /api/admin/admin-user/update`
- `DELETE /api/admin/admin-user/delete`
- `GET /api/admin/admin-user/list`

### 🔴 10.10 统计分析
**接口**: `GET /api/admin/statistics/dashboard`

**响应数据**:
```json
{
  "overview": {
    "total_users": 1000,
    "total_orders": 500,
    "total_sales": 1500000.00,
    "total_ambassadors": 200
  },
  "sales_trend": [],
  "course_sales": [],
  "ambassador_distribution": {}
}
```

---

## 补充：建议的数据库表字段

基于补充的业务逻辑，建议在以下表中添加字段：

### users 表
```sql
ALTER TABLE users ADD COLUMN referee_updated_at DATETIME COMMENT '推荐人最后修改时间';
ALTER TABLE users ADD COLUMN referee_code VARCHAR(10) UNIQUE COMMENT '推荐码(6位字母数字组合)';
ALTER TABLE users ADD COLUMN ambassador_start_date DATE COMMENT '成为大使的日期';
ALTER TABLE users ADD COLUMN is_first_recommend BOOLEAN DEFAULT FALSE COMMENT '是否已完成首次推荐(用于青鸾解冻积分)';
ALTER TABLE users ADD COLUMN cash_points_pending DECIMAL(10,2) DEFAULT 0 COMMENT '提现中的积分';
```

### orders 表
```sql
ALTER TABLE orders ADD COLUMN referee_updated_at DATETIME COMMENT '推荐人修改时间';
ALTER TABLE orders ADD COLUMN expire_at DATETIME COMMENT '订单过期时间(创建后30分钟)';
ALTER TABLE orders ADD COLUMN prepay_id VARCHAR(64) COMMENT '微信预支付交易会话标识';
ALTER TABLE orders ADD COLUMN refund_time DATETIME COMMENT '退款时间';
```

### appointments 表
```sql
ALTER TABLE appointments ADD COLUMN cancel_reason VARCHAR(200) COMMENT '取消原因';
ALTER TABLE appointments ADD COLUMN cancel_time DATETIME COMMENT '取消时间';
ALTER TABLE appointments ADD COLUMN checkin_time DATETIME COMMENT '签到时间';
```

### user_courses 表
```sql
ALTER TABLE user_courses ADD COLUMN last_attend_time DATETIME COMMENT '最后上课时间';
ALTER TABLE user_courses ADD COLUMN is_gift BOOLEAN DEFAULT FALSE COMMENT '是否赠送课程';
ALTER TABLE user_courses ADD COLUMN source_order_id INT COMMENT '来源订单ID(赠送课程关联原订单)';
ALTER TABLE user_courses ADD COLUMN source_course_id INT COMMENT '来源课程ID(赠送课程关联密训班ID)';
ALTER TABLE user_courses ADD COLUMN status TINYINT DEFAULT 1 COMMENT '状态:1有效/0失效(退款后失效)';
```

### withdrawals 表
```sql
ALTER TABLE withdrawals ADD COLUMN apply_time DATETIME COMMENT '申请时间';
ALTER TABLE withdrawals ADD COLUMN audit_time DATETIME COMMENT '审核时间';
ALTER TABLE withdrawals ADD COLUMN audit_admin_id INT COMMENT '审核管理员ID';
ALTER TABLE withdrawals ADD COLUMN transfer_time DATETIME COMMENT '转账时间';
```

### contract_signatures 表
```sql
ALTER TABLE contract_signatures ADD COLUMN sign_type TINYINT DEFAULT 1 COMMENT '签署类型:1用户签署/2管理员续签';
ALTER TABLE contract_signatures ADD COLUMN admin_id INT COMMENT '操作管理员ID(续签时)';
```

### ambassador_applications 表
```sql
ALTER TABLE ambassador_applications ADD COLUMN audit_admin_id INT COMMENT '审核管理员ID';
ALTER TABLE ambassador_applications ADD COLUMN audit_time DATETIME COMMENT '审核时间';
ALTER TABLE ambassador_applications ADD COLUMN audit_remark VARCHAR(500) COMMENT '审核备注';
```

### notification_logs 表
```sql
ALTER TABLE notification_logs ADD COLUMN admin_id INT COMMENT '手动发送时的管理员ID';
ALTER TABLE notification_logs ADD COLUMN error_message TEXT COMMENT '发送失败时的错误信息';
```

### 新增表：admin_operation_logs (管理员操作日志)
```sql
CREATE TABLE admin_operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL COMMENT '管理员ID',
  operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
  related_id INT COMMENT '关联记录ID',
  remark TEXT COMMENT '操作备注',
  ip_address VARCHAR(50) COMMENT '操作IP',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_created_at (created_at)
) COMMENT='管理员操作日志表';
```

### 索引建议
```sql
-- users 表
ALTER TABLE users ADD INDEX idx_referee_updated_at (referee_updated_at);
ALTER TABLE users ADD INDEX idx_ambassador_level (ambassador_level);

-- orders 表
ALTER TABLE orders ADD INDEX idx_expire_at (expire_at);
ALTER TABLE orders ADD INDEX idx_prepay_id (prepay_id);

-- appointments 表
ALTER TABLE appointments ADD INDEX idx_cancel_time (cancel_time);

-- withdrawals 表
ALTER TABLE withdrawals ADD INDEX idx_audit_time (audit_time);
ALTER TABLE withdrawals ADD INDEX idx_status_apply_time (status, apply_time);

-- user_courses 表
ALTER TABLE user_courses ADD INDEX idx_source_order_id (source_order_id);
ALTER TABLE user_courses ADD INDEX idx_is_gift (is_gift);
ALTER TABLE user_courses ADD INDEX idx_status (status);
```

---

<!-- ## 遗漏功能识别

根据需求文档分析，以下功能可能需要补充：

### 1. ⚠️ 咨询预约模块
**需求文档位置**: 3.1.6.4 节
**状态**: 前端页面暂缺
**建议**: 需新增 `/pages/mine/consultation/index.vue`

**需要接口**:
- `GET /api/consultation/list` - 获取可预约咨询服务
- `POST /api/consultation/book` - 预约咨询
- `GET /api/consultation/my` - 我的咨询记录
- `POST /api/consultation/evaluate` - 咨询评价

### 2. ✅ 商城模块
**需求文档位置**: 功德分兑换商城
**状态**: 已新增完整接口组
**说明**: 商城兑换独立流程,不走支付接口,直接在商城页面完成扣除

**接口**:
- `GET /api/mall/goods/list` - 商品列表
- `POST /api/mall/exchange` - 功德分(+积分)兑换
- `GET /api/merit-points/exchange-records` - 兑换记录

### 3. ⚠️ 密训班赠送初探班名额管理
**需求文档位置**: 密训班包含初探班
**状态**: 业务逻辑需明确
**建议**:
- 购买密训班时自动添加2条user_courses记录
- 奖励计算只按密训班38888元计算

### 4. ✅ 大使升级流程
**需求文档位置**: 3.1.7.1 节
**状态**: 已新增统一升级接口
**说明**: 支持所有等级升级,区分支付类型和协议类型

**接口**:
- `POST /api/ambassador/upgrade` - 统一的大使升级接口
- `GET /api/ambassador/upgrade-guide` - 获取升级指南信息

### 5. ⚠️ 复训支付流程
**需求文档位置**: 3.1.4 节
**状态**: 预约时需支付复训费
**建议**: 集成到预约创建接口

### 6. ⚠️ 首次登录资料填写强制流程
**需求文档位置**: 3.1.1 节
**状态**: 需前端路由守卫配合
**建议**:
- 登录接口返回 `profile_completed` 标识
- 前端判断跳转到资料填写页

### 7. ⚠️ 预览模式功能限制
**需求文档位置**: 3.1.1 节
**状态**: 需后端接口权限验证
**建议**:
- 所有需要用户信息的接口检查 `profile_completed`
- 返回401错误提示完善资料

### 8. ⚠️ 准青鸾自动升级青鸾
**需求文档位置**: 3.1.7.1 节
**状态**: 需在支付回调中自动触发
**建议**:
- 检测准青鸾推荐初探班成功
- 触发协议签署流程
- 签署后自动升级并发放冻结积分（金额从 ambassador_level_configs.frozen_points 读取）

--- -->

## 接口安全规范

### 认证方式

**小程序端**：
- 使用 CloudBase SDK 的 OpenID 登录
- 前端调用 `signInWithOpenId()` 获取登录态
- CloudBase 自动维护登录态，有效期30天
- 后端通过 CloudBase 云函数的 `context.user.uid` 获取当前登录用户的唯一标识
- 所有用户相关数据使用 `uid` 作为唯一标识

**管理后台**：
- JWT token

**CloudBase 认证示例（云函数）**：
```javascript
exports.main = async (event, context) => {
  // 获取当前登录用户的 uid
  const uid = context.user.uid;
  
  if (!uid) {
    return { code: 401, message: '未登录' };
  }
  
  // 使用 uid 查询用户资料
  const userProfile = await db.collection('users').doc(uid).get();
  
  return { code: 0, data: userProfile };
};
```

### 权限验证
- 用户身份验证（CloudBase 登录态）
- 资料完善检查（预览模式限制）
- 大使等级权限检查
- 推荐人资格验证
- 所有用户数据查询使用 `uid` 而非自定义 `id`

### 数据安全
- 敏感字段脱敏（手机号、身份证等）
- 参数校验（防SQL注入）
- 接口防刷（限流）
- 支付签名验证
- CloudBase 安全规则配置

---

## 附录：关键业务流程

### A. 推荐人确定流程
```
注册扫码 → 临时记录推荐人
  ↓
个人资料 → 可修改推荐人（7天1次）
  ↓
创建订单 → 验证推荐人资格 → 可修改推荐人
  ↓
支付成功 → 最终确定推荐人（不可修改）
  ↓
首次购买 → 锁定用户推荐人（永久）
```

### B. 青鸾大使奖励流程
```
⚠️ 以下数值均从 ambassador_level_configs 表动态读取

成为青鸾 → 获得 config.frozen_points 冻结积分
  ↓
第1次推荐初探班 → 解冻 config.unfreeze_per_referral 积分（可提现）
  ↓
第2次推荐初探班 → 获得 config.merit_rate_basic 比例的功德分
  ↓
推荐密训班 → 获得 config.merit_rate_advanced 比例的功德分
```

### C. 鸿鹄大使奖励流程
```
⚠️ 以下数值均从 ambassador_level_configs 表动态读取

升级鸿鹄 → 支付 config.upgrade_payment_amount 元
         → 获得 config.frozen_points 冻结积分
         → 获得 config.gift_quota_basic 个初探班名额
  ↓
推荐初探班 → 解冻 config.unfreeze_per_referral 积分（重复至冻结积分用完）
  ↓
冻结积分用完 → 推荐初探班 → 获得 config.cash_rate_basic 比例的可提现积分
  ↓
推荐密训班 → 直接获得 config.cash_rate_advanced 比例的可提现积分（不消耗冻结积分）
```

---

**文档结束**

如有疑问或需要补充接口，请及时反馈。