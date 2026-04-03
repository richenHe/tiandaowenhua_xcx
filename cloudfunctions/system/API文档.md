# System 云函数 API 文档

**版本**: V1.1
**接口数**: 29
**更新时间**: 2026-02-12

---

## 📋 接口清单

| 分类 | Action | 功能说明 | 权限 |
|------|--------|---------|------|
| **反馈管理** | getFeedbackCourses | 获取可反馈的课程列表 | 客户端 |
| | getFeedbackTypes | 获取反馈类型列表 | 客户端 |
| | submitFeedback | 提交反馈 | 客户端 |
| | getMyFeedback | 获取我的反馈列表 | 客户端 |
| | getFeedbackList | 获取反馈列表（管理端） | 管理端 |
| | replyFeedback | 回复反馈 | 管理端 |
| **通知管理** | getNotificationConfigs | 获取通知配置列表 | 客户端 |
| | subscribeNotification | 订阅/取消订阅通知 | 客户端 |
| | createNotificationConfig | 创建通知配置 | 管理端 |
| | updateNotificationConfig | 更新通知配置 | 管理端 |
| | getNotificationConfigList | 获取通知配置列表（管理端） | 管理端 |
| | getNotificationLogs | 获取通知发送日志 | 管理端 |
| | sendNotification | 发送通知 | 管理端 |
| **系统配置** | getConfig | 获取系统配置 | 管理端 |
| | updateConfig | 更新系统配置 | 管理端 |
| | getAmbassadorLevelConfigs | 获取大使等级配置 | 管理端 |
| | updateAmbassadorLevelConfig | 更新大使等级配置 | 管理端 |
| | initAmbassadorLevelConfigs | 初始化大使等级配置 | 管理端 |
| **统计分析** | getStatistics | 获取统计数据 | 管理端 |
| **公告管理** | getAnnouncementDetail | 获取公告详情 | 客户端 |
| | createAnnouncement | 创建公告 | 管理端 |
| | updateAnnouncement | 更新公告 | 管理端 |
| | deleteAnnouncement | 删除公告 | 管理端 |
| | getAnnouncementList | 获取公告列表 | 管理端 |
| **管理员** | login | 管理员登录 | 管理端 |
| | createAdminUser | 创建管理员 | 管理端 |
| | updateAdminUser | 更新管理员 | 管理端 |
| | deleteAdminUser | 删除管理员 | 管理端 |
| | getAdminUserList | 获取管理员列表 | 管理端 |

---

## 🔵 客户端接口（7个）

### 1. getFeedbackCourses - 获取可反馈的课程列表

**功能**：获取用户已购买的课程列表，用于提交反馈

**请求参数**：无

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "课程名称",
      "cover_image": "封面图片URL",
      "type": 1
    }
  ]
}
```

---

### 2. getFeedbackTypes - 获取反馈类型列表

**功能**：返回系统支持的反馈类型

**请求参数**：无

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    { "value": 1, "label": "课程内容", "icon": "book" },
    { "value": 2, "label": "功能建议", "icon": "bulb" },
    { "value": 3, "label": "系统问题", "icon": "error-circle" },
    { "value": 4, "label": "服务态度", "icon": "service" },
    { "value": 5, "label": "其他反馈", "icon": "chat" }
  ]
}
```

---

### 3. submitFeedback - 提交反馈

**功能**：用户提交反馈意见

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| feedbackType | Number | 是 | 反馈类型（1-5）【驼峰命名】 |
| courseId | Number | 否 | 课程ID【驼峰命名】 |
| content | String | 是 | 反馈内容（5-500字） |
| images | Array | 否 | 图片列表 |
| contact | String | 否 | 联系方式 |

**返回数据**：
```json
{
  "code": 0,
  "message": "提交成功，我们会尽快处理",
  "data": {
    "id": 1,
    "created_at": "2026-02-10T08:00:00.000Z"
  }
}
```

---

### 4. getMyFeedback - 获取我的反馈列表

**功能**：查询用户提交的反馈记录

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认10） |

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "type": 1,
        "type_text": "课程内容",
        "course_id": 1,
        "course": { "name": "课程名称" },
        "content": "反馈内容",
        "images": ["图片URL"],
        "status": 1,
        "status_text": "已回复",
        "reply_content": "回复内容",
        "reply_at": "2026-02-10T09:00:00.000Z",
        "created_at": "2026-02-10T08:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 5. getNotificationConfigs - 获取通知配置列表

**功能**：获取所有可订阅的通知类型及用户订阅状态

**请求参数**：无

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "订单支付成功通知",
      "description": "订单支付成功后发送通知",
      "template_id": "xxx",
      "scene": "payment_success",
      "required": 1,
      "subscribed": true,
      "can_unsubscribe": false
    }
  ]
}
```

---

### 6. subscribeNotification - 订阅/取消订阅通知

**功能**：用户订阅或取消订阅某个通知类型

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config_id | Number | 是 | 通知配置ID |
| subscribed | Boolean | 是 | 是否订阅 |

**返回数据**：
```json
{
  "code": 0,
  "message": "订阅成功",
  "data": {
    "config_id": 1,
    "subscribed": true
  }
}
```

**注意事项**：
- 必需通知（required=1）无法取消订阅
- 订阅状态会影响系统是否发送该类型的通知

---

### 7. getAnnouncementDetail - 获取公告详情

**功能**：查询指定公告的详细信息

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 公告ID |

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "公告标题",
    "content": "公告内容（HTML）",
    "summary": "公告摘要",
    "link": "跳转链接",
    "cover_image": "封面图片URL",
    "category": "general",
    "target_type": 0,
    "is_top": 0,
    "is_popup": 0,
    "start_time": "2026-02-10T00:00:00.000Z",
    "end_time": null,
    "view_count": 100,
    "status": 1,
    "published_at": "2026-02-10T08:00:00.000Z",
    "created_at": "2026-02-10T08:00:00.000Z"
  }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "缺少必填参数: id",
  "success": false
}
```

```json
{
  "code": 500,
  "message": "公告不存在或已下架",
  "success": false
}
```

**说明**：
- 仅返回状态为已发布（status=1）的公告
- 如果公告不存在或已下架，返回错误

---

## 🔴 管理端接口（22个）

### 管理员登录

#### 1. login - 管理员登录

**功能**：管理员使用用户名密码登录，返回 JWT Token

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |

**返回数据**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "real_name": "管理员",
      "role": "super_admin",
      "permissions": ["user:read", "order:read"]
    }
  }
}
```

**业务逻辑**：
- 密码使用 MD5 加密存储
- JWT Token 有效期 24 小时
- 账号被禁用时返回 403 错误

---

### 系统配置管理

#### 2. getConfig - 获取系统配置

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | String | 否 | 配置键（不传则返回所有配置） |

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "min_withdraw_amount": {
      "value": 100,
      "description": "最低提现金额",
      "value_type": "number"
    },
    "system_name": {
      "value": "天道文化小程序",
      "description": "系统名称",
      "value_type": "string"
    }
  }
}
```

---

#### 3. updateConfig - 更新系统配置

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | String | 是 | 配置键 |
| value | Any | 是 | 配置值 |

**返回数据**：
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "key": "min_withdraw_amount",
    "value": 100
  }
}
```

---

### 大使等级配置

#### 4. getAmbassadorLevelConfigs - 获取大使等级配置

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "level": 1,
      "level_name": "初级大使",
      "upgrade_type": "payment",
      "upgrade_conditions": {
        "payment_amount": 1980,
        "course_id": null
      },
      "benefits": {
        "commission_rate": 0.10,
        "merit_points_rate": 1.0,
        "quotas": 5,
        "description": "10%课程佣金 + 5个推广名额"
      },
      "description": "入门级大使，适合初次接触推广的学员"
    }
  ]
}
```

---

#### 5. updateAmbassadorLevelConfig - 更新大使等级配置

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | Number | 是 | 等级（1-5） |
| level_name | String | 否 | 等级名称 |
| upgrade_type | String | 否 | 升级方式（payment/contract） |
| upgrade_conditions | Object | 否 | 升级条件 |
| benefits | Object | 否 | 权益说明 |
| description | String | 否 | 等级描述 |

---

#### 6. initAmbassadorLevelConfigs - 初始化大使等级配置

**功能**：创建默认的5个等级配置（仅首次使用）

**返回数据**：
```json
{
  "code": 0,
  "message": "初始化成功",
  "data": {
    "count": 5
  }
}
```

---

### 统计分析

#### 7. getStatistics - 获取统计数据

**功能**：统计仪表盘数据

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "users": {
      "total": 1000,
      "today": 10,
      "ambassadors": 50
    },
    "orders": {
      "total": 500,
      "today": 5,
      "total_amount": "98000.00"
    },
    "courses": {
      "total_appointments": 200,
      "checked_in": 180,
      "checkin_rate": "90.00"
    },
    "ambassadors": {
      "total": 50,
      "level_distribution": {
        "level_1": 30,
        "level_2": 15,
        "level_3": 3,
        "level_4": 1,
        "level_5": 1
      }
    },
    "today": {
      "users": 10,
      "orders": 5,
      "appointments": 8,
      "feedbacks": 2
    }
  }
}
```

---

### 反馈管理

#### 8. getFeedbackList - 获取反馈列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认20） |
| status | Number | 否 | 状态筛选（0-待处理，1-已回复，2-已关闭） |
| type | Number | 否 | 类型筛选（1-5） |

**返回数据**：包含用户信息和课程信息的反馈列表

---

#### 9. replyFeedback - 回复反馈

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 反馈ID |
| reply_content | String | 是 | 回复内容 |
| status | Number | 否 | 状态（1-已回复，2-已关闭，默认1） |

---

### 通知管理

#### 10-14. 通知配置 CRUD

- **createNotificationConfig**: 创建通知配置
- **updateNotificationConfig**: 更新通知配置
- **getNotificationConfigList**: 获取通知配置列表
- **getNotificationLogs**: 获取通知发送日志
- **sendNotification**: 批量发送通知

**sendNotification 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_ids | Array | 是 | 用户ID列表 |
| template_id | String | 是 | 模板ID |
| scene | String | 是 | 场景 |
| data | Object | 是 | 模板数据 |

---

### 公告管理

#### 15-18. 公告 CRUD

- **createAnnouncement**: 创建公告
- **updateAnnouncement**: 更新公告
- **deleteAnnouncement**: 删除公告（物理删除 `announcements` 记录；删除前若 `cover_image` 为 `cloud://` 则尝试删除云存储文件）
- **getAnnouncementList**: 获取公告列表

**公告类型**：
- 1: 系统通知
- 2: 活动公告
- 3: 维护公告

**目标用户**：
- all: 全部用户
- ambassador: 大使
- student: 学员

---

### 管理员管理

#### 19-22. 管理员 CRUD

- **createAdminUser**: 创建管理员
- **updateAdminUser**: 更新管理员
- **deleteAdminUser**: 删除管理员（软删除）
- **getAdminUserList**: 获取管理员列表

**管理员角色**：
- super_admin: 超级管理员
- admin: 管理员
- operator: 运营人员

**注意事项**：
- 密码长度不能少于6位
- 用户名长度应在3-20字符之间
- 不能删除或修改自己的状态
- 密码使用 MD5 加密存储

---

## 🔒 权限验证

### 客户端接口
- 需要用户登录（OPENID 验证）
- 通过 `checkClientAuth` 验证用户身份

### 管理端接口
- 需要管理员登录（JWT Token 验证）
- 通过 `checkAdminAuth` 验证管理员身份
- Token 有效期 24 小时

---

## 📊 涉及的数据库表

| 表名 | 说明 |
|------|------|
| admin_users | 管理员账号 |
| admin_operation_logs | 操作日志 |
| system_configs | 系统配置 |
| ambassador_level_configs | 大使等级配置 |
| feedbacks | 用户反馈 |
| notification_configs | 通知配置 |
| notification_subscriptions | 用户订阅记录 |
| notification_logs | 通知发送日志 |
| announcements | 系统公告 |

---

## ⚠️ 注意事项

1. **JWT Token 管理**
   - Token 有效期 24 小时
   - 需要在请求头中携带：`Authorization: Bearer <token>`
   - Token 失效后需要重新登录

2. **密码安全**
   - 密码使用 MD5 加密存储
   - 建议定期修改密码
   - 密码长度不少于6位

3. **权限控制**
   - 不同角色拥有不同权限
   - 超级管理员拥有所有权限
   - 普通管理员权限由 permissions 字段控制

4. **数据筛选**
   - 列表接口支持分页和筛选
   - 状态筛选：传空字符串或不传表示不筛选
   - 日期范围筛选：使用 ISO 8601 格式

5. **软删除**
   - 管理员和公告使用软删除（status=0）
   - 删除后数据仍保留在数据库中
   - 可通过状态筛选查看已删除数据

---

**文档版本**: V1.0
**最后更新**: 2026-02-10
**维护人员**: System 云函数开发团队
