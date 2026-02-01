# 天道文化小程序 - 后端API接口文档

## 文档说明

**版本**: V2.0
**更新时间**: 2026-02-01
**技术栈**: 腾讯云CloudBase + MySQL + Node.js云函数

**接口标注**:
- 🔵 小程序端接口
- 🔴 管理后台接口
- 🟢 通用接口

**用户体系说明**:
- 使用 CloudBase OpenID 登录，自动创建用户
- 用户唯一标识：CloudBase 的 `uid`（格式：`cloud-uid-xxx`）
- 前端无需调用登录接口，直接使用 `signInWithOpenId()`
- 后端通过云函数的 `context.user.uid` 获取当前用户
- 所有用户相关数据使用 `uid` 作为主键和外键

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
- 如果用户资料不存在，则创建新记录（使用 uid 作为主键）
- 如果用户资料已存在，则更新记录
- 首次保存资料时，如果传入 `temp_referee_id`，则设置为用户的推荐人

**响应数据**:
```json
{
  "uid": "cloud-uid-xxx",
  "profile_completed": true,
  "is_first_save": true,
  "referee_id": 123
}
```

### 🔵 1.3 获取用户信息
**接口**: `GET /api/user/profile`

**认证**: CloudBase 登录态（自动从 CloudBase SDK 获取当前登录用户的 uid）

**响应数据**:
```json
{
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
- 使用 CloudBase uid 作为大使唯一标识

### 🔵 1.6 验证推荐人资格
**接口**: `GET /api/user/validate-referee`

**认证**: CloudBase 登录态

**请求参数**:
```
?referee_uid=cloud-uid-100&course_type=2
```

**响应数据**:
```json
{
  "valid": false,
  "error_message": "该推荐人暂时只能推荐初探班课程",
  "referee_info": {
    "uid": "cloud-uid-100",
    "real_name": "大使姓名",
    "level": 1,
    "level_name": "准青鸾大使"
  }
}
```

---

## 2. 课程模块

### 🔵 2.1 课程列表
**接口**: `GET /api/course/list`

**请求参数**:
```
?type=1&keyword=初探&page=1&page_size=10
```

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

### 🔵 2.2 课程详情
**接口**: `GET /api/course/detail`

**请求参数**:
```
?id=1
```

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
  "included_courses": [2],  // 包含的课程ID
  "stock": 100,
  "status": 1
}
```

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
      "status": 1
    }
  ]
}
```

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

### 🔵 3.1 创建订单
**接口**: `POST /api/order/create`

**认证**: CloudBase 登录态

**请求参数**:
```json
{
  "course_id": 1,
  "referee_uid": "cloud-uid-100"  // 可选，不传则使用用户资料中的推荐人
}
```

**业务规则**:
- 验证推荐人资格（准青鸾只能推荐初探班）
- 密训班自动包含初探班
- 记录推荐人变更日志
- 使用 CloudBase uid 作为用户和推荐人标识

**响应数据**:
```json
{
  "order_no": "ORD202401150001",
  "course_id": 1,
  "course_name": "初探班",
  "amount": 1688.00,
  "referee_uid": "cloud-uid-100",
  "referee_name": "推荐人姓名",
  "referee_level": 2,
  "status": 0
}
```

### 🔵 3.2 修改订单推荐人
**接口**: `PUT /api/order/update-referee`

**认证**: CloudBase 登录态

**请求参数**:
```json
{
  "order_no": "ORD202401150001",
  "referee_uid": "cloud-uid-200"
}
```

**业务规则**:
- 仅待支付订单可修改
- 验证推荐人资格
- 记录变更日志
- 使用 CloudBase uid 作为推荐人标识

### 🔵 3.3 发起支付
**接口**: `POST /api/order/pay`

**请求参数**:
```json
{
  "order_no": "ORD202401150001"
}
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

**业务逻辑**:
1. 验证微信签名
2. 更新订单状态为已支付
3. 记录推荐人确认时间
4. 首次购买：锁定用户推荐人
5. 添加课程到用户课程表（密训班添加2条记录）
6. 计算推荐人奖励（密训班按38888元计算）
7. 发放功德分或积分
8. 处理积分解冻（如推荐初探班）
9. 发送购买成功通知

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
- 执行微信退款
- 回退功德分/积分
- 更新订单状态
- 通知用户

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

**请求参数**:
```json
{
  "class_record_id": 1,
  "user_course_id": 10,
  "is_retrain": false
}
```

**业务逻辑**:
- 检查是否已购课程
- 检查预约截止时间
- 复训需检查复训截止时间（开课前3天）
- 复训需支付复训费
- 名额限制检查
- 开启消息提醒授权

**响应数据**:
```json
{
  "appointment_id": 100,
  "class_record_id": 1,
  "class_date": "2024-02-01",
  "class_location": "深圳市南山区",
  "is_retrain": false,
  "need_subscribe_message": true
}
```

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
- 检查是否首次上课
- 标记复训状态
- 上课次数+1
- 更新学员课程数据

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
    "condition": "支付9800元获10个初探班名额"
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

### 🔵 6.3 查看申请状态
**接口**: `GET /api/ambassador/apply-status`

**响应数据**:
```json
{
  "status": 2,
  "status_name": "待面试",
  "interview_time": "2024-01-20 14:00:00",
  "interview_remark": "请准时参加面试",
  "reject_reason": null
}
```

### 🔵 6.4 生成推荐二维码
**接口**: `GET /api/ambassador/qrcode`

**前置条件**: 准青鸾及以上等级

**响应数据**:
```json
{
  "qrcode_url": "小程序码URL",
  "share_url": "分享链接",
  "referee_code": "ABC123",
  "level": 1,
  "level_name": "准青鸾大使",
  "tip": "您当前为准青鸾大使，暂时只能推荐初探班学员"
}
```

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

### 🔴 6.12 大使申请管理 - 列表
**接口**: `GET /api/admin/ambassador/applications`

**请求参数**:
```
?status=0&keyword=张三&page=1&page_size=20
```

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
  "activity_type": 1,
  "activity_name": "辅导员活动",
  "activity_date": "2024-01-20",
  "activity_location": "深圳",
  "merit_points": 500.00,
  "remark": ""
}
```

### 🔴 6.17 积分提现审核
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

### 🔴 10.8 后台用户管理 - CRUD
**接口**:
- `POST /api/admin/admin-user/create`
- `PUT /api/admin/admin-user/update`
- `DELETE /api/admin/admin-user/delete`
- `GET /api/admin/admin-user/list`

### 🔴 10.9 统计分析
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

## 遗漏功能识别

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

### 2. ⚠️ 商城模块
**需求文档位置**: 功德分兑换商城
**状态**: 前端仅有占位页面
**建议**: 需完善商城商品管理和兑换功能

**需要接口**:
- `GET /api/mall/goods/list` - 商品列表
- `POST /api/mall/exchange` - 功德分兑换
- `GET /api/mall/exchange-records` - 兑换记录

### 3. ⚠️ 密训班赠送初探班名额管理
**需求文档位置**: 密训班包含初探班
**状态**: 业务逻辑需明确
**建议**:
- 购买密训班时自动添加2条user_courses记录
- 奖励计算只按密训班38888元计算

### 4. ⚠️ 鸿鹄大使升级流程
**需求文档位置**: 3.1.7.1 节
**状态**: 需完善支付和协议签署
**建议**: 需新增页面 `/pages/ambassador/upgrade-honghu/index.vue`

**需要接口**:
- `POST /api/ambassador/upgrade-honghu` - 申请升级鸿鹄
- `POST /api/ambassador/upgrade-pay` - 支付9800元

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
- 签署后自动升级并发放1688冻结积分

---

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
成为青鸾 → 获得1688冻结积分
  ↓
第1次推荐初探班 → 解冻1688积分（可提现）
  ↓
第2次推荐初探班 → 获得30%功德分（506.4）
  ↓
推荐密训班 → 获得20%功德分（7777.6）
```

### C. 鸿鹄大使奖励流程
```
升级鸿鹄 → 支付9800元 → 获得16880冻结积分+10个初探班名额
  ↓
推荐初探班 → 解冻1688积分（重复10次）
  ↓
冻结积分用完 → 推荐初探班 → 获得30%可提现积分
  ↓
推荐密训班 → 直接获得20%可提现积分（不消耗冻结积分）
```

---

**文档结束**

如有疑问或需要补充接口，请及时反馈。