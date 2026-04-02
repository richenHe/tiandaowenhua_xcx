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

**小程序端 401 与游客态（2026-04-01）**:

- 云函数统一返回 `code: 401` 时，UniApp 请求封装仍会视为失败并中断业务 `data` 解析。
- **前端策略**：若本地 **未** 缓存业务用户信息（与 `isBusinessLoggedIn()` 一致），**不再**自动 `redirectTo` 登录页，以符合「先浏览后登录」审核口径；页面表现为接口失败，需依赖云函数对**公开只读**接口放宽鉴权或返回 `0`。
- 若本地 **已** 有业务登录态但服务端判未登录/会话失效，仍弹提示并引导跳转登录页。

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

**order 云函数游客可读（2026-04-02）**：`action` 为 `getMallGoods`、`getMallCourses` 时，**不要求** `users` 表已存在业务用户记录（未注册/未登录业务态也可拉取上架商品与可兑换课程列表）；`exchangeGoods`、`exchangeCourse`、`getExchangeRecords` 等仍强制 `checkClientAuth`。

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
**Action**: `client:updateProfile`

**接口概述**: 保存或更新用户资料,判断资料是否完善

**认证**: CloudBase 登录态（自动从 CloudBase SDK 获取当前登录用户的 uid）

**请求参数**:
```json
{
  "realName": "张三",         // 必填（camelCase）
  "phone": "13800138000",    // 必填
  "gender": 1,               // 可选：0女/1男
  "birthday": "1990-01-01-10", // 可选，格式：年-月-日-时
  "industry": "互联网",       // 可选
  "city": "广东 深圳 南山区", // 可选，省市区以空格分隔
  "avatar": "cloud://xxx",   // 可选，头像 fileID
  "backgroundImage": "cloud://xxx", // 可选，背景图 fileID
  "bankAccountName": "张三", // 可选，收款银行账户持有人姓名
  "bankName": "招商银行深圳南山支行", // 可选，开户支行全称
  "bankAccountNumber": "6225880123456789" // 可选，银行卡号
}
```

**变更说明（2026-03-23）**: 新增银行账户三字段（`bankAccountName`、`bankName`、`bankAccountNumber`），用于退款和提现收款。银行字段传空字符串可清空。

**变更说明（2026-03-30）**: 接口保存成功后自动触发历史学员数据导入流程（processLegacyImport）。若用户姓名在 legacy_students 表中有匹配记录，将自动完成历史课程导入、推荐人绑定、大使等级升级等操作，对前端透明（导入失败不影响本接口响应）。

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

### ~~🔵 1.4 更新推荐人~~（已废弃 2026-03-09）

> **已删除**：推荐人改为仅通过扫码绑定，用户端不再提供修改推荐人的功能。后台管理员仍可通过 `admin:updateUserReferee` 修改。

### ~~🔵 1.5 获取可选传播大使列表~~（已废弃 2026-03-09）

> **已删除**：用户端不再提供选择推荐人功能，此接口已移除。

### ~~🔵 1.6 验证推荐人资格~~（已废弃 2026-03-09）
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

### 表现分与评估名单

### 🔴 1.8 加表现分
**云函数**: `user` → Action: `addPerformanceScore`
**权限**: 管理后台

**接口概述**: 给用户加表现分（按岗位类型加分）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Int | 是 | 用户ID |
| positionTypeId | Int | 是 | 岗位类型ID |
| positionName | String | 是 | 岗位名称 |
| score | Number | 是 | 加分值（正数） |
| reason | String | 否 | 备注 |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | Number | 表现分记录ID |

---

### 🔴 1.9 扣表现分
**云函数**: `user` → Action: `deductPerformanceScore`
**权限**: 管理后台

**接口概述**: 给用户扣表现分（系统自动取负值存储）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Int | 是 | 用户ID |
| deductType | Int | 是 | 扣分类型：2=学员扣分，3=活动扣分 |
| score | Number | 是 | 扣分值（传正数，系统自动取负） |
| reason | String | 否 | 备注 |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | Number | 表现分记录ID |

---

### 🔴 1.10 评估名单列表
**云函数**: `user` → Action: `getEvaluationList`
**权限**: 管理后台

**接口概述**: 查询评估名单列表，含各岗位加分汇总、扣分汇总及黑名单状态

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Int | 否 | 页码，默认 1 |
| pageSize | Int | 否 | 每页条数，默认 20 |
| keyword | String | 否 | 搜索关键词（姓名/手机号模糊匹配） |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| list | Array | 用户列表，每项含各岗位加分、学员扣分、活动扣分、黑名单状态 |
| total | Number | 总记录数 |
| positionTypes | Array | 岗位类型列表（用于动态渲染表头列） |
| config | Object | 黑名单阈值配置（含学员/活动的扣分阈值和拉黑月数） |

---

### 🔴 1.11 拉黑用户
**云函数**: `user` → Action: `setBlacklist`
**权限**: 管理后台

**接口概述**: 将用户拉入黑名单（课程拉黑或活动拉黑）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Int | 是 | 用户ID |
| blacklistType | Int | 是 | 拉黑类型：1=课程拉黑，2=活动拉黑 |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | Number | 黑名单记录ID |
| months | Number | 拉黑月数（从 blacklist_config 读取） |

**业务规则**:
- 自动从 `blacklist_config` 表读取对应拉黑月数，计算过期时间
- 已处于拉黑状态的用户不可重复操作，返回错误提示

---

### 🔴 1.12 解除拉黑
**云函数**: `user` → Action: `removeBlacklist`
**权限**: 管理后台

**接口概述**: 解除用户的黑名单状态

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Int | 是 | 用户ID |
| blacklistType | Int | 是 | 拉黑类型：1=课程，2=活动 |

**返回字段**: 无（返回 null）

---

### 🔴 1.13 更新黑名单阈值配置
**云函数**: `user` → Action: `updateBlacklistConfig`
**权限**: 管理后台

**接口概述**: 更新黑名单扣分阈值与拉黑月数配置

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| configs | Array | 是 | 配置项数组，每项格式：`{key: String, value: String}` |

**有效 key 值**:

| key | 说明 |
|---|---|
| student_deduction_threshold | 学员扣分阈值（累计扣分达到此值触发拉黑提示） |
| student_blacklist_months | 学员拉黑月数 |
| activity_deduction_threshold | 活动扣分阈值 |
| activity_blacklist_months | 活动拉黑月数 |

**返回字段**: 无（返回 null）

---

### 🔴 1.14 用户课程列表（管理端）

- **action**: `getUserCourseList`
- **云函数**: `user`
- **调用方**: 管理后台

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| keyword | String | 否 | 用户姓名/手机号模糊搜索 |
| courseId | Number | 否 | 课程ID筛选 |
| status | Number | 否 | 状态筛选：0无效/1有效/2已退款/3已过期 |
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页条数，默认20 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| list | Array | 用户课程列表 |
| list[].id | Number | 用户课程ID |
| list[].user_id | Number | 用户ID |
| list[].user_name | String | 用户姓名 |
| list[].user_phone | String | 用户手机号 |
| list[].course_id | Number | 课程ID |
| list[].course_name | String | 课程名称 |
| list[].course_type | Number | 课程类型：1初探班/2密训班/3咨询服务/4沙龙 |
| list[].status | Number | 状态：0无效/1有效/2已退款/3已过期 |
| list[].expire_at | String | 有效期截止时间 |
| list[].attend_count | Number | 上课次数 |
| list[].contract_signed | Number | 合同状态：0未签/1已签 |
| list[].created_at | String | 创建时间 |
| total | Number | 总记录数 |

---

### 🔴 1.15 手动新增用户课程（管理端）

- **action**: `adminAddUserCourse`
- **云函数**: `user`
- **调用方**: 管理后台
- **描述**: 为老学员手动录入课程记录，不触发推荐人奖励，不关联订单

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Number | 是 | 用户ID |
| courseId | Number | 是 | 课程ID |
| validityDays | Number | 是 | 剩余有效天数 |
| needContract | Boolean | 否 | 是否创建合同签署记录，默认false |
| contractImages | Array | 否 | 合同照片 fileID 数组（needContract=true 时可选传入） |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| user_course_id | Number | 新创建的用户课程记录ID |
| expire_at | String | 有效期截止时间 |
| signature_id | Number/null | 合同签署记录ID（未创建合同时为null） |

**业务规则**
- 同一用户同一课程不允许重复新增（已有有效/过期记录时拒绝）
- attend_count 默认为 1
- contract_signed 直接标记为 1
- 不触发推荐人奖励（不调用 grantRefereeRewardAfterSign）
- 不关联订单（order_no=NULL），因此不可退款
- needContract=true 但课程无合同模板时，仅标记 contract_signed=1，不创建 contract_signatures 记录

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
   - attend_count: 已结课次数(初始值为0，排期结束且有签到记录时由定时任务+1)
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
- `gift_courses`（2026-03 新增）: 赠送课程详细信息数组，每项包含 `id, name, type, type_name, cover_image, validity_days, description, content, outline, teacher`。当 `courses.included_course_ids` 有值时返回，供前端展示赠送课程 tab

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

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Number | 否 | 页码，默认 1 |
| page_size | Number | 否 | 每页条数，默认 20 |

> 前端采用滚动分页加载，每次 20 条，累计最多展示 99 条（变更于 2026-03-03）

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
- `expire_at`: 课程有效期截止时间（`buy_time + courses.validity_days`），NULL 表示永久有效
- `validity_days`: 课程有效期天数（来自 courses 表），NULL 或 0 表示永久有效（新增，2026-03-03）
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
  "validityDays": 365,
  "included_course_ids": [2],
  "stock": 100,
  "sort": 1,
  "status": 1,
  "needContract": 1
}
```

**请求参数说明**（部分）:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| needContract | Number | 是（非沙龙课程） | 是否需要签订合同：0不需要/1需要 |

> `validityDays`：**必填**，课程有效期天数（正整数，范围 1~3650）。传 `null` 或 `<= 0` 返回 `paramError`。购课时写入 `user_courses.expire_at = buy_time + validityDays 天`。

> **沙龙课程（type=4）特殊处理**（2026-03 新增）：
> - `currentPrice` 不再必填，服务端自动设为 0
> - `validityDays` 不再必填，服务端自动设为 NULL
> - `original_price`、`retrain_price`、`allow_retrain` 均自动设为 0
> - `duration` 自动设为 NULL

> **密训班赠送课程（2026-03 新增）**：
> - `includedCourseIds`（可选）：赠送课程 ID（单个 ID 或数组），仅 `type=2` 密训班有效
> - 服务端将其转为 JSON 数组 `[courseId]` 写入 `courses.included_course_ids`
> - **新课程强制 `status=0`（下架）**，忽略前端传入的 status 值

### 🔴 2.5 课程管理 - 更新课程
**接口**: `PUT /api/admin/course/update`

**请求参数**:
```json
{
  "id": 1,
  "name": "新名称",
  "current_price": 1500.00,
  "validityDays": 365,
  "needContract": 1
}
```

**请求参数说明**（部分）:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| needContract | Number | 否 | 是否需要签订合同：0不需要/1需要 |

> `validityDays`：**必填**，课程有效期天数（正整数，范围 1~3650）。传 `null` 或 `<= 0` 返回 `paramError`。

> **沙龙课程（type=4）特殊处理**（2026-03 新增）：
> - `validityDays` 跳过正整数校验
> - 上架(status=1)时不检查学习服务协议模板

> **非沙龙课程上架校验**（2026-03 新增）：
> - 当 `status=1` 且课程当前状态不为 1（即从下架变为上架）时，系统检查 `contract_templates` 中是否存在 `course_id=id, contract_type=4, status=1, deleted_at IS NULL` 的记录
> - 若不存在，返回错误：`"课程上架前必须配置学习服务协议模板，请先在课程列表点击\"合同\"按钮上传协议文件"`
> - 已上架课程（course.status=1）再次设置 status=1 跳过此校验
> - **need_contract=0 时跳过合同模板检查**：课程 `need_contract=0`（不需要签订合同）时，上架不校验学习服务协议模板

> **上架锁定（2026-03 新增）**：
> - 课程 `status=1`（已上架）时，除 `status` 字段外的所有编辑字段均被锁定
> - 尝试修改已上架课程的其他字段将返回错误：`"课程已上架，不可修改任何字段。如需修改请先下架课程。"`
> - 允许的操作：仅传 `{ id, status: 0 }` 执行下架，下架后恢复可编辑

> **密训班赠送课程（2026-03 新增）**：
> - 新增 `includedCourseIds` 参数：赠送课程 ID（单个 ID），仅 `type=2` 密训班有效
> - 传 `null` 或 `0` 清除赠送课程绑定

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

### ⏰ 2.8 定时任务 - 上课前一天订阅消息提醒（2026-03 新增）

- **触发方式**: cloudfunction.json timer trigger `send-course-reminder`，每日 9:00 自动执行
- **云函数**: `course`
- **处理器**: `handlers/admin/sendCourseReminder.js`
- **调用方**: 定时任务（无需手动调用）

**执行逻辑**:
1. 计算明天日期（北京时间）
2. 查询 `class_records` 表中 `class_date = 明天` 且 `status IN (1, 2)` 的排期
3. 查询这些排期下 `appointments.status = 0`（待上课）的预约记录
4. 通过 `user_id` 获取用户 `openid`
5. 使用 APPID + AppSecret 获取微信 access_token（HTTP API）
6. 调用微信 `subscribeMessage.send` HTTP API 发送订阅消息

> **实现说明**：通过 HTTP API 直接调用微信接口，不使用 `cloud.openapi.subscribeMessage.send`，避免 MCP 部署时 openapi 权限未激活导致的 `-501001` 错误。

**模板字段映射**:

| 变量 | 标签 | 来源 | 限制 |
|------|------|------|------|
| `date5` | 时间 | `class_records.class_date` + `class_time`，格式: "2026年3月15日 09:00" | date 类型 |
| `thing10` | 上课地址 | `class_records.class_location` | 最多 20 字，超长截断 |
| `thing15` | 主讲老师 | `class_records.teacher` | 最多 20 字 |
| `thing2` | 课程标题 | `class_records.course_name` | 最多 20 字，超长截断 |
| `short_thing35` | 学习天数 | `class_end_date - class_date + 1` | 最多 5 字，如 "7天" |

**返回字段**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| date | String | 查询的目标日期（明天） |
| total | Number | 待发送总数 |
| sent | Number | 成功发送数 |
| failed | Number | 失败/跳过数 |
| message | String | 汇总信息 |

**错误码处理**:
- `43101`: 用户未授权订阅消息，属正常情况，静默跳过
- 其他错误码: 记录日志但不中断其他用户的发送

**前端配合**:
- 预约确认页（`pages/course/appointment-confirm/index`）在用户点击"确认预约"后调用 `uni.requestSubscribeMessage` 请求授权
- 模板 ID: `SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc`
- 授权结果不影响预约流程（无论用户是否允许都继续预约）

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
  "class_record_id": 5
}
```

**参数说明**:
- `order_type`: 必填,1课程/2复训/4大使升级
- `item_id`: 必填,项目ID(根据order_type含义不同)
- `class_record_id`: 可选,上课记录ID(复训专用)
- ~~`referee_id`~~: 已废弃（2026-03-09），推荐人直接从用户表读取，不接受前端传参

**业务逻辑**:

1. **权限验证**
   - 检查用户登录态
   - 检查 `profile_completed` 是否为 1
   - 未完善返回 403:"请先完善资料"

2. **防重复下单（2026-03 新增）**
   - 在创建新订单前，先查询同类型的待支付未过期订单（`pay_status=0 AND expire_at > NOW()`）
   - 匹配条件：`user_id + order_type` 相同，且关键 ID 一致（课程/升级按 `related_id`，复训按 `class_record_id`）
   - **若命中，直接返回原订单号**（不新建），响应体中 `is_existing=true`
   - 前端逻辑不变：收到 `order_no` 后统一跳转支付页，无需感知是否已有订单

3. **根据 order_type 处理（仅在无待支付订单时执行）**

| order_type | item_id 含义 | 业务处理 |
|-----------|-------------|---------|
| 1 课程 | 课程ID | 验证课程存在;验证推荐人资格;检查重复购买;密训班标记需赠送初探班 |
| 2 复训 | 用户课程ID | 验证用户已购买;检查复训截止时间(开课前3天);检查是否已预约 |
| 4 升级 | 目标等级 | 验证当前等级;验证升级条件;验证协议是否签署;金额从 ambassador_level_configs.upgrade_payment_amount 读取 |

4. **生成订单**
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
  "status": 0,
  "expire_at": "2026-03-03 14:30:00",
  "is_existing": false
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
  - `expire_at`: DATETIME,订单过期时间（创建后30分钟）
- **响应字段说明**:
  - `is_existing`: Boolean，`true` 表示命中已有待支付订单（非新建），`false` 为新建订单
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
   - attend_count 初始值为 0
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
               attend_count = 0,
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
   
3. ~~根据配置发放名额~~（2026-03-09 已隐藏：gift_quota_basic/gift_quota_advanced 当前全部为 0，升级不再发放名额）
   
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
| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |
| status | Number | 否 | 筛选 pay_status（0待支付/1已支付/2已取消/4已退款），不传为全部 |

> 前端采用滚动分页加载，每次 20 条，累计最多展示 99 条（变更于 2026-03-03）

**响应数据**:
```json
{
  "total": 10,
  "list": [
    {
      "order_no": "ORD202401150001",
      "order_type": 1,
      "order_name": "初探班",
      "related_id": 1,
      "final_amount": 1688.00,
      "pay_status": 1,
      "refund_status": 0,
      "refund_reason": "",
      "refund_reject_reason": "",
      "refund_amount": 0,
      "refund_time": null,
      "invoice_url": "",
      "pay_status_name": "已支付",
      "pay_time": "2024-01-15 10:30:00",
      "referee_name": "推荐人",
      "is_reward_granted": true,
      "created_at": "2024-01-15 10:00:00",
      "expires_at": "2024-01-15 10:30:00"
    }
  ]
}
```

> **变更说明（2026-03-03）**：新增退款相关返回字段 `refund_reason`、`refund_reject_reason`、`refund_amount`、`refund_time`、`invoice_url`，用于前端退款列表页动态展示退款状态。

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
**云函数**: `order`，**Action**: `getOrderList`

**请求参数**:
```
?pay_status=1&order_type=1&pay_method=wechat&start_date=2024-01-01&end_date=2024-01-31&keyword=张三&page=1&page_size=20
```

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |
| keyword | String | 否 | 关键词搜索（订单号/用户姓名/手机号） |
| pay_status | Number | 否 | 支付状态：0待支付/1已支付/2已取消/3已关闭/4已退款 |
| order_type | Number | 否 | 订单类型：1课程订单/2复训订单/4大使升级 |
| pay_method | String | 否 | 支付方式：wechat/alipay/points/offline |
| startDate | String | 否 | 开始日期（YYYY-MM-DD） |
| endDate | String | 否 | 结束日期（YYYY-MM-DD） |

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

### 🔵 3.8 客户端 - 申请退款
**云函数**: `order`，**Action**: `requestRefund`

> ⚠️ 退款流程为纯人工财务转账，不调用微信退款 API，所有退款由公司财务线下处理后在后台标记已转账。

**请求参数**:
```json
{
  "order_no": "ORD202401150001",
  "refund_reason": "课程不适合，申请退款"
}
```

**参数说明**:
- `order_no`：必填，要退款的订单号
- `refund_reason`：必填，退款原因

**业务逻辑**:
```
1. 验证用户身份
2. 查询订单：必须属于当前用户 + pay_status=1（已支付）
3. refund_status 校验：
   - refund_status=0（无退款）/ 2（退款失败）/ 4（已驳回）→ 允许申请
   - refund_status=1（申请中）→ 拒绝：退款审核中，请耐心等待
   - refund_status=3（已退款）→ 拒绝：已退款，无法重复申请
4. 大使升级订单（order_type=4）：不支持退款
5. 若订单类型=1（课程订单）：
   a. 查询主课程 user_courses.contract_signed
      - contract_signed=1：返回错误"已签署学习合同，无法退款"
   b. 查询主课程 courses.included_course_ids（赠送课程）
      - 对每个赠送课程查 user_courses.contract_signed
      - 任一赠送课程 contract_signed=1：返回错误"赠送课程已签署学习合同，无法退款"
6. 若订单类型=2（复训订单）：
   - retrain_credit_status=1（资格保留）→ 允许申请
   - retrain_credit_status=2（资格已使用）→ 拒绝：复训资格已使用，无法退款
   - retrain_credit_status=0 或其他 → 拒绝：不满足退款条件
7. 更新 orders 表：
   - refund_status = 1（申请退款）
   - refund_amount = final_amount
   - refund_reason = 用户填写的原因
   - refund_reject_reason = null（清空之前的驳回原因）
   - refund_audit_admin_id = null
   - refund_audit_time = null
   - 若 order_type=2：retrain_credit_status = 0（立即失效，防止审核期间重复使用）
8. 返回申请成功
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "order_no": "ORD202401150001",
    "refund_status": 1,
    "refund_amount": 1688.00
  },
  "message": "退款申请已提交，请等待审核"
}
```

**错误情况**:
- `pay_status !== 1`：只能对已支付订单申请退款
- `refund_status === 1`：退款审核中，请耐心等待
- `refund_status === 3`：已退款，无法重复申请
- `contract_signed = 1`：已签署学习合同，无法退款
- `retrain_credit_status !== 1`（复训订单）：复训资格已使用或不满足退款条件

---

### 🔵 3.9 客户端 - 获取退款状态
**云函数**: `order`，**Action**: `getRefundStatus`

**请求参数**:
```json
{
  "order_no": "ORD202401150001"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "order_no": "ORD202401150001",
    "order_name": "天道初探班",
    "order_type": 1,
    "final_amount": 1688.00,
    "refund_status": 1,
    "refund_amount": 1688.00,
    "refund_reason": "课程不适合，申请退款",
    "refund_reject_reason": "",
    "refund_time": null,
    "refund_transfer_no": null,
    "refund_audit_time": null,
    "invoice_url": "",
    "pay_time": "2026-01-15 10:30:00",
    "created_at": "2026-01-15 10:00:00"
  }
}
```

**refund_status 枚举说明**:
| 值 | 含义 |
|----|------|
| 0 | 无退款 |
| 1 | 申请退款（待审核） |
| 2 | 退款失败（微信退款处理异常，可重新申请） |
| 3 | 已退款（财务已转账） |
| 4 | 已驳回（可重新申请） |

---

### 🔴 3.10 订单管理 - 退款列表
**云函数**: `order`，**Action**: `getRefundList`

**请求参数**:
```json
{
  "page": 1,
  "page_size": 20,
  "keyword": "张三",
  "refund_status": 1,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31"
}
```

**参数说明**:
- `keyword`：可选，按订单号/用户手机号模糊搜索
- `refund_status`：可选，1=申请退款 / 3=已退款 / 4=已驳回；不传返回全部
- `order_type`：可选，1=课程退款 / 2=复训费退款；不传返回全部
- `start_date` / `end_date`：可选，按申请时间范围筛选

**响应数据**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 20,
    "stats": {
      "pending_count": 3,
      "transferred_count": 5,
      "rejected_count": 2,
      "pending_amount": 5064.00
    },
    "list": [
      {
        "id": 101,
        "order_no": "ORD202401150001",
        "user_id": 30,
        "user_name": "张三",
        "user_phone": "138****8888",
        "order_name": "天道初探班",
        "final_amount": 1688.00,
        "refund_amount": 1688.00,
        "refund_status": 1,
        "refund_reason": "课程不适合",
        "refund_reject_reason": "",
        "refund_audit_admin_id": null,
        "refund_audit_time": null,
        "refund_time": null,
        "refund_transfer_no": "",
        "invoice_url": "",
        "bank_account_name": "张三",
        "bank_name": "招商银行深圳南山支行",
        "bank_account_number": "6225880123456789",
        "created_at": "2026-01-15 10:00:00",
        "pay_time": "2026-01-15 10:30:00"
      }
    ]
  }
}
```

**变更说明（2026-03-23）**: 新增返回字段 `bank_account_name`、`bank_name`、`bank_account_number`，从 `users` 表读取用户的银行收款信息，供财务人员在后台退款详情中查看并进行线下转账。如用户未填写则返回空字符串。

---

### 🔴 3.11 订单管理 - 驳回退款
**云函数**: `order`，**Action**: `rejectRefund`

**请求参数**:
```json
{
  "order_id": 101,
  "reject_reason": "退款申请不符合退款政策"
}
```

**参数说明**:
- `order_id`：必填，订单ID
- `reject_reason`：必填，驳回原因

**业务逻辑**:
```
1. 验证管理员身份
2. 查询订单：refund_status=1（申请退款）
3. 更新 orders 表：
   - refund_status = 4（已驳回）
   - refund_reject_reason = reject_reason
   - refund_audit_admin_id = 当前管理员ID
   - refund_audit_time = NOW()
   - 若 order_type=2（复训订单）：retrain_credit_status = 1（恢复复训资格，用户可继续使用资格或再次申请退款）
4. 返回驳回成功（不涉及积分/功德分回退）
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "order_id": 101,
    "refund_status": 4,
    "status_name": "已驳回",
    "reject_reason": "退款申请不符合退款政策"
  },
  "message": "退款申请已驳回"
}
```

---

### 🔴 3.12 订单管理 - 标记已转账（完成退款）
**云函数**: `order`，**Action**: `markRefundTransferred`

> ⚠️ 上传发票为必填，流水号选填。完成后自动回滚订单业务（失效课程、取消预约等）。

**请求参数**:
```json
{
  "order_id": 101,
  "invoice_file_id": "cloud://env.bucket/invoices/2026/01/refund_101.pdf",
  "transfer_no": "202601150001"
}
```

**参数说明**:
- `order_id`：必填，订单ID
- `invoice_file_id`：必填，退款发票 cloud:// fileID（财务转账凭证）
- `transfer_no`：选填，银行转账流水号

**业务逻辑**:
```
1. 验证管理员身份
2. 查询订单：refund_status=1（申请退款）
3. invoice_file_id 必填校验
4. 更新 orders 表：
   - refund_status = 3（已退款）
   - pay_status = 4（已退款）
   - refund_time = NOW()
   - refund_transfer_no = transfer_no
   - refund_invoice_file_id = invoice_file_id
   - refund_audit_admin_id = 当前管理员ID
   - refund_audit_time = NOW()
5. 调用 rollbackOrderBusiness 回滚业务：
   a. 课程订单（order_type=1）：
      - 主课程：UPDATE user_courses SET status=0 WHERE user_id AND course_id=related_id
      - 赠送课程回退（2026-03 新增）：
        - 查询主课程的 courses.included_course_ids
        - 对每个赠送课程 ID：
          1. 查找 is_gift=1 且 source_order_id=order.id 的记录
          2. 有记录（新建的赠送）→ status=0 失效
          3. 无记录（叠加有效期）→ expire_at 减去赠送课程的 validity_days 天
   b. 复训订单（order_type=2）：
      - 查询关联的所有预约（by order_no）
      - 仅取消尚未取消（status≠3）的预约，已取消的跳过（避免重复扣减名额）
      - 归还已取消预约的 class_records.booked_quota
6. 返回标记成功
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "order_id": 101,
    "refund_status": 3,
    "status_name": "已退款",
    "invoice_url": "https://bucket.tcb.qcloud.la/invoices/2026/01/refund_101.pdf"
  },
  "message": "已标记为退款转账完成"
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
**action**: `createAppointment`（course 云函数）

**接口概述**: 创建课程预约（仅用于首次预约/沙龙预约；复训预约由支付回调自动创建）

**请求参数**:
```json
{
  "class_record_id": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| class_record_id | Number | 是 | 上课排期ID（支持 classRecordId 或 class_record_id） |

**业务逻辑**（2026-03-02 更新）:
```
1. 查询 class_records 确认排期存在且 status=1
2. 查询 courses.type 判断是否沙龙(type=4)
3. 黑名单校验：查询 user_blacklist 是否存在 type=1（课程拉黑）且未过期的记录，若命中则拒绝预约
4. 沙龙课程：自动创建 user_courses（若不存在）
5. 非沙龙课程：
   a. 验证 user_courses 存在（已购买，status=1）
   b. 复训校验：attend_count >= 1 时：
      - 优先检查当前排期是否有已支付的复训订单（orders: order_type=2, pay_status=1）
      - 若无，检查是否有可抵用的复训资格（retrain_credit_status=1，同课程）
      - 若有复训资格，直接创建预约并标记资格为已抵用（retrain_credit_status=2）
      - 若均无，拒绝预约
6. 检查重复预约（status IN [0,1]）
7. 检查名额
8. 创建预约记录 → 更新 booked_quota
```

> **黑名单校验**（2026-03 新增）：预约前会检查用户是否在课程黑名单中（`user_blacklist.type=1` 且 `expire_at > NOW()`），被拉黑用户无法创建预约。

**特别说明（2026-03-06 更新）**:
- `attend_count` 初始值为 **0**（购课时写入），排期结束且有签到记录时由定时任务 +1
- `attend_count = 0` 表示首次上课，直接预约无需支付
- `attend_count >= 1` 且非沙龙 → 必须先通过订单确认页支付复训费（order_type=2），支付回调自动创建预约
- 沙龙课程（type=4）免复训费
- **复训资格抵用**：复训用户如有可抵用复训资格（retrain_credit_status=1），可免付复训费直接预约
- **同课程去重**：同一课程只能有一个进行中(status=0)的预约，跨排期也不允许，提示"您已预约了该课程的其他排期，如需预约当前排期，请先取消已有的预约"

> **2026-03 变更**：不再校验合同签署状态（contract_signed），只需 `user_courses.status=1` 即可预约。课程合同改为管理员线下录入（`adminCreateCourseContract`）。

**响应数据**:
```json
{
  "appointment_id": 100,
  "class_record_id": 1,
  "class_date": "2026-03-01",
  "start_time": "09:00-17:00",
  "used_retrain_credit": false
}
```

| 返回字段 | 类型 | 说明 |
|---|---|---|
| used_retrain_credit | Boolean | 本次预约是否使用了复训资格抵用 |

**数据库设计注意点**:
- appointments 表:
  - `is_retrain`: 0首次/1复训
  - `order_no`: VARCHAR(32),关联订单号(复训专用)
  - `user_course_id`: INT, NOT NULL
- 建议添加索引: (user_id, class_record_id)

> **沙龙课程（type=4）特殊处理**（2026-03 新增）：
> - 跳过 user_courses 存在性校验，改为自动创建 user_courses 记录（buy_price=0, order_no=null, status=1, attend_count=0）
> - 其余逻辑不变：名额检查、重复预约检查、booked_quota+1

### 🔵 4.3 取消预约
**接口**: `DELETE /api/appointment/cancel`  
**action**: `cancelAppointment`（course 云函数）  
**调用方**: 客户端（小程序）  
**描述**: 取消预约（支持截止日期校验 + 复训资格保留）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| appointmentId | Number | 是 | 预约 ID |

**业务规则**:
- 仅 `status=0` 的预约可取消
- 校验取消截止日期：当前日期 < `class_date - cancel_deadline_days`，超过截止日期不可取消
- 取消后 `appointment.status=3`，`booked_quota-1`
- 复训预约（`is_retrain=1`）取消后，对应订单 `retrain_credit_status` 设为 1（可抵用）

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| appointment_id | Number | 已取消的预约 ID |
| has_retrain_credit | Boolean | 是否保留了复训资格 |
| message | String | 提示信息 |

### 🔵 4.3a 检查复训资格
**action**: `checkRetrainCredit`（course 云函数）  
**调用方**: 客户端（小程序）  
**描述**: 检查用户是否有指定课程的可抵用复训资格

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程 ID |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| has_credit | Boolean | 是否有可抵用的复训资格 |

**业务规则**:
- 查询 `orders` 表中 `user_id` 匹配、`order_type=2`、`pay_status=1`、`retrain_credit_status=1` 且 `related_id` 关联到同课程的 `user_course` 记录

### 🔵 4.4 我的预约
**接口**: `GET /api/appointment/my`  
**action**: `getMyAppointments`（course 云函数）

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Number | 否 | 页码，默认 1 |
| page_size | Number | 否 | 每页条数，默认 20 |
| status | Number | 否 | 筛选状态：沙龙(0待上课/1已签到/2已结课/3已取消)、非沙龙(0进行中/1已结课/3已取消/4缺席)，-1或不传为全部 |

> 前端采用滚动分页加载，每次 20 条，累计最多展示 99 条（变更于 2026-03-03）

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
      "is_retrain": 0,
      "status": 0,
      "checkin_code": "ABC123",
      "cancel_deadline_days": 3
    }
  ]
}
```

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| is_retrain | Number | 是否复训预约（0/1） |
| cancel_deadline_days | Number | 该排期的取消截止天数 |
| retrain_credit_status | Number\|null | 复训资格状态（仅 is_retrain=1 时有值）：0=已失效 / 1=资格保留 / 2=已使用 |
| retrain_refund_status | Number\|null | 关联复训订单的退款状态（仅 is_retrain=1 时有值）：0=无退款 / 1=申请中 / 3=已退款 / 4=已驳回 |

**复训费退款按钮显示逻辑**（前端计算）:
- `status === 3`（已取消）且 `is_retrain === 1` 且 `retrain_credit_status === 1` 且 `retrain_refund_status` 为 0 或 4
- 同一 `order_no` 对应多条已取消预约时，仅在 `cancel_time` 最新的那条上显示按钮

### 🔴 4.5 上课记录管理 - 创建

- **action**: `createClassRecord`
- **调用方**: 管理后台

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程 ID |
| classDate | String | 是 | 开课日期（YYYY-MM-DD），不能早于今天 |
| classEndDate | String | 否 | 结课日期（YYYY-MM-DD），默认等于 classDate |
| classTime | String | 否 | 上课时段（如 "09:00-17:00"） |
| classLocation | String | 否 | 上课地点 |
| teacher | String | 否 | 主讲老师 |
| totalQuota | Number | 否 | 总名额，默认 30 |
| cancelDeadlineDays | Number | 是 | 取消预约截止天数，必须为大于0的整数 |
| remark | String | 否 | 备注 |

**业务规则**:
- `classDate` 不能早于服务器当天日期（北京时间），否则返回参数错误
- `classEndDate` 不能早于 `classDate`
- 沙龙课程（type=4）只允许存在一个有效排期，重复创建返回错误

---

### 🔴 4.5b 上课记录管理 - 更新

- **action**: `updateClassRecord`
- **调用方**: 管理后台
- **描述**: 取消排期（排期创建后不可编辑，仅支持取消）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Number | 是 | 排期 ID |
| status | Number | 是 | 必须为 0（取消排期） |

**业务规则**:
- 排期创建后不可编辑，仅允许取消（`status=0`）
- 取消时自动取消该排期下所有待上课预约，复训预约触发复训资格保留（`retrain_credit_status=1`）

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| success | Boolean | 操作是否成功 |
| cancelled_appointments | Number | 被取消的预约数量 |
| message | String | 提示信息 |

### 🔴 4.5c 上课记录管理 - 获取排期列表

- **action**: `getClassRecordList`
- **调用方**: 管理后台

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | Number | 否 | 页码，默认 1 |
| page_size | Number | 否 | 每页条数，默认 10 |
| courseId | Number | 否 | 课程 ID 筛选 |
| status | Number | 否 | 状态筛选 |

**返回字段**:

| 字段名 | 类型 | 说明 |
|---|---|---|
| cancel_deadline_days | Number | 取消预约截止天数 |

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
- **action**: `getCaseList`
- **调用方**: 客户端（公开接口）
- **描述**: 获取已上架的学员案例列表，支持分类筛选

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| category | String | 否 | 分类筛选：entrepreneur/startup/workplace |
| keyword | String | 否 | 关键词搜索（标题/摘要/学员姓名） |
| page | Number | 否 | 页码，默认 1 |
| page_size | Number | 否 | 每页条数，默认 10 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | Number | 案例ID |
| title | String | 案例标题 |
| student_name | String | 学员姓名 |
| student_surname | String | 学员姓氏 |
| student_avatar | String | 学员头像（CDN URL） |
| student_title | String | 学员头衔/职业 |
| student_desc | String | 学员描述 |
| category | String | 分类 |
| category_label | String | 分类标签名称 |
| avatar_theme | String | 头像主题色 |
| badge_theme | String | 徽章主题色 |
| summary | String | 案例摘要 |
| content | String | 案例详情内容 |
| quote | String | 学习感悟 |
| achievements | Array | 成果列表（字符串数组） |
| video_url | String | 视频URL（CDN URL） |
| images | Array | 图片URL数组（CDN URL） |
| cover_image | String | 封面图（派生：images[0] 或 student_avatar） |
| course_id | Number | 关联课程ID |
| course_name | String | 关联课程名称 |
| view_count | Number | 浏览次数 |
| like_count | Number | 点赞次数 |
| is_featured | Number | 是否精选 0/1 |
| sort_order | Number | 排序权重 |
| created_at | String | 创建时间 |

**业务规则**
- 仅返回 status=1 的案例
- 排序：精选优先 → 排序权重降序 → ID 降序

### 🔵 5.3.1 学员案例详情
- **action**: `getCaseDetail`
- **调用方**: 客户端（公开接口）
- **描述**: 获取单个案例的完整详情，自动增加浏览次数

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Number | 是 | 案例ID |

**返回字段**：同 5.3 列表字段（含全部字段）

**业务规则**
- 自动递增 view_count
- 仅返回 status=1 的案例，已下架返回 404

### 🔴 5.4 素材管理 - CRUD
**接口**:
- `POST /api/admin/material/create`
- `PUT /api/admin/material/update`
- `DELETE /api/admin/material/delete`
- `GET /api/admin/material/list`

### 🔴 5.5 学员案例管理 - 创建
- **action**: `createCase`
- **调用方**: 管理后台
- **描述**: 创建学员案例

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| title | String | 是 | 案例标题 |
| studentName | String | 是 | 学员姓名 |
| studentSurname | String | 否 | 学员姓氏（用于头像文字） |
| studentAvatar | String | 否 | 学员头像 fileID |
| studentTitle | String | 否 | 学员头衔/职业 |
| studentDesc | String | 否 | 学员描述 |
| category | String | 否 | 分类：entrepreneur/startup/workplace |
| categoryLabel | String | 否 | 分类标签名称 |
| avatarTheme | String | 否 | 头像主题色：default/success/primary |
| badgeTheme | String | 否 | 徽章主题色：warning/success/primary |
| summary | String | 否 | 案例摘要 |
| content | String | 否 | 案例详情 |
| quote | String | 否 | 学习感悟 |
| achievements | Array | 否 | 成果列表（字符串数组） |
| videoUrl | String | 否 | 视频 fileID |
| images | Array | 否 | 图片 fileID 数组 |
| courseId | Number | 否 | 关联课程ID |
| courseName | String | 否 | 课程名称（可自动查询） |
| sortOrder | Number | 否 | 排序，默认 0 |
| isFeatured | Number | 否 | 是否精选 0/1 |
| status | Number | 否 | 状态：0隐藏/1显示，默认 1 |

### 🔴 5.6 学员案例管理 - 更新
- **action**: `updateCase`
- **调用方**: 管理后台
- **描述**: 更新学员案例（仅更新传入的字段）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Number | 是 | 案例ID |
| 其他字段 | - | 否 | 同 createCase，仅传入需要更新的字段 |

### 🔴 5.7 学员案例管理 - 删除
- **action**: `deleteCase`
- **调用方**: 管理后台
- **描述**: 软删除案例（status 置为 0）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| caseId | Number | 是 | 案例ID |

### 🔴 5.8 学员案例管理 - 列表
- **action**: `getCaseList`（管理端）
- **调用方**: 管理后台
- **描述**: 获取全部案例列表（含隐藏），支持课程筛选

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| status | Number | 否 | 状态筛选 |
| courseId | Number | 否 | 关联课程ID筛选 |
| keyword | String | 否 | 关键词搜索 |
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

**返回字段**：同 5.3 公开接口字段，额外含 updated_at

**备注（V2 变更）**
- 新增 courseId 过滤支持
- SELECT 补全全部字段（category, student_surname, student_desc, avatar_theme, badge_theme, quote, achievements, is_featured）
- achievements 字段已在返回时从 JSON 字符串解析为数组
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

### 获取商学院板块列表

- **action**: `getAcademySections`
- **云函数**: course
- **调用方**: 小程序客户端（公开接口，无需登录）
- **描述**: 获取商学院首页的所有启用板块，按排序权重升序排列

**请求参数**

无需参数

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| list | Array | 板块列表 |
| list[].id | Number | 板块ID |
| list[].section_type | String | 板块类型：hero/quick_access/intro/concepts/teachers/timeline/honors |
| list[].title | String | 板块标题 |
| list[].icon | String | 标题图标(Emoji) |
| list[].content | Object | 板块内容(JSON，结构因类型而异) |
| list[].sort_order | Number | 排序权重 |

**业务规则**
- 只返回 status=1 的板块
- hero（content.image）、quick_access（content.items[].image）、teachers（content.items[].avatar）、honors（content.items[].image）中的云存储字段自动转换为 CDN URL
- hero 类型 content 结构：`{"image":"CDN URL"}` — 整张 Banner 图片
- quick_access 类型 content 结构：`{"items":[{"image":"CDN URL","link":"跳转路径"}]}` — 图片卡片
- concepts 中 color 为 HEX 颜色值，teachers 中 theme 为 HEX 头像底色

### 管理商学院板块

- **action**: `manageAcademySections`
- **云函数**: course
- **调用方**: 管理后台
- **描述**: 管理商学院首页板块的增删改查、排序和状态切换

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| operation | String | 是 | 操作类型：list/detail/create/update/delete/updateSort/toggleStatus |
| id | Number | 否 | 板块ID（detail/update/delete/toggleStatus 时必填） |
| sectionType | String | 否 | 板块类型（create 时必填）：hero/quick_access/intro/concepts/teachers/timeline/honors |
| title | String | 否 | 板块标题（create 时必填） |
| icon | String | 否 | 标题图标 |
| content | Object | 否 | 板块内容JSON |
| sortOrder | Number | 否 | 排序权重 |
| status | Number | 否 | 状态：0隐藏/1显示 |
| items | Array | 否 | 排序数据（updateSort 时必填）：[{id, sortOrder}] |

**返回字段（list 操作）**

| 字段名 | 类型 | 说明 |
|---|---|---|
| list | Array | 全部板块列表（含隐藏） |
| total | Number | 总数 |

**业务规则**
- create：验证 sectionType 必须为 7 种合法类型之一
- update：仅更新传入的字段
- toggleStatus：自动取反当前状态
- updateSort：批量更新多个板块的排序

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
    "upgrade_payment_amount": 9800.00
  }
}
```

### 🔵 6.2 申请成为大使/升级
**接口**: `POST /api/ambassador/apply`  
**action**: `apply`（ambassador 云函数）

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

**前置条件**:
- 普通用户(level=0)：无前置课程要求
- 准青鸾(level=1)：无前置课程要求

**业务逻辑**:
```
1. 验证用户已登录(CloudBase uid)
2. 检查资料是否完善:
   IF profile_completed = 0:
       返回错误: "请先完善个人资料"
3. 检查是否已是大使(level>=2):
   IF ambassador_level >= 2:
       返回错误: "您已经是传播大使,无需重复申请"
4. 目标等级 target_level 规则:
   - 普通用户(level=0)提交时: target_level 自动设为 2（青鸾）
   - 准青鸾(level=1)重新申请时: target_level 也为 2（青鸾）
5. 普通用户(level=0)即时升级:
   - 提交申请时，立即将 ambassador_level 更新为 1（准青鸾）
   - 返回 instant_upgraded = true, new_level = 1
6. 准青鸾(level=1)提交时:
   - 不即时升级，需等待审核
   - 返回 instant_upgraded = false
7. 验证前置条件(仅 level=0 时):
   查询用户课程:
   IF NOT EXISTS(
       SELECT 1 FROM user_courses 
       WHERE user_id = ? AND course_type = 2  // 密训班
   ):
       返回错误: "必须先购买密训班才能申请成为传播大使"
8. 检查是否重复申请:
   IF EXISTS(
       SELECT 1 FROM ambassador_applications 
       WHERE user_id = ? AND status IN (0,1,2)  // 待审核/待面试/面试中
   ):
       返回错误: "您已提交申请,请等待审核结果"
9. 验证必填字段:
   IF real_name OR phone OR wechat_id OR city OR apply_reason 为空:
       返回错误: "请填写完整的申请信息"
10. 创建申请记录:
    INSERT INTO ambassador_applications (
      user_id, real_name, phone, wechat_id, city,
      occupation, apply_reason, understanding,
      willing_help, promotion_plan, target_level,
      status = 0,  // 待审核
      created_at = NOW()
    )
11. 发送通知给管理员(待审核提醒)
12. 返回申请成功信息
```

**返回字段**:
| 字段名 | 类型 | 说明 |
|---|---|---|
| application_id | Number | 申请记录ID |
| target_level | Number | 目标等级（普通用户/准青鸾申请时均为 2） |
| status | Number | 申请状态（0=待审核） |
| message | String | 提示文案 |
| instant_upgraded | Boolean | 是否已即时升级为准青鸾（普通用户提交时为 true） |
| new_level | Number | 即时升级后的等级（instant_upgraded=true 时为 1） |

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
**云函数**: `user` → Action: `getMeritPointsHistory`
**调用方**: 客户端（需登录）
**描述**: 获取当前用户的功德分明细记录，支持分页和按来源分类筛选

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceFilter | Number[] | 否 | 来源筛选数组，不传返回全部。如 [1,2] 只返回推荐类 |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

**来源枚举值(source)**:
- `1`: 推荐初探班
- `2`: 推荐密训班
- `3`: 辅导员
- `4`: 义工
- `5`: 沙龙活动
- `6`: 兑换（商城兑换商品/课程）
- `7`: 其他（含活动岗位功德分、管理员调整）

**前端 Tab 映射**:
| Tab | sourceFilter |
|-----|-------------|
| 全部 | 不传 |
| 推荐 | [1, 2] |
| 活动 | [3, 4, 5, 7] |
| 兑换 | [6] |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| list[].id | Number | 记录ID |
| list[].change_amount | Number | 变动金额（正数=收入，负数=支出） |
| list[].balance_after | Number | 变动后余额 |
| list[].change_type | Number | 1=收入, 2=支出 |
| list[].source | Number | 来源枚举值 |
| list[].related_id | String | 关联订单号或兑换单号 |
| list[].referee_user_name | String | 被推荐人姓名（推荐类有值） |
| list[].activity_name | String | 活动名称（活动类有值） |
| list[].remark | String | 备注 |
| list[].created_at | String | 创建时间 |
| total | Number | 总记录数 |

**业务规则**:
- 2026-03-13 新增 sourceFilter 数组参数，支持 Tab 分类筛选
- 修复前：Tab 切换无效，前端未传参 + 后端不支持筛选

**响应数据**:
```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "change_amount": 7777.60,
      "balance_after": 12777.60,
      "change_type": 1,
      "source": 2,
      "related_id": "ORD202401150001",
      "referee_user_name": "学员姓名",
      "activity_name": null,
      "remark": "推荐学员购买道天密训班，20%功德分",
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
**Action**: `client:applyWithdraw`

**请求参数**:
```json
{
  "amount": 1688.00
}
```

> **变更说明（2026-03-23）**: 银行收款信息不再由前端传入，改为从用户个人资料（`users` 表 `bank_account_name`/`bank_name`/`bank_account_number`）自动读取。用户需在「个人资料」页面预先填写银行账户信息。原 `bankAccountName`、`bankName`、`bankAccountNumber`、`saveAccountInfo` 参数已废弃。

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

**云函数对齐（2026-04-02）**：小程序实际调用 `order` 云函数 `action: getMallGoods`，**游客可读**（不要求 `users` 表已注册）。商城内「兑换课程」Tab 列表为同云函数 `action: getMallCourses`，**同为游客可读**。

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

**接口概述**: 使用功德分（或积分）兑换商品，直接完成扣除，不走支付流程

**重要说明**:
- 不走支付接口，在商城页面直接完成
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

**前端调用场景说明（三种情况）**:
```
情况 1：功德分 >= 总价格
  → use_cash_points_if_not_enough = false
  → 弹框提示："确定用功德分兑换商品吗？"
  → 后端仅扣功德分，不动积分

情况 2：功德分 < 总价格，且积分 >= 总价格
  → use_cash_points_if_not_enough = true
  → 弹框提示："功德分不足，需要用积分兑换商品吗？"
  → 后端先扣尽现有功德分，剩余部分用积分补差
  → 注意：积分门槛是"积分 >= 全价"，而非"积分 >= 补差额"

情况 3：功德分 < 总价格，且积分 < 总价格
  → 前端直接弹框提示"功德分或积分不够"，不调用接口
```

**业务逻辑**:
```
1. 验证用户已完善资料(profile_completed = 1)
2. 验证商品存在和库存充足
3. 计算支付方式:
   总成本 = goods.merit_points_price * quantity
   
   IF user.merit_points >= 总成本:
       // 情况1：只用功德分
       merit_points_used = 总成本
       cash_points_used = 0
   ELSE IF use_cash_points_if_not_enough = true:
       // 情况2：只用积分全额支付，功德分不动
       merit_points_used = 0
       cash_points_used = 总成本
       
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

### 🔵 6.13b 撤销兑换
**云函数**: `order`，**Action**: `cancelExchange`

**接口概述**: 用户主动撤销尚未领取的兑换订单，退还功德分/积分并恢复商品库存

**适用场景**: 仅限 `status=1`（已兑换/未领取）的记录，`status=2`（已领取）和 `status=3`（已取消）不可撤销

**请求参数**:
```json
{
  "exchange_no": "EX202401150001"
}
```

**业务逻辑**:
```
1. 验证用户身份（通过 CloudBase context 获取 uid）
2. 查询兑换记录：
   SELECT * FROM mall_exchange_records WHERE exchange_no = {exchange_no} AND user_id = {user_id}
   - 不存在 → 返回错误："兑换记录不存在"
   - status = 2 → 返回错误："商品已领取，无法撤销"
   - status = 3 → 返回错误："该记录已取消"

3. 查询商品当前库存（用于恢复）
   SELECT stock_quantity, sold_quantity FROM mall_goods WHERE id = {goods_id}

4. 开启事务：

5. 更新兑换状态为已取消：
   UPDATE mall_exchange_records SET status = 3 WHERE exchange_no = {exchange_no}

6. 退还功德分和积分：
   UPDATE users SET
     merit_points = merit_points + {merit_points_used},
     cash_points_available = cash_points_available + {cash_points_used}
   WHERE id = {user_id}

7. 恢复商品库存（仅当 stock_quantity != -1 时）：
   UPDATE mall_goods SET
     stock_quantity = stock_quantity + {quantity},
     sold_quantity = sold_quantity - {quantity}
   WHERE id = {goods_id}

8. 插入功德分退还明细（仅当 merit_points_used > 0）：
   INSERT INTO merit_points_records (
     user_id, type=1（收入）, source=6（商城兑换）,
     amount=+{merit_points_used},
     balance_after={用户退还后的功德分},
     exchange_no={exchange_no},
     remark="撤销兑换：{goods_name}"
   )

9. 插入积分退还明细（仅当 cash_points_used > 0）：
   INSERT INTO cash_points_records (
     user_id, type=3（直接发放）,
     amount=+{cash_points_used},
     available_after={用户退还后的积分},
     remark="撤销兑换：{goods_name}"
   )

10. 提交事务

11. 返回撤销成功
```

**响应数据**:
```json
{
  "exchange_no": "EX202401150001",
  "goods_name": "道天文化帆布包",
  "merit_points_refunded": 0.00,
  "cash_points_refunded": 80.00,
  "status": "已取消"
}
```

**错误响应**:
```json
{ "code": 400, "message": "商品已领取，无法撤销" }
{ "code": 400, "message": "该记录已取消" }
{ "code": 404, "message": "兑换记录不存在" }
```

**数据库变更说明**:

| 表 | 字段 | 变化 |
|----|------|------|
| `mall_exchange_records` | `status` | 1 → 3（已取消） |
| `users` | `merit_points` | + merit_points_used |
| `users` | `cash_points_available` | + cash_points_used |
| `mall_goods` | `stock_quantity` | + quantity（非无限库存时） |
| `mall_goods` | `sold_quantity` | - quantity |
| `merit_points_records` | 新增记录 | type=1, source=6, amount=正值（退还） |
| `cash_points_records` | 新增记录（若有积分支付） | type=3, amount=正值（退还） |

---

### 🔵 6.13c 兑换课程
**云函数**: `order`，**Action**: `exchangeCourse`

**接口概述**: 使用功德分（或积分）兑换商城课程，直接解锁 `user_courses`，无需线下领取，不创建 `orders` 表记录。

**重要说明**:
- 兑换价格以 `courses.current_price`（人民币价格）作为功德分/积分消耗数量（1元 = 1功德分/积分）
- 允许重复兑换同一课程（如复训场景），只要余额足够即可
- 密训班兑换**不赠送**初探班（与支付购买不同）
- 功德分/积分支付逻辑与 §6.13 商品兑换完全相同（三种情况）

**请求参数**:
```json
{
  "action": "exchangeCourse",
  "course_id": 1,
  "use_cash_points_if_not_enough": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `course_id` | int | 是 | 课程ID |
| `use_cash_points_if_not_enough` | bool | 否 | 功德分不足时是否改用积分，默认 false |

**支付场景**:
```
情况1（功德分充足）:
  use_cash_points_if_not_enough = false/true
  → 只扣功德分 merit_points -= price

情况2（功德分不足 + use_cash_points_if_not_enough=true）:
  → 只扣积分 cash_points_available -= price
  （功德分保持不变）

情况3（功德分不足 + use_cash_points_if_not_enough=false）:
  → 返回错误"功德分不足，是否使用积分兑换？"
```

**业务逻辑**:
```
1. 权限验证：检查用户资料是否完善（profile_completed=1）
2. 查询课程：courses WHERE id=course_id AND status=1 AND type IN (1,2)
   - 课程不存在或未上架 → 返回错误
3. 库存验证：stock=-1（无限库存）跳过；stock>0 才允许兑换
4. 计算价格：price = courses.current_price（精确到分，取整）
5. 判断支付方式（见支付场景）
6. 事务执行：
   a. 扣减 users.merit_points 或 cash_points_available
   b. 写入 user_courses（见写入规则）
   c. 密训班赠送课程处理（2026-03 新增）：
      - 查询 courses.included_course_ids
      - 对每个赠送课程：
        - 用户无该课程 → 新建 user_courses（is_gift=1, gift_source="兑换XX赠送"）
        - 用户已有 → 在现有 expire_at 上叠加 validity_days 天
   d. 写入 merit_points_records 或 cash_points_records（见明细规则）
   e. 更新 courses.sold_count +1
      若 stock != -1：courses.stock -1
```

**user_courses 写入规则**:
```
查询 user_courses WHERE user_id=? AND course_id=? AND status=1：

IF 已有记录（重复兑换/续期）:
  → UPDATE user_courses SET expire_at = 原 expire_at + 1年
    （在原有效期基础上顺延，不新建记录）

IF 无记录（首次兑换）:
  → INSERT INTO user_courses:
      user_id        = user.id
      _openid        = OPENID
      course_id      = course_id
      course_type    = courses.type
      course_name    = courses.name
      order_no       = NULL（功德分兑换无订单号）
      buy_price      = price（消耗的功德分/积分数量）
      buy_time       = 当前时间（UTC+8）
      expire_at      = 当前时间 + 1年（UTC+8）
      is_gift        = 0
      attend_count   = 1
      status         = 1

所有课程（无论购买方式）有效期均为 1 年。
```

**积分明细写入规则**:
```
功德分消耗时 → INSERT INTO merit_points_records:
  type          = 2（支出）
  source        = 6（商城兑换）
  amount        = price
  balance_after = 扣减后余额
  remark        = "兑换课程：{courses.name}"

积分消耗时 → INSERT INTO cash_points_records:
  type          = 4（支出/消费）
  amount        = price
  available_after = 扣减后余额
  remark        = "兑换课程：{courses.name}"
```

**响应数据**:
```json
{
  "success": true,
  "code": 0,
  "message": "兑换成功",
  "data": {
    "user_course_id": 101,
    "course_id": 1,
    "course_name": "初探班",
    "course_type": 1,
    "merit_points_used": 1688.00,
    "cash_points_used": 0.00,
    "price": 1688
  }
}
```

**错误码**:
| 场景 | message |
|------|---------|
| 课程不存在或未上架 | "课程不存在或已下架" |
| 库存不足 | "课程名额已满" |
| 功德分不足且未选积分 | "功德分不足，是否使用积分兑换？" |
| 功德分和积分都不足 | "功德分和积分均不足，无法兑换" |
| 用户资料未完善 | "请先完善个人资料" |

---

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

### ~~6.15 查询我的名额~~（2026-03-09 已隐藏）

> ⚠️ 赠送名额功能已隐藏。接口 `getMyQuotas` 保留但无实际数据（所有等级 gift_quota 已清零）。

### ~~6.16 赠送名额~~（2026-03-09 已隐藏）

> ⚠️ 赠送名额功能已隐藏。接口 `giftQuota` 保留但无可用名额。

### ~~6.17 管理端赠送课程~~（2026-03-03 新增，2026-03-09 已隐藏）

> ⚠️ 赠送课程功能已隐藏。接口 `adminGiftCourse` 保留但后台入口已移除。数据库表 `ambassador_quotas`/`quota_usage_records` 保留，不再写入新数据。

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
**action**: `auditApplication`（ambassador 云函数）

**请求参数**:
```json
{
  "application_id": 1,
  "action": "approve",  // approve/reject/arrange_interview
  "frozen_points": 1688,  // 通过时必填，管理员手动设置的冻结积分
  "interview_time": "2024-01-20 14:00:00",
  "interview_remark": "面试备注",
  "reject_reason": "拒绝原因"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| application_id | Number | 是 | 申请记录ID |
| action | String | 是 | approve/reject/arrange_interview |
| frozen_points | Number | 是（当 action=approve 时） | 管理员手动设置的冻结积分，签署协议时发放 |
| interview_time | String | 否 | 面试时间（arrange_interview 时必填） |
| interview_remark | String | 否 | 面试备注 |
| reject_reason | String | 否 | 拒绝原因（reject 时必填） |

**frozen_points 校验规则**（当 action=approve 时）:
- `frozen_points` 必须是目标等级 `unfreeze_per_referral` 的整数倍
- `frozen_points = 0` 时跳过该校验
- 目标等级 `unfreeze_per_referral = 0` 时，拒绝通过（无法设置有效冻结积分）

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
       a. 校验 frozen_points（见上方校验规则）
       b. 开启事务
       c. 更新申请状态并写入 frozen_points:
          UPDATE ambassador_applications SET
            status = 3,  // 已通过
            frozen_points = ?,  // 管理员设置的值，签署协议时发放
            audit_admin_id = ?,
            audit_time = NOW(),
            audit_remark = ?
          WHERE id = ?
       
       d. 提交事务（不在此处更新用户等级，需用户签署协议后完成升级）
       e. 发送通过通知给用户
       f. 返回: "审核通过，请引导用户签署协议后完成升级"
   
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
**action**: `getUpgradeGuide`（ambassador 云函数）

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
  "instant_upgrade": false,
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
  "upgrade_options": [
    {
      "type": "contract",
      "name": "签署青鸾大使协议",
      "eligible": false,
      "requirements": ["提交大使申请并通过审核", "签署《青鸾大使协议》"]
    },
    {
      "type": "instant_apply",
      "name": "立即申请",
      "eligible": true
    }
  ],
  "can_upgrade": false
}
```

| 返回字段（补充） | 类型 | 说明 |
|---|---|---|
| instant_upgrade | Boolean | 普通用户(level=0)是否可即时升级为准青鸾（提交申请即升级） |
| has_advanced_course | Boolean | 普通用户是否已购买密训班（`course_type=2`），仅 level=0 时返回实际查询结果，其他等级恒为 `true`。前端在普通用户申请准青鸾时，若为 `false` 则拦截申请并提示购买密训班 |
| upgrade_options | Array | 升级选项，仅包含 `contract`、`instant_apply` 类型，**不包含** `payment` 类型 |

**业务逻辑**:
```
1. 获取用户当前等级
2. 判断下一等级和升级类型:
   - 准青鸾→青鸾: upgrade_type=2(协议)，无支付步骤
   - 青鸾→鸿鹄: 无支付步骤（已移除 payment 类型）
3. 检查升级条件是否满足
4. 检查是否已签署对应协议
5. 返回条件列表和可操作链接
6. upgrade_options 仅包含 contract、instant_apply 类型
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

### 🔴 6.20 兑换记录管理 - 列表
**云函数**: `order`，**Action**: `getExchangeList`

**接口概述**: 管理员查询所有用户的兑换记录，含用户信息，用于现场核对并确认领取

**请求参数**:
```json
{
  "status": 1,
  "keyword": "张三",
  "page": 1,
  "page_size": 20
}
```

**参数说明**:
- `status`：可选，1=已兑换(待领取) / 2=已领取 / 3=已取消；不传则查全部
- `keyword`：可选，按用户姓名或兑换单号模糊搜索

**响应新增字段**:
- `statistics`：全局统计（不受分页/搜索影响），包含 `pending`（已兑换待领取）、`picked`（已领取）、`cancelled`（已取消）数量

**业务逻辑**:
```
1. 验证管理员身份
2. 查询 mall_exchange_records JOIN users，返回用户信息用于现场核对：
   SELECT er.*, u.real_name, u.phone, u.id as user_db_id,
          mg.goods_name as goods_name_verify
   FROM mall_exchange_records er
   JOIN users u ON er.user_id = u.id
   LEFT JOIN mall_goods mg ON er.goods_id = mg.id
   WHERE [status/keyword条件]
   ORDER BY er.created_at DESC
3. 返回分页结果
```

**响应数据**:
```json
{
  "total": 10,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "exchange_no": "EX202401150001",
      "user_id": 30,
      "user_name": "张三",
      "user_phone": "138****8888",
      "goods_name": "道天文化帆布包",
      "goods_id": 4,
      "quantity": 1,
      "merit_points_used": 0.00,
      "cash_points_used": 80.00,
      "total_cost": 80.00,
      "status": 1,
      "status_name": "已兑换(待领取)",
      "created_at": "2026-02-23 21:05:33"
    }
  ]
}
```

---

### 🔴 6.21 兑换记录管理 - 确认领取
**云函数**: `order`，**Action**: `confirmPickup`

**接口概述**: 管理员在现场确认用户凭兑换单号领取商品后，将兑换状态从 `status=1`（已兑换/待领取）改为 `status=2`（已领取）

**适用场景**: 仅限 `status=1` 的记录；`status=2`（已领取）和 `status=3`（已取消）不可操作

**请求参数**:
```json
{
  "exchange_no": "EX202401150001",
  "remark": "已现场核对，正常领取"
}
```

**业务逻辑**:
```
1. 验证管理员身份
2. 查询兑换记录：
   SELECT * FROM mall_exchange_records WHERE exchange_no = {exchange_no}
   - 不存在 → 返回错误："兑换记录不存在"
   - status = 2 → 返回错误："该订单已确认领取"
   - status = 3 → 返回错误："该订单已取消，无法操作"
3. 更新兑换状态：
   UPDATE mall_exchange_records SET
     status = 2,
     pickup_admin_id = {admin.id},
     pickup_time = NOW(),
     remark = {remark}
   WHERE exchange_no = {exchange_no}
4. 返回成功
```

**响应数据**:
```json
{
  "exchange_no": "EX202401150001",
  "goods_name": "道天文化帆布包",
  "user_name": "张三",
  "status": 2,
  "status_name": "已领取",
  "pickup_time": "2026-02-23 21:30:00"
}
```

**数据库变更**:

| 表 | 字段 | 变化 |
|----|------|------|
| `mall_exchange_records` | `status` | 1 → 2 |
| `mall_exchange_records` | `pickup_admin_id` | null → 管理员ID |
| `mall_exchange_records` | `pickup_time` | null → 当前时间 |
| `mall_exchange_records` | `remark` | null → 备注 |

> ⚠️ **注意**：`mall_exchange_records` 表若无 `pickup_admin_id`、`pickup_time`、`remark` 字段，需先执行 DDL 添加（见下方）

**所需 DDL（首次部署时执行）**:
```sql
ALTER TABLE tiandao_culture.mall_exchange_records
  ADD COLUMN pickup_admin_id INT NULL COMMENT '确认领取的管理员ID',
  ADD COLUMN pickup_time DATETIME NULL COMMENT '领取时间',
  ADD COLUMN remark VARCHAR(200) NULL COMMENT '领取备注';
```

---

## 6.B 大使志愿活动模块（新增 2026-02）

> 本节接口对应 `ambassador` 云函数，管理端负责创建与派分功德分，客户端负责查看与报名。

### 🔴 6.B.1 获取岗位类型列表（管理端/客户端通用）
**云函数**: `ambassador` → Action: `getPositionTypeList`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| includeDisabled | Boolean | 否 | 是否包含已停用岗位（默认 false） |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "辅导员",
        "required_level": 1,
        "required_level_name": "准青鸾",
        "merit_points_default": 100,
        "description": "负责课程学员辅导工作",
        "status": 1,
        "sort_order": 1,
        "is_fixed": true,
        "created_at": "2026-02-01 10:00:00"
      }
    ],
    "total": 5
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| is_fixed | Boolean | 是否为固定岗位（辅导员/会务义工/沙龙组织），固定岗位不可删除、不可修改名称 |

---

### 🔴 6.B.2 创建岗位类型
**云函数**: `ambassador` → Action: `createPositionType`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 岗位名称（不可重复） |
| requiredLevel | Number | 否 | 最低大使等级要求 |
| meritPointsDefault | Number | 否 | 默认功德分值 |
| description | String | 否 | 岗位描述 |
| sortOrder | Number | 否 | 排序值（升序） |

**业务逻辑**:
1. 校验岗位名称不重复
2. 若指定 `requiredLevel`，校验该等级在 `ambassador_level_configs` 中存在
3. 插入 `ambassador_position_types` 表

**响应数据**:
```json
{ "success": true, "message": "岗位类型创建成功" }
```

---

### 🔴 6.B.3 更新岗位类型
**云函数**: `ambassador` → Action: `updatePositionType`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 岗位类型ID |
| name | String | 否 | 岗位名称 |
| requiredLevel | Number/null | 否 | 最低等级（null = 无限制） |
| meritPointsDefault | Number | 否 | 默认功德分值 |
| description | String | 否 | 描述 |
| status | Number | 否 | 状态（1启用 / 0停用） |
| sortOrder | Number | 否 | 排序值 |

**业务规则**:
- 辅导员、会务义工、沙龙组织为固定岗位，**不可修改名称**，修改时返回错误

**响应数据**:
```json
{ "success": true, "message": "岗位类型更新成功" }
```

---

### 🔴 6.B.4 删除岗位类型
**云函数**: `ambassador` → Action: `deletePositionType`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 岗位类型ID |

**业务规则**:
- 辅导员、会务义工、沙龙组织为固定岗位，**不可删除**，删除时返回错误

**响应数据**:
```json
{ "success": true, "message": "岗位类型「xxx」已删除" }
```

---

### 🔴 6.B.5 按等级获取协议模板
**云函数**: `ambassador` → Action: `getContractTemplateByLevel`
**权限**: 管理端

**功能说明**: 用于后台等级配置弹窗中回显该等级对应的协议模板，包含合同文件下载 URL。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | Number | 是 | 大使等级（1-5） |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "template": {
      "id": 3,
      "contract_name": "青鸾大使协议",
      "contract_type": 1,
      "ambassador_level": 2,
      "version": "v1.2",
      "contract_file_id": "cloud://xxx/contracts/level2/template.pdf",
      "contract_file_url": "https://xxx.tcb.qcloud.la/contracts/level2/template.pdf",
      "validity_years": 1,
      "status": 1,
      "created_at": "2026-01-10 08:00:00"
    }
  }
}
```

---

### 🔴 6.B.6 获取大使志愿活动列表
**云函数**: `ambassador` → Action: `getAmbassadorActivityList`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | String | 否 | 按排课名称搜索 |
| status | Number | 否 | 状态筛选（1进行中 / 0已结束） |
| page | Number | 否 | 页码（默认1） |
| pageSize | Number | 否 | 每页数量（默认20） |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "schedule_id": 5,
        "schedule_name": "孙膑道·密训班 第3期",
        "schedule_date": "2026-03-01",
        "schedule_location": "深圳总部",
        "positions": [
          { "name": "引导员", "quota": 5, "merit_points": 100, "registered_count": 3 }
        ],
        "total_quota": 10,
        "total_registered": 3,
        "status": 1,
        "merit_distributed": 0,
        "merit_distributed_at": null,
        "created_at": "2026-02-10 08:00:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 20
  }
}
```

**活动状态说明**:
- `1`: 招募中（报名未截止）
- `0`: 已结束（功德分已发放）

---

### 🔴 6.B.7 获取大使志愿活动详情
**云函数**: `ambassador` → Action: `getAmbassadorActivityDetail`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "schedule_id": 5,
    "schedule_name": "孙膑道·密训班 第3期",
    "schedule_date": "2026-03-01",
    "schedule_location": "深圳总部",
    "positions": [
      {
        "name": "引导员",
        "quota": 5,
        "merit_points": 100,
        "registered_count": 3,
        "remaining": 2
      }
    ],
    "total_quota": 10,
    "total_registered": 3,
    "status": 1,
    "merit_distributed": 0,
    "merit_distributed_at": null,
    "created_at": "2026-02-10 08:00:00"
  }
}
```

---

### 🔴 6.B.8 创建大使志愿活动
**云函数**: `ambassador` → Action: `createAmbassadorActivity`
**权限**: 管理端

**功能说明**: 基于排课记录创建志愿服务活动，每个排课只能创建一次活动，岗位配置内嵌于活动中（不依赖岗位类型表，支持自定义）。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | Number | 是 | 关联排课ID（class_records.id） |
| positions | Array | 是 | 岗位列表，见下方格式 |

**positions 格式**:
```json
[
  { "name": "引导员", "quota": 5, "merit_points": 100 },
  { "name": "沙盘助教", "quota": 3, "merit_points": 150 }
]
```

**业务规则**:
- 同一排课只能创建一个活动（重复创建返回错误）
- 岗位名称不能为空，名额 ≥ 1，功德分 ≥ 0
- 初始化每个岗位的 `registered_count = 0`

**响应数据**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "schedule_id": 5,
    "schedule_name": "孙膑道·密训班 第3期",
    "positions": [
      { "name": "引导员", "quota": 5, "merit_points": 100, "registered_count": 0 }
    ]
  }
}
```

---

### 🔴 6.B.9 删除大使志愿活动
**云函数**: `ambassador` → Action: `deleteAmbassadorActivity`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |

**业务规则**:
- 若功德分已发放（`merit_distributed = 1`），禁止删除
- 同步删除该活动的所有报名记录

**响应数据**:
```json
{ "success": true, "message": "删除成功" }
```

---

### 🔴 6.B.10 获取活动报名人员列表
**云函数**: `ambassador` → Action: `getActivityRegistrants`
**权限**: 管理端

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |
| positionName | String | 否 | 按岗位名称筛选 |
| page | Number | 否 | 页码（默认1） |
| pageSize | Number | 否 | 每页数量（默认20） |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 30,
        "user_name": "张三",
        "user_phone": "138****8000",
        "position_name": "引导员",
        "merit_points": 100,
        "status": 1,
        "status_text": "已报名",
        "created_at": "2026-02-15 09:00:00"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

**报名状态说明**:
- `1`: 已报名
- `2`: 已发放功德分

---

### 🔴 6.B.11 发放活动功德分
**云函数**: `ambassador` → Action: `distributeActivityMeritPoints`
**权限**: 管理端

**功能说明**: 活动结束后，管理员手动触发发放功德分。批量处理所有有效报名记录，为每位大使增加对应岗位的功德分，并写入活动记录供小程序展示。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |

**业务逻辑**:
1. 校验活动存在且功德分未发放（`merit_distributed = 0`）
2. 查询所有有效报名（`status = 1`）
3. 遍历报名记录：
   - 更新 `users.merit_points`（累加）
   - 插入 `merit_points_records`（type=1收入，source=7志愿活动岗位）
   - 插入 `ambassador_activity_records`（大使端展示用）
   - 更新报名状态为 `status = 2`（已发放）
4. 更新活动 `merit_distributed = 1`，`status = 0`（已结束）

**响应数据**:
```json
{
  "success": true,
  "message": "功德分发放完成，共发放 3 人",
  "data": {
    "total": 3,
    "success_count": 3
  }
}
```

---

### 🔵 6.B.12 获取可报名的活动列表（客户端）
**云函数**: `ambassador` → Action: `getAvailableActivities`
**权限**: 客户端（需登录）

**功能说明**: 返回当前招募中（status=1）且报名截止日期未到（排课日期 > 今天）的活动列表，附带当前用户等级。**仅展示用户已有有效预约（appointments.status=0）的排期所对应的活动**；响应中已移除 `my_registration` 字段。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码（默认1） |
| pageSize | Number | 否 | 每页数量（默认20） |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "schedule_name": "孙膑道·密训班 第3期",
        "schedule_date": "2026-03-01",
        "schedule_location": "深圳总部",
        "positions": [
          {
            "name": "引导员",
            "quota": 5,
            "merit_points": 100,
            "registered_count": 3,
            "remaining": 2,
            "required_level": 1,
            "required_level_name": "准青鸾",
            "can_apply": true
          }
        ],
        "status": 1,
        "user_level": 2
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 🔵 6.B.13 报名活动志愿岗位（客户端）
**云函数**: `ambassador` → Action: `applyForActivity`
**权限**: 客户端（需登录）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |
| positionName | String | 是 | 要报名的岗位名称 |

**业务规则**:
- 活动必须为招募中（`status = 1`）
- 报名截止日期为排课日期前一天（当天起不可报名）
- 岗位剩余名额 > 0
- 若岗位设有等级要求，用户大使等级必须达到
- 每个用户每个活动只能报名一个岗位（已报名的不可重复报名）
- 报名成功后 `registered_count + 1`
- **黑名单校验**（2026-03 新增）：报名前检查用户是否在活动黑名单中（`user_blacklist.type=2` 且 `expire_at > NOW()`），被拉黑用户无法报名

**响应数据**:
```json
{
  "success": true,
  "message": "报名成功",
  "data": {
    "activity_id": 1,
    "position_name": "引导员",
    "merit_points": 100
  }
}
```

---

### 🔵 6.B.14 获取我的报名列表（客户端）
**云函数**: `ambassador` → Action: `getMyRegistrations`
**调用方**: 客户端
**描述**: 获取当前用户的有效活动报名列表

**请求参数**: 无

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | Array | 报名记录列表 |
| list[].registration_id | Number | 报名记录ID |
| list[].activity_id | Number | 活动ID |
| list[].activity_name | String | 活动名称 |
| list[].schedule_date | String | 排期日期 |
| list[].schedule_location | String | 排期地点 |
| list[].position_name | String | 岗位名称 |
| list[].merit_points | Number | 功德分值 |
| list[].activity_status | Number | 活动状态：1 报名中 / 2 报名截止 |
| list[].created_at | String | 报名时间 |

**业务规则**: 只返回报名 `status=1` 且活动 `status IN (1,2)` 的记录

---

### 🔵 6.B.15 取消活动报名（客户端）
**云函数**: `ambassador` → Action: `cancelActivityRegistration`
**权限**: 客户端（需登录）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |

**业务规则**:
- 用户必须有 `status=1` 的有效报名记录
- 活动 `status != 0`（未结束）且 `status != 2`（报名截止）才允许取消；**活动报名已截止（status=2）时不可取消**
- 将报名记录 `status` 改为 `0`（已取消）
- 回写 `ambassador_activities.positions` 中对应岗位 `registered_count - 1`（最小为 0）

**响应数据**:
```json
{
  "success": true,
  "data": {
    "activity_id": 10,
    "position_name": "会务义工"
  },
  "message": "取消报名成功"
}
```

---

### 🔴 6.B.16 管理员添加报名人员
**云函数**: `ambassador` → Action: `adminAddRegistrant`
**调用方**: 管理后台
**描述**: 管理员手动添加活动报名人员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |
| userId | Number | 是 | 用户ID |
| positionName | String | 是 | 岗位名称 |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| activity_id | Number | 活动ID |
| user_id | Number | 用户ID |
| position_name | String | 岗位名称 |
| appointment_id | Number | 预约记录ID |

**业务规则**:
- 用户必须已购买该课程（有对应排期的有效预约或已购课程）
- 同活动内不可重复报名
- 若用户无有效预约，自动创建 `status=0` 的预约记录
- 管理员不受排期名额限制

---

### 🔵 6.B.17 获取活动记录列表（客户端）
**云函数**: `ambassador` → Action: `getActivityRecords`
**调用方**: 客户端（需登录）
**描述**: 获取当前用户的活动记录列表，支持分页和按活动类型筛选

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityType | Number | 否 | 活动类型筛选：0=全部（默认）/1=辅导员/2=会务义工/3=沙龙组织/4=其他/5=统筹/6=主持 |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 10 |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | Array | 活动记录列表 |
| list[].id | Number | 记录ID |
| list[].activity_type | Number | 活动类型 |
| list[].activity_name | String | 活动名称 |
| list[].activity_desc | String | 活动描述 |
| list[].location | String | 活动地点 |
| list[].start_time | String | 开始时间 |
| list[].duration | String | 时长 |
| list[].participant_count | Number | 参与人数 |
| list[].merit_points | Number | 功德分 |
| list[].note | String | 备注 |
| list[].images | Array | 活动图片 URL 数组 |
| total | Number | 总记录数 |
| stats | Object | 统计信息（同时返回） |
| stats.total_count | Number | 累计活动总数 |
| stats.total_merit_points | Number | 累计功德分 |
| stats.month_count | Number | 本月活动数 |
| stats.type_stats | Object | 按类型分布统计，key 为 1-6 |

**业务规则**:
- 仅查询 `status=1` 的有效记录
- `activityType=0` 或不传时返回全部类型
- `stats` 为全量统计（不受 activityType 筛选影响）
- 2026-03-13 修复：前端参数名从 `activity_type`(snake_case) 改为 `activityType`(camelCase)，修复 Tab 筛选无效的 Bug

---

### 🔵 6.B.18 获取活动统计信息（客户端）
**云函数**: `ambassador` → Action: `getActivityStats`
**调用方**: 客户端（需登录）
**描述**: 获取当前用户的活动统计汇总数据

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| total_count | Number | 累计活动总数 |
| total_merit_points | Number | 累计功德分 |
| month_count | Number | 本月活动数 |
| type_stats | Object | 按类型分布，key 为 1-6（1=辅导员/2=会务义工/3=沙龙/4=其他/5=统筹/6=主持） |

---

## 6.C 课程排课自动更新（定时触发，新增 2026-02）

### ⚙️ 6.C.1 自动更新排课状态
**云函数**: `course` → Action: `autoUpdateScheduleStatus`
**触发方式**: 定时器（每天 0 点触发，`cloudfunction.json` 配置）

**功能说明**: 自动更新排课状态 + 沙龙全自动流转 + 非沙龙结课/缺席处理。

**判断逻辑**:
1. 未开始(1) → 进行中(2)：`class_date <= 今天`
2. 沙龙自动签到：type=4 排期变为进行中时，appointments.status=0 → 1（自动签到）+ checkin_time
3. 进行中(2) → 已结束(3)：`class_end_date < 今天`
4a. 沙龙已结课：已结束排期中 appointments.status IN (0,1) → status=2（已结课）
4b. 非沙龙按签到分流：有签到记录(appointment_checkins) → status=1（已结课）+ attend_count+1，无签到记录 → status=4（缺席）
5. 沙龙结束清理：硬删除 class_records + user_courses + courses 记录，appointments 保留

> **attend_count 0→1 时 need_contract=0 的课程（2026-03 新增）**：
> `batchCheckin`（批量签到）和 `autoUpdateScheduleStatus`（定时更新排期状态）在 attend_count 从 0 变为 1 时，若课程 `need_contract=0` 且 `contract_signed=0`，会自动触发后续业务逻辑（设置有效期、发放推荐人奖励等）。

**响应数据**（日志用）:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-06",
    "affectedRows": 5,
    "toOngoing": 1,
    "toEnded": 1,
    "salonCompleted": 1,
    "toAbsent4": 1,
    "toFinished": 1,
    "salonAutoCheckin": 0,
    "salonCleanedCourses": 0,
    "salonCleanedRecords": 0,
    "message": "更新 5 条记录（排期状态 2 + 沙龙结课 1 + 非沙龙结课 1 + 非沙龙缺席 1 + 沙龙签到 0），沙龙清理 0 门课程"
  }
}
```

| 字段名 | 类型 | 说明 |
|--------|------|------|
| salonCompleted | Number | 沙龙已结课(status=2)预约数 |
| toAbsent4 | Number | 非沙龙缺席(status=4)预约数 |
| toFinished | Number | 非沙龙已结课(status=1)预约数 |
| salonAutoCheckin | Number | 沙龙自动签到预约数 |
| salonCleanedCourses | Number | 沙龙清理课程数 |
| salonCleanedRecords | Number | 沙龙清理排期数 |

---

## 6.C2 签到二维码管理（新增 2026-02）

### 🟡 6.C2.1 生成签到二维码
**云函数**: `course` → Action: `generateCheckinQRCode`
**权限**: 管理员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| classRecordId | Number | 是 | 排期ID |

**业务逻辑**:
1. 验证排期存在且未取消
2. 调用 `wxacode.getUnlimited` 生成小程序码（scene=`ci={classRecordId}`，page=`pages/course/checkin/index`）
3. 上传云存储（路径 `qrcodes/checkin/{classRecordId}_{timestamp}.png`）
4. 存入 `checkin_qrcodes` 表

**响应数据**:
```json
{
  "success": true,
  "data": {
    "qrcode_url": "https://xxx.tcb.qcloud.la/qrcodes/checkin/1_1709000000.png",
    "file_id": "cloud://xxx.xxx/qrcodes/checkin/1_1709000000.png",
    "scene": "ci=1",
    "class_record_id": 1,
    "course_name": "天道初探",
    "class_date": "2026-03-01"
  }
}
```

### 🟡 6.C2.2 获取签到二维码列表
**云函数**: `course` → Action: `getCheckinQRCodeList`
**权限**: 管理员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| classRecordId | Number | 否 | 按排期ID过滤 |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "class_record_id": 5,
        "course_name": "天道初探",
        "class_date": "2026-03-01",
        "qrcode_url": "https://xxx.tcb.qcloud.la/qrcodes/checkin/5_1709000000.png",
        "scene": "ci=5",
        "status": 1,
        "created_at": "2026-02-28 10:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 🟡 6.C2.3 删除签到二维码
**云函数**: `course` → Action: `deleteCheckinQRCode`
**权限**: 管理员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 签到码ID |

**响应数据**:
```json
{
  "success": true,
  "data": { "id": 1 },
  "message": "签到码删除成功"
}
```

### 🔵 6.C2.4 扫码签到（客户端）
**云函数**: `course` → Action: `scanCheckin`
**权限**: 已登录用户

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| classRecordId | Number | 是 | 排期ID（从二维码 scene 参数解析） |

**业务逻辑**（日签到系统改造后）:
- **沙龙课程(type=4)**：保持原有逻辑，更新 appointments.status=1
- **非沙龙课程(type=1/2/3)**：
  1. 校验今天在排期 [class_date, class_end_date] 范围内
  2. 检查 appointment_checkins 是否已有今日记录
  3. 插入 appointment_checkins 记录（checkin_type=1 扫码签到）
  4. 不修改 appointments.status 和 attend_count
  5. 不触发积分解冻（已删除该逻辑）

**响应数据**:
```json
{
  "success": true,
  "data": {
    "message": "今日签到成功",
    "checkin_at": "2026-03-01 09:15:00",
    "already_checked": false
  }
}
```

**错误场景**:
| 状态 | 错误信息 |
|------|---------|
| 无预约 | "您没有该课程的预约记录，无法签到" |
| 非沙龙已结课 | "课程已结课，无法签到" |
| 沙龙已签到 | "您已签到，请勿重复签到" |
| 已取消 | "该预约已取消，无法签到" |
| 不在签到时间内 | "不在签到时间内" |

---

### 🟢 6.C3.1 获取每日签到记录（管理端）
**云函数**: `course` → Action: `getDailyCheckins`
**权限**: 管理员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appointmentId | Number | 是 | 预约ID |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "appointment_id": 1,
    "class_date": "2026-03-26",
    "class_end_date": "2026-03-29",
    "course_type": 1,
    "checkins": [
      { "id": 1, "checkin_date": "2026-03-26", "checkin_time": "2026-03-26 09:00:00", "checkin_type": 1, "checkin_admin_id": null },
      { "id": 2, "checkin_date": "2026-03-27", "checkin_time": "2026-03-27 14:00:00", "checkin_type": 2, "checkin_admin_id": 1 }
    ]
  }
}
```

---

### 🟢 6.C3.2 管理每日签到（管理端）
**云函数**: `course` → Action: `manageDailyCheckin`
**权限**: 管理员

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appointmentId | Number | 是 | 预约ID |
| checkinDate | String | 是 | 签到日期（YYYY-MM-DD） |
| operation | String | 是 | 操作：checkin=补签 / cancel=取消签到 |

**业务规则**:
- 仅适用于非沙龙课程
- 签到日期必须在排期的 class_date ~ class_end_date 范围内
- 补签时在 appointment_checkins 插入记录（checkin_type=2 后台补签）
- 取消签到时删除对应日期的记录

**响应数据**:
```json
{ "success": true, "data": { "message": "补签成功" } }
```

---

## 6.C3 管理端积分调整（新增 2026-03）

### 🔴 6.C3.1 调整用户积分
**云函数**: `ambassador` → Action: `adjustPoints`
**调用方**: 管理后台
**描述**: 管理员手动调整用户的功德分或现金积分（可加可减），同时写入对应积分变动明细记录。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| user_id | Number | 是 | 用户 ID |
| point_type | String | 是 | 积分类型：`merit`（功德分）/ `cash`（现金积分） |
| amount | Number | 是 | 调整数额（正数=增加，负数=扣减） |
| reason | String | 是 | 调整原因（写入明细 remark） |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| success | Boolean | 是否成功 |
| message | String | 操作结果描述 |

**业务规则**
- `point_type` 仅接受 `merit` 或 `cash`
- 功德分调整：更新 `users.merit_points`，写入 `merit_points_records`（type=1获得/2使用，source=7 管理员调整）
- 现金积分调整：更新 `users.cash_points_available`，写入 `cash_points_records`（type=6 系统调整）
- ⚠️ 注意：此接口参数使用 **snake_case**（`user_id`、`point_type`），与其他管理端接口 camelCase 风格不同

---

## 6.E 排座管理接口（新增 2026-03）

### 🟢 6.E.1 获取排座数据

- **action**: `getSeatingData`
- **云函数**: `course`
- **调用方**: 管理后台
- **描述**: 获取指定排期的完整排座信息，包括配置、学员名单、岗位标签、座位分配

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| classRecordId | Number | 是 | 排期 ID |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| scheduleInfo | Object | 排期基本信息（course_name, period, class_date 等） |
| config | Object | 排座配置（desk_count, seats_per_desk, display_columns, table_cloth_color） |
| students | Array | 学员列表（user_id, user_name, user_phone） |
| positions | Object | 岗位映射 {user_id: position_name}，来自活动报名 |
| assignments | Array | 座位分配列表（user_id, desk_number, seat_number） |

**业务规则**
- 学员来自 appointments 表，status IN (0, 1)
- 岗位标签来自 ambassador_activity_registrations（通过 ambassador_activities.schedule_id 关联）
- 配置不存在时返回默认值（4桌×8座×3列）

---

### 🔴 6.E.2 保存排座配置

- **action**: `saveSeatingConfig`
- **云函数**: `course`
- **调用方**: 管理后台
- **描述**: 创建或更新排期的排座配置，桌数/座位数减少时自动清理超范围分配

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| classRecordId | Number | 是 | 排期 ID |
| deskCount | Number | 否 | 桌数（1-50，默认4） |
| seatsPerDesk | Number | 否 | 每桌座位数（4-12，默认8） |
| displayColumns | Number | 否 | 显示列数（3-10，默认3） |
| tableClothColor | String | 否 | 桌布颜色 HEX（默认 #228B22） |

**业务规则**
- UPSERT 语义：不存在则创建，存在则更新
- 桌数或座位数减少时，超出范围的已有座位分配会被自动删除

---

### 🔴 6.E.3 保存座位分配

- **action**: `saveSeatingAssignment`
- **云函数**: `course`
- **调用方**: 管理后台
- **描述**: 保存座位分配变更，支持入座、移除、交换三种操作，前端拖拽/点击后自动调用

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| classRecordId | Number | 是 | 排期 ID |
| operations | Array | 是 | 操作数组 |

**operations 每个元素**

| type | 必填参数 | 说明 |
|---|---|---|
| assign | userId, deskNumber, seatNumber | 将用户分配到指定座位（原座位上的人被移除） |
| remove | userId | 将用户从座位移回备选区 |
| swap | userId1, userId2 | 交换两个用户的座位 |

**业务规则**
- assign 操作会先移除该用户的原有座位和目标座位上的人
- swap 要求两个用户都已有座位

---

### 🔴 6.E.4 随机分配座位

- **action**: `randomAssignSeats`
- **云函数**: `course`
- **调用方**: 管理后台
- **描述**: 将指定用户随机分配到空座位

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| classRecordId | Number | 是 | 排期 ID |
| userIds | Array | 是 | 要分配的用户 ID 数组 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| assigned | Number | 成功分配的数量 |
| skipped | Number | 因空位不足而跳过的数量 |

**业务规则**
- 已有座位的用户不会被重新分配
- 使用 Fisher-Yates 洗牌算法随机打乱空座位

---

## 6.D 测试辅助接口（仅限测试环境，新增 2026-02）

### ⚠️ 6.D.1 模拟支付成功
**云函数**: `order` → Action: `testSimulatePayment`
**权限**: 公开（需传入测试密钥，⚠️ 仅限测试/开发环境使用）

**功能说明**: 跳过微信签名验证，直接触发支付成功业务逻辑（包含课程记录生成、推荐人奖励发放等），用于自动化测试和开发联调。

**⚠️ 安全警告**: 生产环境需通过配置关闭或限制此接口的访问，防止被恶意调用。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| order_no | String | 是 | 订单号 |
| test_secret | String | 是 | 测试密钥（固定值：`tiandao_test_2026`） |

**业务逻辑**:
1. 验证测试密钥
2. 查询订单（必须处于未支付状态）
3. 更新订单状态：`pay_status = 1`，生成模拟 `transaction_id`
4. 根据订单类型执行业务逻辑：
   - `order_type = 1`（课程）：生成课程记录、处理推荐人奖励、锁定推荐人

**响应数据**:
```json
{
  "success": true,
  "message": "模拟支付成功，业务已处理",
  "data": {
    "order_no": "TD202602270001",
    "transaction_id": "TEST_TXN_1709000000000",
    "processed_at": "2026-02-27 10:00:00"
  }
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
**action**: `signContract`（ambassador 云函数）

> 签署后直接生效（status=1），立即执行大使等级升级，无需审核。

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
- **冻结积分**：从 `ambassador_applications` 表的 `frozen_points` 字段读取（管理员审核时设置的值），签署时发放；签署后标记 `frozen_points_issued=1` 防止重复发放
- **不再检查** order_type=4 的升级订单支付状态（已移除支付检查逻辑）

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
**action**: `getMyContracts`（ambassador 云函数）

> 后端一次性返回全部协议，前端客户端截取前 99 条展示（变更于 2026-03-03）

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
      "remaining_days": 300,
      "sign_type": 1,
      "contract_images": ["https://xxx.tcb.qcloud.la/contracts/xxx.jpg"]
    }
  ]
}
```

| 返回字段（补充） | 类型 | 说明 |
|---|---|---|
| sign_type | Number | 签署类型：1=用户签署/2=管理员续签/3=管理员录入 |
| contract_images | Array<String> | 合同照片 URL 数组（管理员录入类型时有值） |

### 🔵 7.4 协议详情
**接口**: `GET /api/contract/detail`  
**action**: `getContractDetail`（ambassador 云函数）

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
  "status": 1,
  "contract_images": ["https://xxx.tcb.qcloud.la/contracts/xxx.jpg"],
  "sign_type": 1
}
```

| 返回字段（补充） | 类型 | 说明 |
|---|---|---|
| contract_images | Array<String> | 合同照片 URL 数组（管理员录入类型时有值） |
| sign_type | Number | 签署类型：1=用户签署/2=管理员续签/3=管理员录入 |

---

## 7B. 课程学习服务协议（2026-03 新增）

> 与大使合同体系并列，专用于课程首次预约前的签署拦截流程。

### 🔵 7B.1 检查课程合同签署状态 ⚠️ 已废弃

- **action**: `checkCourseContract`
- **云函数**: `ambassador`
- **调用方**: 客户端（小程序）
- **描述**: 判断当前用户是否需要在预约前签署课程学习服务协议

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程ID |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| needSign | Boolean | 是否需要签约（true=需要，false=不需要） |
| hasTemplate | Boolean | 是否存在合同模板 |
| reason | String | 不需要签约的原因说明（needSign=false 时有值） |
| template | Object\|null | 合同模板信息（needSign=true 时返回） |

**返回字段（补充）**

| 字段名 | 类型 | 说明 |
|---|---|---|
| auditPending | Boolean | true=合同已提交待审核（此时 needSign=false，不可预约） |
| pendingSignatureId | Number | 待审核签署记录ID（auditPending=true 时返回） |
| signedAt | String | 签署时间（auditPending=true 时返回） |

**业务规则**（v2.8 更新：合同审核流程）
- 查 `user_courses`（`status=1, 按 created_at DESC`）取最新有效记录
- `contract_signed=1`（已签且 status=1）→ needSign=false，reason="已签约"
- `contract_signed=0` → 查 `contract_signatures`（status=5）是否有待审核记录：
  - 有待审核记录 → needSign=false，**auditPending=true**，reason="合同已提交，等待管理员审核"
  - 无待审核记录 → 检查合同模板，有模板则 needSign=true；无模板则 needSign=false
- 无 status=1 记录 → needSign=false，reason="未购买该课程或课程已过期"

---

### 🔵 7B.2 客户端获取课程合同模板 ⚠️ 已废弃

- **action**: `getContractTemplateByCourse`
- **云函数**: `ambassador`
- **调用方**: 客户端（小程序）
- **描述**: 获取指定课程的学习服务协议模板，用于签约页展示协议全文

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程ID |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| template | Object | 合同模板对象（含 id, contract_name, content, contract_file_url 等） |

**业务规则**
- 若课程无有效模板（contract_type=4, status=1, deleted_at IS NULL），返回错误："该课程暂无可用学习服务协议模板"

---

### 🔵 7B.3 签署课程学习服务协议 ⚠️ 已废弃

- **action**: `signCourseContract`
- **云函数**: `ambassador`
- **调用方**: 客户端（小程序）
- **描述**: 用户完成电子签名后提交签约，签约成功后触发推荐人奖励延迟发放

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程ID |
| signatureFileId | String | 是 | 手写签名图片的云存储 fileID |
| agreed | Boolean | 是 | 用户是否同意协议，必须为 true |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| signature_id | Number | 签约记录ID |
| contract_signed | Number | 签约状态（1=已签约） |

**返回字段（补充）**

| 字段名 | 类型 | 说明 |
|---|---|---|
| status | Number | 5=待审核（签署后不立即生效） |
| message | String | "协议签署成功，等待管理员审核通过后生效" |

**业务规则**（v2.8 更新：引入合同审核流程）
- `agreed=false` → 返回参数错误："缺少必要参数或未同意协议"
- `signatureFileId` 缺失 → 返回参数错误："缺少手写签名文件（signatureFileId）"
- 已有 status=1（有效）合同 → 返回错误："您已签署过该课程的学习服务协议"
- 已有 status=5（待审核）合同 → 返回错误："您已提交合同，正在等待管理员审核通过"
- 签约成功后：写入 `contract_signatures`（**status=5 待审核**），**不立即更新 user_courses**
- **合同生效推迟到管理员审核通过**（`auditContractSignature` 接口处理）
- **推荐人奖励推迟发放**：审核通过时才触发奖励逻辑

---

### 🔴 7B.4 管理端按课程获取合同模板

- **action**: `adminGetCourseContractTemplate`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 管理端查询某课程的学习服务协议模板，用于后台课程列表的合同弹窗

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| courseId | Number | 是 | 课程ID |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| template | Object\|null | 合同模板对象；无模板时为 null |
| template.id | Number | 模板ID |
| template.contract_name | String | 模板名称 |
| template.contract_type | Number | 协议类型（4=课程学习服务协议） |
| template.course_id | Number | 关联课程ID |
| template.contract_file_url | String | 协议文件 CDN URL（由 contract_file_id 转换） |
| template.validity_years | Number | 合同有效年限 |
| template.status | Number | 状态（1=启用） |

---

### 🔴 7B.5 创建课程合同模板（createContractTemplate 课程模式）

- **action**: `createContractTemplate`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 在已有大使合同模板创建接口基础上，传入 `contractType='course'` + `courseId` 即可创建课程学习服务协议模板（contract_type=4）

**请求参数（课程合同模式）**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| contract_name | String | 是 | 模板名称（snake_case，兼容 title 字段） |
| contractType | String | 是 | 固定传 `'course'` |
| courseId | Number | 是 | 课程ID |
| contractFileId | String | 否 | 协议文件云存储 fileID（可先不传，后续 update） |
| validityYears | Number | 否 | 合同有效年限，默认 1 |

> ⚠️ **参数命名注意**：`contract_name` 使用 snake_case（接口同时兼容 `title` 字段），其余参数使用 camelCase。

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| template_id | Number | 新建模板ID |
| contract_name | String | 模板名称 |
| version | String | 版本号（默认 v1.0） |

---

### 🔴 7B.6 管理员录入课程线下合约

- **action**: `adminCreateCourseContract`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 管理员录入课程线下合约（上传合同照片后直接生效）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Number | 是 | 用户ID |
| courseId | Number | 是 | 课程ID |
| contractImages | Array<String> | 是 | 合同照片 cloud:// fileID 数组，至少1张 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| signature_id | Number | 签署记录ID |
| contract_start | String | 合同开始日期 |
| contract_end | String | 合同结束日期 |
| expire_at | String | 课程到期时间 |

**业务规则**
- 验证用户已购买该课程且未签合同（user_courses.status=1, contract_signed=0）
- 防重复录入检查
- 必须有已启用的合同模板（contract_templates.contract_type=4, status=1）
- 签署记录 status=1 直接生效，sign_type=3 管理员录入
- 自动计算有效期：pending_days 优先，否则用 courses.validity_days（兜底365天）
- 自动发放推荐人奖励

---

### 🔴 7B.7 获取用户已购未签合同课程列表

- **action**: `adminGetUserPaidCourses`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 获取指定用户已购买且未签合同的课程列表

**业务规则**：仅返回 `need_contract=1` 的课程；`need_contract=0` 的课程不出现在可选列表中。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| userId | Number | 是 | 用户ID |

**返回字段**（数组）

| 字段名 | 类型 | 说明 |
|---|---|---|
| course_id | Number | 课程ID |
| course_name | String | 课程名称 |
| purchased_at | String | 购买时间 |

---

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

### 🔴 7.9 审核合同签署记录（v2.8 新增，v2.12 恢复）

- **action**: `auditContractSignature`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 管理员审核用户提交的合同签署记录，通过后合同生效，驳回后用户需重新签署。路由已注册到 ambassador/index.js

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| signatureId | Number | 是 | 签署记录ID（status=5 待审核） |
| auditAction | String | 是 | 'approve'（通过）\| 'reject'（驳回）**注意：参数名为 auditAction，非 action** |
| remark | String | 驳回必填 | 审核备注或驳回原因 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| signature_id | Number | 签署记录ID |
| is_course | Boolean | 是否为课程合同 |
| is_ambassador | Boolean | 是否为大使合同 |

**业务规则**

- 仅 status=5（待审核）的记录可审核，其他状态返回错误
- **通过（approve）时**：
  - 更新 `contract_signatures.status=1`，写入 `audit_admin_id`、`audit_time`
  - **课程合同**（course_id IS NOT NULL）：更新 `user_courses.contract_signed=1, expire_at, pending_days=0`；发放推荐人奖励
  - **大使合同**（ambassador_level > 0）：升级 `users.ambassador_level`；若付费升级且已支付，发放冻结积分
- **驳回（reject）时**：
  - 更新 `contract_signatures.status=6`，写入 `audit_admin_id`、`audit_time`、`reject_reason`
  - 用户需重新签署（重新签署时 status=6 的记录不拦截，可新建 status=5 记录）
- 有效期起点：审核通过日（不是用户签署日）+ `courses.validity_days` 天

---

### 🔴 7.10 管理端合约列表

- **action**: `getContractList`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 分页查询合约签署记录列表，返回合约信息及关联用户名称

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| level | Number | 否 | 筛选大使等级 |
| status | Number | 否 | 筛选合约状态 |
| keyword | String | 否 | 关键词搜索 |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | Number | 签署记录 ID |
| user_id | Number | 用户 ID |
| ambassador_name | String | 大使姓名（从 users.real_name 获取） |
| phone | String | 用户手机号 |
| ambassador_level | Number | 大使等级 |
| contract_no | String | 合同编号（contract_name + 版本号） |
| contract_name | String | 合同名称 |
| contract_version | String | 合同版本 |
| signed_at | String | 签署时间（对应 sign_time） |
| expires_at | String | 到期时间（对应 contract_end） |
| contract_start | String | 合同开始日期 |
| sign_type | Number | 签署类型（1=用户签署 / 2=管理员续签 / 3=管理员录入） |
| status | Number | 合约状态 |
| contract_file_id | String | 电子合约文件 fileID |
| contract_url | String | 电子合约文件 CDN URL |
| contract_images | Array\<String\> | 合同照片 CDN URL 数组 |
| _rawContractImageIds | Array\<String\> | 合同照片原始 fileID 数组（供前端追加上传用） |
| created_at | String | 记录创建时间 |

**业务规则**

- 关联查询 `users` 表获取 `real_name` 和 `phone`
- `contract_images` 字段为 JSON 数组，每个元素通过 `cloudFileIDToURL` 转为 CDN URL
- `_rawContractImageIds` 保留原始 `cloud://` fileID，供前端上传追加时使用
- `contract_url` 将 `contract_file_id` 转为 CDN URL
- 支持按 `ambassador_level` 和 `status` 筛选

---

### 🔴 7.11 管理端更新合约照片

- **action**: `updateContractImages`
- **云函数**: `ambassador`
- **调用方**: 管理后台
- **描述**: 补充/更新合约签署记录的合同照片

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| signatureId | Number | 是 | 合约签署记录 ID |
| contractImages | Array\<String\> | 是 | 合同照片 fileID 数组，至少 1 张 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| updated | Boolean | 是否更新成功 |

**业务规则**

- 验证 `signatureId` 对应的合约记录存在（不存在返回"合约记录不存在"）
- `contractImages` 必须为非空数组（空数组返回"请至少上传一张合同照片"）
- 直接覆盖原有 `contract_images` 字段（JSON 数组存储）
- 不校验合约状态，任何状态的合约均可补充照片

---

## 8. 反馈模块

### 🔵 8.1 获取可反馈课程列表
**action**: `getFeedbackCourses`
**调用方**: 客户端

**响应数据**:
```json
[
  {
    "id": 1,
    "name": "初探班",
    "cover_image": "cloud://xxx",
    "type": 1
  }
]
```

**业务规则**:
- 返回当前登录用户已购买、且课程状态为上架（status=1）的课程列表
- 返回格式为数组（不再包裹 `list` 字段）

**备注**: 修复了原先返回 `{ list: [...] }` 导致前端无法识别为数组、显示"暂无已购买课程"的 Bug（2026-03-13）

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
    "role": "超级管理员",
    "role_name": "超级管理员",
    "permissions": ["*"]
  }
}
```

**返回字段说明**

| 字段名 | 类型 | 说明 |
|---|---|---|
| token | String | 登录凭证 |
| admin_info | Object | 管理员信息 |
| admin_info.id | Number | 管理员ID |
| admin_info.username | String | 用户名 |
| admin_info.real_name | String | 真实姓名 |
| admin_info.role | String | 角色标识 |
| admin_info.role_name | String | 角色显示名（从 admin_roles 表获取） |
| admin_info.permissions | Array | 权限数组（从 admin_roles 表获取，super_admin 返回 `["*"]`） |

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

### 🔴 10.4.1 推荐关系查询（伯乐与千里马）
**接口**: `POST /api/admin/user/referee-info`  
**action**: `admin:getUserRefereeInfo`

**调用方**: 管理后台（推荐人管理页）

**描述**: 按用户名字、ID 或手机号查询其伯乐（推荐人）和千里马（我推荐的人）列表

**请求参数**:
```json
{
  "action": "admin:getUserRefereeInfo",
  "keyword": "张三"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 是 | 用户名字、ID 或手机号 |

**查询规则**:
- 纯数字且 ≤11 位：优先按 id 精确匹配，其次按 phone 精确匹配
- 纯数字且 >11 位：按 id 精确匹配
- 非纯数字：按 real_name 模糊匹配（LIKE %keyword%）

**返回字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| user | Object | 当前用户信息（id、real_name、phone、avatar、referee_code、ambassador_level） |
| referee | Object \| null | 伯乐（推荐人），无则为 null |
| referrals | Array | 千里马（我推荐的人）列表 |

---

### 10.4.2 学员列表（推荐关系管理）
**action**: `admin:getUserListForReferee`

**调用方**: 管理后台（学员推荐关系页）

**描述**: 分页查询所有学员列表，返回推荐人姓名，支持关键词搜索和大使等级筛选。

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 否 | 姓名模糊匹配 / 手机号精确 / ID 精确 |
| ambassadorLevel | Number | 否 | 大使等级筛选（0普通/1准青鸾/2青鸾/3鸿鹄） |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

**返回字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 学员列表，每项含 id/real_name/phone/ambassador_level/ambassador_level_name/referee_id/referee_name |
| total | Number | 总条数 |
| page | Number | 当前页 |
| pageSize | Number | 每页条数 |
| totalPages | Number | 总页数 |

---

### 10.4.3 学员推荐关系树
**action**: `admin:getUserRefereeTree`

**调用方**: 管理后台（学员推荐关系页弹窗 + Word 导出）

**描述**: 查询指定学员的完整推荐关系树。向上仅追溯一层推荐人；向下递归**全部**下线（凡 `referee_id` 指向当前节点或其祖先均计入，**包含**仅有扫码关系、`referee_confirmed_at` 仍为空的学员）。支持单个和批量模式。每个节点附带相对伯乐的绑定状态与课程标签列表。

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Number | 单个模式必填 | 目标学员 ID |
| userIds | Array | 批量模式必填 | 目标学员 ID 数组，用于 Word 导出 |

**返回格式（单个）**:
```json
{
  "user": { "id": 1, "real_name": "李四", "ambassador_level": 1, "ambassador_level_name": "准青鸾大使", "referee_bole_status": "bound" },
  "referee": { "id": 2, "real_name": "张三", "ambassador_level": 2, "ambassador_level_name": "青鸾大使" },
  "tree": {
    "id": 1, "real_name": "李四", "ambassador_level": 1, "ambassador_level_name": "准青鸾大使",
    "referee_bole_status": "bound",
    "courses": ["天道初探班"],
    "children": [
      {
        "id": 3, "real_name": "王五", "ambassador_level": 0, "ambassador_level_name": "普通用户",
        "referee_bole_status": "unbound",
        "courses": ["天道初探班", "天道密训班"],
        "children": []
      }
    ]
  }
}
```

**`referee_bole_status` 取值**（相对直接推荐人 `referee_id`，与 `users.referee_confirmed_at` 一致）:

| 值 | 含义 |
|----|------|
| `none` | 无推荐人（`referee_id` 为空） |
| `bound` | 已正式绑定（`referee_confirmed_at` 非空） |
| `unbound` | 有推荐人但未正式绑定（`referee_id` 有值且 `referee_confirmed_at` 为空） |

**返回格式（批量）**: 数组，每项格式同单个。

**业务规则**:
- 向下推荐树包含所有 `referee_id` 指向树内上级的用户，**不**再按 `referee_confirmed_at` 过滤；未正式绑定者通过 `referee_bole_status=unbound` 区分
- 递归至末端，不限层级深度
- `courses` 字段（课程标签）统一以 `contract_signed = 1` 为判断依据：
  - 初探班（need_contract=0）：首次签到时系统自动触发将 `contract_signed` 置 1
  - 密训班（need_contract=1）：管理员录入合同审核通过后将 `contract_signed` 置 1
  - 已退款（status=2）或无效（status=0）的记录不计入
- 管理后台弹窗：课程标签以绿色 outline 标签显示；**下级节点**将 `referee_bole_status` 以 outline 标签显示（已绑定/未绑定/无伯乐）；**根节点（当前查看的本人）不展示**上述状态标签，仅姓名与大使等级。Word 导出：根行仅姓名+等级；子树节点仍带【已绑定】/【未绑定】/【无伯乐】及【课程名】

**备注（2026-04-02）**: 向下树从「仅正式绑定下线」改为「全部下线 + 状态字段」；新增 `user` 与树节点上的 `referee_bole_status`。

**备注（2026-04-03）**: 后台弹窗与 Word 导出中，**本人（树根）不展示**伯乐绑定状态标签/【已绑定】等文案，仅下级节点展示。

---

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
    "frozen_points": 2000.00
  }
}
```

**字段说明**:
| 字段 | 说明 | 影响范围 |
|------|------|---------|
| merit_rate_basic | 推荐初探班功德分比例 | 奖励计算（与 cash_rate_basic 互斥） |
| merit_rate_advanced | 推荐密训班功德分比例 | 奖励计算（与 cash_rate_advanced 互斥） |
| cash_rate_basic | 推荐初探班可提现积分比例 | 奖励计算（与 merit_rate_basic 互斥） |
| cash_rate_advanced | 推荐密训班可提现积分比例 | 奖励计算（与 merit_rate_advanced 互斥） |
| frozen_points | 升级发放的冻结积分（必须是 unfreeze_per_referral 的整数倍） | 大使升级 |
| unfreeze_per_referral | 每次推荐初探班解冻的固定积分金额 | 推荐奖励（仅初探班触发解冻） |
| upgrade_payment_amount | 支付升级所需金额 | 创建订单 |
| ~~gift_quota_basic~~ | ~~升级赠送初探班名额~~（2026-03-09 已隐藏，当前全部为 0） | — |
| ~~gift_quota_advanced~~ | ~~升级赠送密训班名额~~（2026-03-09 已隐藏，当前全部为 0） | — |
| can_earn_reward | 是否可获得推荐奖励 | 推荐奖励前置判断 |

**业务校验规则**（保存时前后端双重校验）:
1. `merit_rate_basic` 和 `cash_rate_basic` 不能同时 > 0（功德分和积分互斥）
2. `merit_rate_advanced` 和 `cash_rate_advanced` 不能同时 > 0
3. `unfreeze_per_referral > 0` 时，`frozen_points` 必须是其整数倍

**奖励发放优先级**:
```
1. can_earn_reward=0 → 无奖励
2. 初探班 + frozen>0 → 解冻 unfreeze_per_referral 到 available → 结束
3. merit_rate>0 → 发功德分 → 结束
4. cash_rate>0 → 发积分到 available → 结束
```

### 🔴 10.9 后台用户管理 - CRUD
**接口**:
- `POST /api/admin/admin-user/create`
- `PUT /api/admin/admin-user/update`
- `DELETE /api/admin/admin-user/delete`
- `GET /api/admin/admin-user/list`

### 🔴 10.10 角色管理 - 获取角色列表

- **action**: `getRoleList`
- **云函数**: system
- **调用方**: 管理后台
- **描述**: 获取所有角色列表（含权限信息）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| status | Number | 否 | 状态筛选，不传则默认返回启用角色 |

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| list | Array | 角色列表 |
| list[].id | Number | 角色ID |
| list[].role_key | String | 角色标识 |
| list[].role_name | String | 角色显示名 |
| list[].permissions | Array | 权限页面 key 数组 |
| list[].is_system | Number | 是否系统内置 |
| list[].status | Number | 状态 |

### 🔴 10.11 角色管理 - 创建角色

- **action**: `createRole`
- **云函数**: system
- **调用方**: 管理后台
- **描述**: 创建自定义角色（仅超级管理员）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| roleKey | String | 是 | 角色标识（字母数字下划线） |
| roleName | String | 是 | 角色显示名 |
| permissions | Array | 否 | 权限页面 key 数组 |
| description | String | 否 | 角色描述 |

### 🔴 10.12 角色管理 - 更新角色

- **action**: `updateRole`
- **云函数**: system
- **调用方**: 管理后台
- **描述**: 更新角色信息和权限（仅超级管理员，super_admin 权限不可修改）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Number | 是 | 角色ID |
| roleName | String | 否 | 角色显示名 |
| permissions | Array | 否 | 权限页面 key 数组 |
| description | String | 否 | 角色描述 |
| status | Number | 否 | 状态 |

### 🔴 10.13 角色管理 - 删除角色

- **action**: `deleteRole`
- **云函数**: system
- **调用方**: 管理后台
- **描述**: 删除自定义角色（仅超级管理员，系统内置角色不可删除，有关联管理员时拒绝删除）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Number | 是 | 角色ID |

### 🔴 10.14 统计分析
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
扫码绑定推荐人（仅通过二维码，用户无感知）
  ↓
创建订单 → 推荐人从用户表自动读取（不接受前端传参）
  ↓
支付成功 → 推荐人永久锁定（不可修改，后台管理员除外）
  ↓
首次购买 → 锁定用户推荐人（永久）
```

### B. 统一奖励发放流程（所有等级通用）
```
⚠️ 所有数值均从 ambassador_level_configs 表动态读取，不得硬编码
⚠️ 功德分率和积分率互斥（同课程类型只能配一个，后台强制二选一）

支付成功回调 → 查询推荐人等级配置
  ↓
can_earn_reward=0 → 无奖励，结束
  ↓
初探班 + frozen>0 → 解冻 config.unfreeze_per_referral（frozen→available）→ 结束
  ↓
merit_rate>0 → 发 merit_rate 比例的功德分 → 结束
  ↓
cash_rate>0 → 发 cash_rate 比例的积分到 available → 结束
```

### B1. 青鸾大使奖励举例
```
配置：frozen_points=1688, unfreeze_per_referral=1688
      merit_rate_basic=0.30, cash_rate_basic=0（功德分模式）
      merit_rate_advanced=0.20, cash_rate_advanced=0

第1次推荐初探班 → frozen>0 → 解冻1688（frozen=0, available+1688）
第2次推荐初探班 → frozen=0 → merit_rate=0.30 → 功德分=1688×30%=506.4
推荐密训班      → merit_rate=0.20 → 功德分=38888×20%=7777.6
```

### C1. 鸿鹄大使奖励举例
```
配置：frozen_points=16880, unfreeze_per_referral=1688
      merit_rate_basic=0, cash_rate_basic=0.30（积分模式）
      merit_rate_advanced=0, cash_rate_advanced=0.20

第1~10次推荐初探班 → frozen>0 → 每次解冻1688（frozen递减至0）
第11次推荐初探班    → frozen=0 → cash_rate=0.30 → 积分=1688×30%到available
推荐密训班          → cash_rate=0.20 → 积分=38888×20%到available（不消耗frozen）
```

---

### 时区处理规范（2026-03-03 修复）

所有云函数中数据库日期字符串的处理必须遵循以下规范：

- **存储格式**: 数据库中的时间字段（expire_at、buy_time、created_at 等）统一存储为北京时间(UTC+8) `YYYY-MM-DD HH:mm:ss`
- **读取时**: 从数据库读取日期字符串后，必须使用 `parseBeijingDateStr(str)` 解析，不得直接 `new Date(str)`
- **写入时**: 使用 `formatDateTime(dateObj)` 将 UTC Date 对象转为北京时间字符串
- **比较时**: 将 DB 日期字符串用 `parseBeijingDateStr()` 转为 Date 对象后，再与 `new Date()` 比较

---

## 课程过期处理接口（v2.4 新增）

### 定时任务：标记过期课程和合同

- **action**: `checkExpiredCourses`
- **云函数**: `system`
- **调用方**: 管理后台（每日定时任务调用，也可手动触发）
- **描述**: 将已到期的课程和合同状态更新为"已过期"

**请求参数**

无

**返回字段**

| 字段名 | 类型 | 说明 |
|---|---|---|
| expired_courses | Number | 本次标记的过期课程数量 |
| expired_contracts | Number | 本次标记的过期合同数量 |

**业务规则**
- 将 `user_courses.status=1 + contract_signed=1 + expire_at < NOW()` 的记录 → `status=3`（已过期）
- 将 `contract_signatures.status=1 + contract_end < CURDATE()` 的记录 → `status=2`（已过期）
- 建议每日凌晨 0 点执行

---

## 课程过期逻辑说明（v2.4）

### 核心规则

| 规则 | 说明 |
|---|---|
| 有效期起点 | 从签订合同当日开始，不从购买日算 |
| 唯一有效期来源 | `courses.validity_days`（必填正整数），废弃 `contract_templates.validity_years` |
| 双向同步 | `user_courses.expire_at` = `contract_signatures.contract_end` 当天 23:59:59，任何延长操作必须同时更新两张表 |
| 过期判断 | 统一用 `user_courses.status=3`（由定时任务写入），不用 `expire_at < NOW()` 实时判断 |
| pending_days | 购买/兑换/赠送时积累待签天数，签合同时消耗并写入 expire_at；未签合同时前端显示"待签合同"标签 |

### user_courses.status 枚举

| 值 | 含义 |
|---|---|
| 0 | 无效 |
| 1 | 有效（未过期） |
| 2 | 已退款 |
| 3 | 已过期（定时任务标记） |

---

## 历史学员数据自动导入（v2.13 新增）

### 内部模块：processLegacyImport

- **模块路径**: `cloudfunctions/user/business-logic/legacyImport.js`
- **调用方式**: 在 `client:updateProfile` 保存成功后自动调用，对前端透明
- **描述**: 用户填写真实姓名后，自动匹配 legacy_students 表并导入历史数据

**触发条件**

- `updateProfile` 接口中 `realName` 字段非空
- 当前用户在 legacy_students 中尚无 `linked_user_id` 记录（防重）

**匹配规则**

| 步骤 | 规则 |
|-----|------|
| 1 | 清理姓名空格，与 `student_name` 精确匹配 |
| 2 | 若未匹配，在 `student_aliases` JSON 数组中查找别名 |
| 3 | 排除 `is_duplicate=2` 和 `import_status=1` 的记录 |

**导入行为**

| 行为 | 详情 |
|-----|------|
| 导入初探班 | 有 chutan_date 时创建 user_courses（type=1，source=3，attend_count=1） |
| 导入密训班 | 有 mixin_date 时创建 user_courses（type=2，source=3，attend_count=1） |
| 绑定推荐人 | 通过 recommender_alias 查找推荐人账号，仅在 referee_confirmed_at IS NULL 时绑定（会覆盖未确认的旧推荐关系） |
| 大使升级 | is_ambassador=1 时：更新 ambassador_level，生成 referee_code（若无），插入 ambassador_upgrade_logs，创建 contract_signatures（sign_type=3，365天） |
| 追溯绑定 | 大使注册后反向查找已注册且未绑定推荐人的学员，自动绑定推荐关系 |

**不影响主流程**：导入失败会记录日志但不影响 updateProfile 的成功响应。

---

**文档结束**

如有疑问或需要补充接口，请及时反馈。