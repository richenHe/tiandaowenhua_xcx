# Ambassador 云函数 API 文档

**版本**: V1.1
**接口数**: 40
**创建时间**: 2026-02-10
**最后更新**: 2026-02-27

---

## 📋 接口清单

| 分类 | Action | 功能说明 | 权限 |
|------|--------|---------|------|
| **大使申请** | apply | 申请成为大使 | 客户端 |
| | getApplicationStatus | 获取申请状态 | 客户端 |
| **大使升级** | upgrade | 大使升级 | 客户端 |
| | getUpgradeGuide | 获取升级指南 | 客户端 |
| **推广管理** | generateQRCode | 生成推广二维码 | 客户端 |
| | getMyQuotas | 获取我的名额 | 客户端 |
| | giftQuota | 赠送名额 | 客户端 |
| **协议管理** | getContractTemplate | 获取协议模板 | 客户端 |
| | signContract | 签署协议 | 客户端 |
| | getMyContracts | 获取我的协议列表 | 客户端 |
| | getContractDetail | 获取协议详情 | 客户端 |
| **申请审核** | getApplicationList | 获取申请列表 | 管理端 |
| | auditApplication | 审核申请 | 管理端 |
| **大使管理** | getAmbassadorList | 获取大使列表 | 管理端 |
| | getAmbassadorDetail | 获取大使详情 | 管理端 |
| **活动管理** | createActivity | 创建活动记录 | 管理端 |
| | updateActivity | 更新活动记录 | 管理端 |
| | deleteActivity | 删除活动记录 | 管理端 |
| | getActivityList | 获取活动记录列表 | 管理端 |
| **协议模板** | createContractTemplate | 创建协议模板 | 管理端 |
| | updateContractTemplate | 更新协议模板 | 管理端 |
| | deleteContractTemplate | 删除协议模板 | 管理端 |
| | getContractTemplateList | 获取协议模板列表 | 管理端 |
| | getContractVersions | 获取协议版本历史 | 管理端 |
| **协议签署** | getSignatureList | 获取签署记录列表 | 管理端 |
| | getExpiringContracts | 获取即将到期的协议 | 管理端 |
| | getContractTemplateByLevel | 按等级获取协议模板 | 管理端 |
| **岗位类型** | getPositionTypeList | 获取岗位类型列表 | 管理端 |
| | createPositionType | 创建岗位类型 | 管理端 |
| | updatePositionType | 更新岗位类型 | 管理端 |
| | deletePositionType | 删除岗位类型 | 管理端 |
| **志愿活动** | getAmbassadorActivityList | 获取志愿活动列表 | 管理端 |
| | getAmbassadorActivityDetail | 获取志愿活动详情 | 管理端 |
| | createAmbassadorActivity | 创建志愿活动 | 管理端 |
| | deleteAmbassadorActivity | 删除志愿活动 | 管理端 |
| | getActivityRegistrants | 获取活动报名人员 | 管理端 |
| | distributeActivityMeritPoints | 发放活动功德分 | 管理端 |
| **志愿报名** | getAvailableActivities | 获取可报名活动列表 | 客户端 |
| | applyForActivity | 报名志愿活动岗位 | 客户端 |

---

## 🔵 客户端接口（15个）

### 1. apply - 申请成为大使 / 申请升级

**功能**：用户申请成为大使，或现有大使申请升级到更高等级（通过 `targetLevel` 参数区分）

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| real_name | String | 是 | 真实姓名 |
| phone | String | 是 | 联系电话 |
| wechat_id | String | 否 | 微信号 |
| city | String | 否 | 城市 |
| occupation | String | 否 | 职业 |
| apply_reason | String | 否 | 申请理由 |
| understanding | String | 否 | 对天道文化的理解 |
| willing_help | Boolean | 否 | 是否愿意帮助他人 |
| promotion_plan | String | 否 | 推广计划 |
| targetLevel | Number | 否 | 目标等级（1-4，不传时默认为当前等级+1）camelCase |

**业务逻辑**：
1. `targetLevel` 未传时，默认 `currentLevel + 1`（首次申请为 1）
2. 目标等级必须 > 当前等级，且在 1-4 范围内
3. 检查是否已有针对该目标等级的待审核申请
4. 创建申请记录，`status = 0`

**返回数据**：
```json
{
  "success": true,
  "data": {
    "application_id": 1,
    "target_level": 1,
    "status": 0,
    "message": "申请已提交，请等待审核"
  }
}
```

---

### 2. getApplicationStatus - 获取申请状态

**功能**：查询用户的大使申请状态

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "status": 0,
    "status_text": "待审核",
    "reason": "申请理由",
    "reject_reason": null,
    "created_at": "2026-02-10T08:00:00.000Z",
    "audited_at": null
  }
}
```

**状态说明**：
- 0: 待审核
- 1: 审核通过
- 2: 审核拒绝

---

### 3. upgrade - 大使升级

**功能**：申请升级到更高等级

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_level | Number | 是 | 目标等级（2-5） |
| upgrade_type | String | 是 | 升级方式（payment-支付，contract-协议） |
| order_id | Number | 否 | 订单ID（支付方式必填） |
| contract_id | Number | 否 | 协议ID（协议方式必填） |

**业务逻辑**：
1. 验证当前等级
2. 验证目标等级有效性
3. 检查升级条件（调用 business.checkUpgradeEligibility）
4. 支付方式：验证订单已支付
5. 协议方式：验证协议已签署
6. 执行升级（调用 business.processAmbassadorUpgrade）

**返回数据**：
```json
{
  "code": 0,
  "message": "升级成功",
  "data": {
    "new_level": 2,
    "level_name": "中级大使",
    "benefits": {
      "commission_rate": 0.15,
      "quotas": 10
    }
  }
}
```

---

### 4. getUpgradeGuide - 获取升级指南

**功能**：获取指定目标等级的升级路径、条件、申请状态和当前统计数据

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_level | Number | 是 | 目标等级（1-4） |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "current_level": { "level": 1, "name": "准青鸾大使", "benefits": ["推荐初探班获X%功德分"] },
    "target_level": {
      "level": 2,
      "name": "青鸾大使",
      "benefits": ["..."],
      "upgrade_benefits": [{ "title": "...", "desc": "..." }],
      "apply_questions": [{ "question": "..." }]
    },
    "upgrade_options": [
      {
        "type": "contract",
        "name": "签署青鸾大使协议",
        "eligible": false,
        "requirements": ["提交大使申请并通过审核", "签署《青鸾大使协议》"],
        "reason": "需先提交申请并等待审核通过"
      }
    ],
    "current_stats": { "referee_count": 3, "order_count": 1, "merit_points": 500, "cash_points": 0 },
    "requirements": { "referee_count": 0, "upgrade_payment_amount": 0, "frozen_points": 0 },
    "application_status": 0,
    "application_reject_reason": null,
    "application_id": 5
  }
}
```

**升级路径说明**：
- 0→1（准青鸾）：申请审核通过后签署协议，升级免费
- 1→2（青鸾）：申请审核通过后签署协议，升级免费（签约时自动升级）
- 2→3（鸿鹄）：申请审核 + 签署协议 + 支付升级费（由 `upgrade_payment_amount` 决定）

---

### 5. generateQRCode - 生成推广二维码

**功能**：生成带推荐码的小程序二维码

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | String | 否 | 跳转页面（默认首页） |
| width | Number | 否 | 二维码宽度（默认280） |

**业务逻辑**：
1. 获取用户推荐码
2. 调用 business.generateShareQRCode 生成二维码
3. 返回二维码图片URL

**返回数据**：
```json
{
  "code": 0,
  "message": "生成成功",
  "data": {
    "qrcode_url": "cloud://xxx.png",
    "referee_code": "ABC123",
    "share_link": "pages/index/index?scene=ref_ABC123"
  }
}
```

---

### 6. getMyQuotas - 获取我的名额

**功能**：查询大使的推广名额

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "total_quotas": 10,
    "used_quotas": 3,
    "available_quotas": 7,
    "quota_records": [
      {
        "id": 1,
        "type": "initial",
        "quantity": 10,
        "used_quantity": 3,
        "created_at": "2026-02-10T08:00:00.000Z"
      }
    ]
  }
}
```

---

### 7. giftQuota - 赠送名额

**功能**：大使赠送推广名额给其他用户

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiver_uid | String | 是 | 接收人UID |
| quantity | Number | 是 | 赠送数量 |
| note | String | 否 | 备注 |

**业务逻辑**：
1. 验证名额余量
2. 验证接收人存在
3. 创建名额使用记录
4. 扣减大使名额
5. 增加接收人名额

**返回数据**：
```json
{
  "code": 0,
  "message": "赠送成功",
  "data": {
    "remaining_quotas": 5
  }
}
```

---

### 8. getContractTemplate - 获取协议模板

**功能**：获取指定等级的最新协议模板，含电子合同文件下载 URL，及当前用户是否已签署

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | Number | 是 | 大使等级（1-4） |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "template": {
      "id": 3,
      "title": "青鸾大使协议",
      "version": "v1.2",
      "level": 2,
      "level_name": "青鸾",
      "validity_years": 1,
      "effective_date": "2026-01-10",
      "contract_file_url": "https://xxx.tcb.qcloud.la/contracts/level2/template.docx"
    },
    "signed": false,
    "signature": null
  }
}
```

**说明**：协议内容改为电子合同文件（PDF/Word），前端通过 `contract_file_url` 下载查看，不再返回文本内容。

---

### 9. signContract - 签署协议

**功能**：用户签署大使协议（支持将手写签名注入 docx 合同生成已签版文件）

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| templateId / template_id | Number | 是 | 协议模板ID（兼容两种写法） |
| signatureFileId | String | 是 | 手写签名图片的 cloud:// fileID（由签名画板上传后传入） |
| agreed | Boolean | 是 | 是否同意（必须为 `true`） |
| ip_address | String | 否 | 签署 IP |
| device_info | String | 否 | 设备信息 |

**业务逻辑**：
1. 验证模板存在、启用，且有 `contract_file_id` 电子合同文件
2. 检查用户未重复签署
3. 若模板为 `.docx` 格式：下载模板文件 + 签名图片，用 docxtemplater 注入 `{%signature}` / `{phone}` / `{date}` 占位符，生成已签版 docx 并上传云存储（失败时回退使用原模板）
4. 创建 `contract_signatures` 记录（含 `signature_image_id`、已签版 `contract_file_id`）
5. 若目标等级 `upgrade_payment_amount = 0`（免费），签约后自动升级用户等级

**返回数据**：
```json
{
  "success": true,
  "message": "协议签署成功，等级已升级",
  "data": {
    "signature_id": 8,
    "ambassador_level": 2,
    "level_upgraded": true,
    "needs_payment": false,
    "signed_at": "2026-02-27 10:00:00"
  }
}
```

---

### 10. getMyContracts - 获取我的协议列表

**功能**：查询用户签署的所有协议，含电子合同文件下载 URL

**返回数据**（直接返回数组，非 `{list:[...]}`）：
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "template_id": 3,
      "contract_no": "CT000008",
      "title": "青鸾大使协议",
      "level": 2,
      "level_name": "青鸾",
      "version": "v1.2",
      "signed_at": "2026-02-27 10:00:00",
      "effective_date": "2026-02-27",
      "expiry_date": "2027-02-27",
      "status": 1,
      "status_text": "有效",
      "contract_file_url": "https://xxx.tcb.qcloud.la/contracts/signed/30_xxx.docx"
    }
  ]
}
```

**协议状态说明**（以数据库 `contract_signatures.status` 字段为准）：
- `0`: 已作废
- `1`: 有效
- `2`: 已过期
- `3`: 已续签（被新协议替代）

---

### 11. getContractDetail - 获取协议详情

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| signature_id | Number | 是 | 协议签署记录ID（注意：不是 `id`） |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "signature": {
      "id": 8,
      "template_id": 3,
      "title": "青鸾大使协议",
      "ambassador_level": 2,
      "contract_version": "v1.2",
      "contract_file_url": "https://xxx.tcb.qcloud.la/contracts/signed/30_xxx.docx",
      "sign_time": "2026-02-27 10:00:00",
      "contract_start": "2026-02-27",
      "contract_end": "2027-02-27",
      "effective_date": "2026-02-27",
      "expiry_date": "2027-02-27",
      "status": 1,
      "status_text": "有效",
      "sign_ip": "127.0.0.1",
      "sign_device": null,
      "effective_time": "2026-01-10 00:00:00"
    }
  }
}
```

---

## 🔴 管理端接口（15个）

### 申请审核（2个）

#### 1. getApplicationList - 获取申请列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | Number | 否 | 状态筛选（0-待审核，1-已通过，2-已拒绝） |
| page | Number | 否 | 页码 |
| page_size / pageSize | Number | 否 | 每页数量（兼容两种写法） |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 30,
        "user_name": "张三",
        "phone": "13800138000",
        "current_level": 0,
        "target_level": 1,
        "city": "深圳",
        "occupation": "教育行业",
        "apply_reason": "申请理由",
        "reason": "申请理由",
        "status": 0,
        "status_text": "待审核",
        "created_at": "2026-02-10 08:00:00",
        "audit_time": null,
        "audit_admin_id": null
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

**状态说明**：0-待审核 / 1-已通过 / 2-已拒绝（⚠️ 注意：无待面试/面试通过等中间状态）

---

#### 2. auditApplication - 审核申请

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| application_id | Number | 是 | 申请记录ID（注意：不是 `id`） |
| approved | Boolean | 是 | 是否通过（`true` = 通过，`false` = 拒绝） |
| reject_reason | String | 否 | 拒绝理由（`approved=false` 时必填） |

**业务逻辑**：
1. 只能审核 `status = 0`（待审核）的申请
2. 通过（`approved=true`）：`status = 1`；⚠️ **不会自动升级等级**，需用户后续签署协议后自动升级
3. 拒绝（`approved=false`）：`status = 2`，记录拒绝理由

**返回数据**：
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "申请已通过，请引导用户签署协议后完成升级"
  }
}
```

---

### 大使管理（2个）

#### 3. getAmbassadorList - 获取大使列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | Number | 否 | 等级筛选 |
| page | Number | 否 | 页码 |
| page_size | Number | 否 | 每页数量 |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 30,
        "uid": "cloud-uid-xxx",
        "real_name": "张三",
        "phone": "13800138000",
        "avatar_url": "https://...",
        "referee_code": "ABC123",
        "ambassador_level": 2,
        "merit_points": 500,
        "cash_points_available": 200,
        "cash_points_frozen": 0,
        "referee_count": 3,
        "order_count": 2,
        "created_at": "2026-02-10 08:00:00",
        "ambassador_start_date": "2026-02-15"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

---

#### 4. getAmbassadorDetail - 获取大使详情

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | Number | 是 | 用户ID（注意：是 `user_id` 不是 `id`） |

**返回数据**（展平结构，所有字段直接在顶层）：
```json
{
  "success": true,
  "data": {
    "id": 30,
    "real_name": "张三",
    "phone": "13800138000",
    "avatar": "https://...",
    "ambassador_level": 2,
    "merit_points": 500,
    "cash_points_available": 200,
    "cash_points_frozen": 0,
    "team_count": 3,
    "direct_referrals": 3,
    "order_count": 2,
    "total_sales": 0,
    "total_earnings": 200,
    "contract": {
      "type_name": "青鸾大使协议",
      "signed_at": "2026-02-15 10:00:00",
      "expires_at": "2027-02-15",
      "status": 1
    },
    "referees": [
      { "id": 31, "real_name": "李四", "phone": "138...", "ambassador_level": 0 }
    ],
    "statistics": {
      "refereeCount": 3,
      "totalOrders": 2,
      "meritPointsCount": 5,
      "cashPointsCount": 2
    }
  }
}
```

---

### 活动管理（4个）

#### 5-8. createActivity, updateActivity, deleteActivity, getActivityList

**功能**：管理大使活动记录（线下活动、培训等）

**活动记录字段**：
- title: 活动标题
- type: 活动类型（training-培训，meeting-会议，promotion-推广）
- start_time: 开始时间
- end_time: 结束时间
- location: 活动地点
- participants: 参与人员（JSON数组）
- description: 活动描述

---

### 协议模板管理（5个）

#### 9. createContractTemplate - 创建协议模板

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 协议标题 |
| level | Number | 是 | 适用等级 |
| content | String | 是 | 协议内容 |
| version | String | 是 | 版本号 |
| effective_date | String | 是 | 生效日期 |
| expire_date | String | 否 | 失效日期 |

---

#### 10. updateContractTemplate - 更新协议模板

**注意**：更新协议会创建新版本，旧版本保留

---

#### 11. deleteContractTemplate - 删除协议模板

**注意**：软删除，已签署的协议不受影响

---

#### 12. getContractTemplateList - 获取协议模板列表

**返回数据**：所有协议模板列表

---

#### 13. getContractVersions - 获取协议版本历史

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| template_id | Number | 是 | 协议模板ID |

**返回数据**：该协议的所有版本历史

---

### 协议签署管理（3个）

#### 14. getSignatureList - 获取签署记录列表

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| template_id | Number | 否 | 按模板筛选 |
| level | Number | 否 | 等级筛选 |
| status | Number | 否 | 状态（0-已作废，1-有效，2-已过期，3-已续签） |
| page / page_size / pageSize | Number | 否 | 分页参数 |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 8,
        "user_id": 30,
        "user_name": "张三",
        "ambassador_name": "张三",
        "phone": "13800138000",
        "template_id": 3,
        "contract_name": "青鸾大使协议",
        "contract_no": "青鸾大使协议 v1.2",
        "ambassador_level": 2,
        "contract_level": 2,
        "contract_version": "v1.2",
        "sign_time": "2026-02-27 10:00:00",
        "signed_at": "2026-02-27 10:00:00",
        "contract_start": "2026-02-27",
        "contract_end": "2027-02-27",
        "expires_at": "2027-02-27",
        "status": 1,
        "status_text": "有效"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 20
  }
}
```

---

#### 15. getExpiringContracts - 获取即将到期的协议

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Number | 否 | 预警天数（默认30天内到期） |

**返回数据**：
```json
{
  "success": true,
  "data": {
    "total": 5,
    "stats": { "high": 1, "medium": 2, "low": 2 },
    "list": [
      {
        "id": 8,
        "user_name": "张三",
        "ambassador_name": "张三",
        "phone": "13800138000",
        "ambassador_level": 2,
        "contract_name": "青鸾大使协议",
        "contract_type_name": "青鸾大使协议",
        "signed_at": "2026-02-27 10:00:00",
        "contract_end": "2027-02-27",
        "expires_at": "2027-02-27",
        "days_remaining": 25,
        "days_left": 25,
        "urgency": "low"
      }
    ]
  }
}
```

**urgency 说明**：
- `high`：≤7天
- `medium`：8-15天
- `low`：16-30天

---

#### 16. renewContract - 续签合约

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| signatureId | Number | 是 | 原合约签署记录ID（camelCase） |
| contractEnd | String | 是 | 新到期日期（ISO 格式，如 `2028-02-27`） |

**业务逻辑**：
1. 原合约状态置为 `3`（已续签）
2. 创建新合约记录，继承原合约电子文件快照，`status = 1`，`sign_type = 2`（管理员续签）
3. 新合约起始日 = 原合约到期日

**返回数据**：
```json
{ "success": true, "data": { "id": 9 }, "message": "续签成功" }
```

---

## 🔒 权限验证

### 客户端接口
- 需要用户登录（OPENID 验证）
- 通过 `checkClientAuth` 验证用户身份
- 部分接口需要验证大使身份

### 管理端接口
- 需要管理员登录（JWT Token 验证）
- 通过 `checkAdminAuth` 验证管理员身份

---

## 📊 涉及的数据库表

| 表名 | 说明 |
|------|------|
| users | 用户表（包含大使等级） |
| ambassador_applications | 大使申请表 |
| ambassador_quotas | 大使名额表 |
| ambassador_upgrade_logs | 大使升级日志 |
| quota_usage_records | 名额使用记录 |
| contract_templates | 协议模板表 |
| contract_signatures | 协议签署记录表 |
| ambassador_activities | 大使活动记录表 |
| ambassador_level_configs | 大使等级配置表 |

---

## ⚠️ 注意事项

1. **大使等级**（以 `users.ambassador_level` 字段和 `ambassador_level_configs` 表为权威）
   - 0: 普通用户
   - 1: 准青鸾大使
   - 2: 青鸾大使
   - 3: 鸿鹄大使
   - 4: 金凤大使（扩展预留）

2. **协议状态**（`contract_signatures.status`）
   - 0: 已作废（硬取消）
   - 1: 有效
   - 2: 已过期
   - 3: 已续签（被新合约替代）

3. **申请状态**（`ambassador_applications.status`）
   - 0: 待审核
   - 1: 已通过（审核通过，等待用户签约）
   - 2: 已拒绝

4. **升级机制**
   - 准青鸾（0→1）：提交申请 → 审核通过 → 签署协议 → 自动升级（免费）
   - 青鸾（1→2）：提交申请 → 审核通过 → 签署协议 → 自动升级（免费）
   - 鸿鹄（2→3）：提交申请 → 审核通过 → 签署协议 + 支付费用 → 升级

5. **名额管理**
   - 升级时自动发放名额（由 `ambassador_level_configs` 配置）
   - 可通过 `giftQuota` 接口赠送名额给其他用户

6. **协议管理**
   - 协议使用电子文件（PDF/Word）而非文本，以 cloud:// fileID 存储
   - 签署时生成注入手写签名的已签版 docx 文件作为快照
   - 管理员可通过 `renewContract` 续签（sign_type=2）

---

## 🟣 志愿活动模块（新增 2026-02-27）

### 管理端：getPositionTypeList - 获取岗位类型列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| includeDisabled | Boolean | 否 | 包含已停用（默认 false） |

**返回数据**: 包含 `list` 数组，每项含 `id/name/required_level/required_level_name/merit_points_default/description/status/sort_order`

---

### 管理端：createPositionType - 创建岗位类型

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 岗位名称（不可重复） |
| requiredLevel | Number | 否 | 最低大使等级 |
| meritPointsDefault | Number | 否 | 默认功德分 |
| description | String | 否 | 描述 |
| sortOrder | Number | 否 | 排序值 |

---

### 管理端：updatePositionType - 更新岗位类型

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 岗位类型ID |
| name/requiredLevel/meritPointsDefault/description/status/sortOrder | 各类型 | 否 | 各字段均可选填 |

---

### 管理端：deletePositionType - 删除岗位类型

**请求参数**: `{ id: Number }`（硬删除）

---

### 管理端：getContractTemplateByLevel - 按等级获取协议模板

**请求参数**: `{ level: Number }`

**返回数据**: `{ template: { id, contract_name, contract_file_id, contract_file_url, ... } }`，`contract_file_url` 为可直接访问的 CDN 地址。

---

### 管理端：getAmbassadorActivityList - 获取大使志愿活动列表

**请求参数**: `{ keyword?, status?, page?, pageSize? }`

**返回数据**: 分页列表，每项含 `schedule_name/schedule_date/positions[]/total_quota/total_registered/merit_distributed`

---

### 管理端：getAmbassadorActivityDetail - 获取大使志愿活动详情

**请求参数**: `{ activityId: Number }`

**返回数据**: 完整活动信息，positions 每项含 `remaining（剩余名额）`

---

### 管理端：createAmbassadorActivity - 创建大使志愿活动

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | Number | 是 | 关联排课ID |
| positions | Array | 是 | 岗位配置 `[{name, quota, merit_points}]` |

**业务规则**: 同一排课只能创建一个活动，岗位 quota≥1、merit_points≥0

---

### 管理端：deleteAmbassadorActivity - 删除大使志愿活动

**请求参数**: `{ activityId: Number }`

**限制**: `merit_distributed=1` 时禁止删除，同步删除报名记录

---

### 管理端：getActivityRegistrants - 获取活动报名人员列表

**请求参数**: `{ activityId, positionName?, page?, pageSize? }`

**返回数据**: 分页列表，含 `user_name/position_name/merit_points/status/status_text`

---

### 管理端：distributeActivityMeritPoints - 发放活动功德分

**请求参数**: `{ activityId: Number }`

**业务逻辑**: 批量处理有效报名（status=1），更新 users.merit_points、写入 merit_points_records、写入 ambassador_activity_records，最终标记 merit_distributed=1

---

### 客户端：getAvailableActivities - 获取可报名活动列表

**请求参数**: `{ page?, pageSize? }`

**返回数据**: 仅返回 status=1 且 schedule_date > 今天的活动，每个岗位含 `can_apply（是否满足等级要求）`，含 `my_registration（当前用户报名状态）`

---

### 客户端：applyForActivity - 报名志愿活动岗位

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID |
| positionName | String | 是 | 岗位名称 |

**业务规则**:
- 活动必须 status=1，且 schedule_date > 今天（截止前一天）
- 岗位有剩余名额
- 若岗位有等级要求，用户大使等级须达到
- 同一活动每人只能报一个岗位

---

### 客户端：cancelActivityRegistration - 取消活动报名（新增 2026-02-27）

**Action**: `cancelActivityRegistration`  **权限**: 客户端（需登录）

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityId | Number | 是 | 活动ID（camelCase） |

**业务规则**：
1. 用户必须有 `status=1` 的有效报名记录
2. 活动 `status != 0`（未结束）才允许取消
3. 将报名记录 `status` 改为 `0`（已取消）
4. 回写 `ambassador_activities.positions` 中对应岗位 `registered_count - 1`（最小为0）

**返回数据**：
```json
{ "success": true, "data": { "activity_id": 10, "position_name": "会务义工" }, "message": "取消报名成功" }
```

---

### 客户端：getActivityStats - 获取活动统计（新增 2026-02-27）

**Action**: `getActivityStats`  **权限**: 客户端（需登录）

**功能**：获取用户的活动统计汇总（不含分页列表，只有统计数字）

**返回数据**：
```json
{
  "success": true,
  "data": {
    "total_count": 12,
    "total_merit_points": 600,
    "month_count": 2,
    "type_stats": { "1": 4, "2": 5, "3": 2, "4": 1 }
  }
}
```

**活动类型说明**：
- `1`: 辅导员
- `2`: 会务义工/工作人员
- `3`: 沙龙组织
- `4`: 其他活动

**注意**：`getActivityRecords` 接口在返回分页列表的同时也会附带相同的 `stats` 字段，`getActivityStats` 适合只需要统计数字而不需要列表的场景。

---

### 定时触发：autoUpdateActivityStatus - 自动更新活动状态（新增 2026-02-27）

**触发方式**: 定时触发器（`event.Time` 存在且无 `event.action`）

**功能**：云函数 `ambassador` 定时任务，自动将已过期的志愿活动 `status` 更新为已结束

**业务逻辑**：
- 查询 `schedule_date < 今天` 且 `status = 1`（进行中）的活动
- 批量更新 `status = 0`（已结束）

**与 course 模块 `autoUpdateScheduleStatus` 的区别**：
- `course.autoUpdateScheduleStatus`：更新排课记录（`class_records`）状态
- `ambassador.autoUpdateActivityStatus`：更新志愿活动（`ambassador_activities`）状态

---

## 📊 新增涉及数据库表

| 表名 | 说明 |
|------|------|
| ambassador_position_types | 岗位类型配置表 |
| ambassador_activities | 大使志愿活动表（关联 class_records） |
| ambassador_activity_registrations | 活动报名记录表 |

---

**文档版本**: V1.2
**最后更新**: 2026-02-27
**维护人员**: Ambassador 云函数开发团队
