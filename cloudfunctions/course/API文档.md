# Course 云函数 API 文档

**版本**: V1.0
**接口数**: 34
**创建时间**: 2026-02-10

---

## 📋 接口清单

| 分类 | Action | 功能说明 | 权限 |
|------|--------|---------|------|
| **课程浏览** | getList | 获取课程列表 | 公开 |
| | getDetail | 获取课程详情 | 公开 |
| **案例浏览** | getCaseList | 获取案例列表 | 公开 |
| | getCaseDetail | 获取案例详情 | 公开 |
| **资料浏览** | getMaterialList | 获取资料列表 | 公开 |
| **商学院** | getAcademyList | 获取商学院介绍列表 | 公开 |
| | getAcademyDetail | 获取商学院介绍详情 | 公开 |
| **上课排期** | getClassRecords | 获取上课排期列表 | 客户端 |
| **预约管理** | createAppointment | 创建预约 | 客户端 |
| | cancelAppointment | 取消预约 | 客户端 |
| | getMyAppointments | 获取我的预约列表 | 客户端 |
| | checkin | 签到 | 客户端 |
| **学习进度** | recordAcademyProgress | 记录商学院学习进度 | 客户端 |
| | getAcademyProgress | 获取商学院学习进度 | 客户端 |
| **课程管理** | createCourse | 创建课程 | 管理端 |
| | updateCourse | 更新课程 | 管理端 |
| | deleteCourse | 删除课程 | 管理端 |
| | getCourseList | 获取课程列表（管理端） | 管理端 |
| **排期管理** | createClassRecord | 创建上课排期 | 管理端 |
| | updateClassRecord | 更新上课排期 | 管理端 |
| | deleteClassRecord | 删除上课排期 | 管理端 |
| | getClassRecordList | 获取上课排期列表（管理端） | 管理端 |
| **预约管理** | getAppointmentList | 获取预约列表（管理端） | 管理端 |
| | updateAppointmentStatus | 更新预约状态 | 管理端 |
| | batchCheckin | 批量签到 | 管理端 |
| **案例管理** | createCase | 创建案例 | 管理端 |
| | updateCase | 更新案例 | 管理端 |
| | deleteCase | 删除案例 | 管理端 |
| | getCaseList | 获取案例列表（管理端） | 管理端 |
| **资料管理** | createMaterial | 创建资料 | 管理端 |
| | updateMaterial | 更新资料 | 管理端 |
| | deleteMaterial | 删除资料 | 管理端 |
| | getMaterialList | 获取资料列表（管理端） | 管理端 |
| **商学院管理** | manageAcademyContent | 管理商学院内容 | 管理端 |

---

## 🟢 公开接口（7个）

### 1. getList - 获取课程列表

**功能**：获取所有上架的课程列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | Number | 否 | 课程类型筛选（1-初探班，2-深研班，3-复训） |
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
        "name": "初探班",
        "type": 1,
        "cover_image": "封面图片URL",
        "price": 1688.00,
        "original_price": 1980.00,
        "description": "课程简介",
        "status": 1
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 2. getDetail - 获取课程详情

**功能**：获取课程的详细信息

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 课程ID |

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "初探班",
    "type": 1,
    "cover_image": "封面图片URL",
    "price": 1688.00,
    "original_price": 1980.00,
    "description": "课程简介",
    "content": "课程详细内容",
    "duration": "3天2夜",
    "location": "北京",
    "teacher": "孙膑道",
    "syllabus": ["课程大纲1", "课程大纲2"],
    "status": 1
  }
}
```

---

### 3. getCaseList - 获取案例列表

**功能**：获取成功案例列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 案例分类 |
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
        "title": "案例标题",
        "category": "企业管理",
        "cover_image": "封面图片",
        "summary": "案例摘要",
        "created_at": "2026-02-10T08:00:00.000Z"
      }
    ],
    "total": 20,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 4. getCaseDetail - 获取案例详情

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 案例ID |

---

### 5. getMaterialList - 获取资料列表

**功能**：获取学习资料列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 资料类型（video-视频，document-文档，audio-音频） |
| page | Number | 否 | 页码 |
| page_size | Number | 否 | 每页数量 |

---

### 6. getAcademyList - 获取商学院介绍列表

**功能**：获取商学院课程介绍列表

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "title": "商学院介绍",
      "type": "intro",
      "cover_image": "封面图片",
      "sort_order": 1
    }
  ]
}
```

---

### 7. getAcademyDetail - 获取商学院介绍详情

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 介绍ID |

---

## 🔵 客户端接口（7个）

### 1. getClassRecords - 获取上课排期列表

**功能**：获取课程的上课排期

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| course_id | Number | **是** | 课程ID（必填参数） |
| start_date | String | 否 | 开始日期过滤（格式：YYYY-MM-DD） |
| end_date | String | 否 | 结束日期过滤（格式：YYYY-MM-DD） |
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认10） |

**返回数据**：
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "total": 20,
    "page": 1,
    "page_size": 10,
    "list": [
      {
        "id": 1,
        "course_id": 1,
        "course_name": "初探班",
        "class_date": "2026-03-01",
        "class_end_date": "2026-03-02",
        "class_time": "09:00-18:00",
        "start_time": "09:00",
        "end_time": "18:00",
        "location": "北京",
        "teacher": "老师姓名",
        "max_students": 30,
        "current_students": 15,
        "available_quota": 15,
        "is_appointed": 1
      }
    ]
  }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "缺少必填参数: course_id",
  "success": false
}
```

**说明**：
- `course_id` 为必填参数，缺少该参数将返回400错误
- `is_appointed` 表示当前用户是否已预约该排期（1=已预约，0=未预约）
- 仅返回状态为启用（status=1）的排期
- `class_end_date`：结课日期，与库一致可为 `null`（单日课）；`start_time` / `end_time` 由 `class_time` 按首个 `-` 切分得到（如 `09:00-18:00`）

---

### 2. createAppointment - 创建预约

**功能**：预约上课排期

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_record_id | Number | 是 | 上课排期ID |

**业务逻辑**：
1. 验证用户已购买该课程
2. 验证上课记录存在且有名额
3. 检查是否已预约
4. 扣减名额
5. 创建预约记录

**返回数据**：
```json
{
  "code": 0,
  "message": "预约成功",
  "data": {
    "id": 1,
    "class_record_id": 1,
    "status": 1,
    "created_at": "2026-02-10T08:00:00.000Z"
  }
}
```

---

### 3. cancelAppointment - 取消预约

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 预约ID |

**业务逻辑**：
1. 验证预约存在且属于当前用户
2. 验证预约状态（只能取消待确认的预约）
3. 更新预约状态
4. 恢复名额

---

### 4. getMyAppointments - 获取我的预约列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | Number | 否 | 状态筛选（1-待确认，2-已签到，3-已取消） |
| page | Number | 否 | 页码 |
| page_size | Number | 否 | 每页数量 |

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "class_record_id": 1,
        "course_name": "初探班",
        "start_time": "2026-03-01T09:00:00.000Z",
        "location": "北京",
        "status": 1,
        "status_text": "待确认",
        "checkin_time": null
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 5. checkin - 签到

**功能**：用户签到上课

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appointment_id | Number | 是 | 预约ID |
| checkin_code | String | 否 | 签到码（管理员提供） |

**业务逻辑**：
1. 验证预约存在
2. 验证签到码（如果提供）
3. 更新预约状态为已签到
4. 记录签到时间

---

### 6. recordAcademyProgress - 记录商学院学习进度

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_id | Number | 是 | 内容ID |
| progress | Number | 是 | 学习进度（0-100） |
| duration | Number | 否 | 学习时长（秒） |

---

### 7. getAcademyProgress - 获取商学院学习进度

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "content_id": 1,
      "content_title": "商学院课程1",
      "progress": 80,
      "duration": 3600,
      "last_study_at": "2026-02-10T08:00:00.000Z"
    }
  ]
}
```

---

## 🔴 管理端接口（20个）

### 课程管理（4个）

#### 1. createCourse - 创建课程

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 课程名称 |
| type | Number | 是 | 课程类型（1-初探班，2-深研班，3-复训） |
| cover_image | String | 是 | 封面图片 |
| price | Number | 是 | 价格 |
| original_price | Number | 否 | 原价 |
| description | String | 是 | 课程简介 |
| content | String | 否 | 课程详细内容 |
| duration | String | 否 | 课程时长 |
| location | String | 否 | 上课地点 |
| teacher | String | 否 | 授课老师 |
| syllabus | Array | 否 | 课程大纲 |

---

#### 2. updateCourse - 更新课程

**请求参数**：包含 id 和需要更新的字段

---

#### 3. deleteCourse - 删除课程

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 课程ID |

**注意**：软删除，更新 status 为 0

---

#### 4. getCourseList - 获取课程列表（管理端）

**功能**：管理端查看所有课程（包括下架的）

---

### 上课排期管理（4个）

#### 5. createClassRecord - 创建上课排期

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| course_id | Number | 是 | 课程ID |
| start_time | String | 是 | 开始时间 |
| end_time | String | 是 | 结束时间 |
| location | String | 是 | 上课地点 |
| max_students | Number | 是 | 最大学员数 |
| teacher | String | 否 | 授课老师 |

---

#### 6-8. updateClassRecord, deleteClassRecord, getClassRecordList

类似的 CRUD 操作

---

### 预约管理（3个）

#### 9. getAppointmentList - 获取预约列表（管理端）

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_record_id | Number | 否 | 上课排期ID筛选 |
| status | Number | 否 | 状态筛选 |
| page | Number | 否 | 页码 |
| page_size | Number | 否 | 每页数量 |

**返回数据**：包含用户信息和课程信息的预约列表

---

#### 10. updateAppointmentStatus - 更新预约状态

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 预约ID |
| status | Number | 是 | 状态（1-待确认，2-已签到，3-已取消） |

---

#### 11. batchCheckin - 批量签到

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appointment_ids | Array | 是 | 预约ID列表 |

**返回数据**：
```json
{
  "code": 0,
  "message": "批量签到完成",
  "data": {
    "success": 10,
    "fail": 0,
    "total": 10
  }
}
```

---

### 案例管理（4个）

#### 12-15. createCase, updateCase, deleteCase, getCaseList

案例的 CRUD 操作

---

### 资料管理（4个）

#### 16-19. createMaterial, updateMaterial, deleteMaterial, getMaterialList

资料的 CRUD 操作

---

### 商学院管理（1个）

#### 20. manageAcademyContent - 管理商学院内容

**功能**：创建、更新、删除商学院介绍内容

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| operation | String | 是 | 操作类型（create/update/delete） |
| id | Number | 否 | 内容ID（更新/删除时必填） |
| title | String | 否 | 标题 |
| type | String | 否 | 类型 |
| content | String | 否 | 内容 |
| cover_image | String | 否 | 封面图片 |

---

## 🔒 权限验证

### 公开接口
- 无需登录，任何人都可以访问

### 客户端接口
- 需要用户登录（OPENID 验证）
- 通过 `checkClientAuth` 验证用户身份
- 部分接口需要验证用户已购买课程

### 管理端接口
- 需要管理员登录（JWT Token 验证）
- 通过 `checkAdminAuth` 验证管理员身份

---

## 📊 涉及的数据库表

| 表名 | 说明 |
|------|------|
| courses | 课程表 |
| class_records | 上课排期表 |
| appointments | 预约表 |
| user_courses | 用户课程关联表 |
| academy_intro | 商学院介绍表 |
| academy_cases | 商学院案例表 |
| academy_materials | 商学院资料表 |
| academy_progress | 学习进度表 |

---

## ⚠️ 注意事项

1. **课程购买验证**
   - 创建预约前需验证用户已购买该课程
   - 通过 `user_courses` 表查询

2. **名额管理**
   - 预约时扣减名额
   - 取消预约时恢复名额
   - 使用事务保证数据一致性

3. **签到码验证**
   - 管理员可生成签到码
   - 用户签到时验证签到码
   - 签到码有时效性

4. **软删除**
   - 课程、案例、资料使用 status 字段标记删除
   - 预约使用 deleted_at 字段软删除

5. **学习进度**
   - 记录用户学习商学院内容的进度
   - 支持断点续学

---

**文档版本**: V1.0
**最后更新**: 2026-02-10
**维护人员**: Course 云函数开发团队
