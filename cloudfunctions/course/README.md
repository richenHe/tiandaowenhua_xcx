# Course 云函数

课程模块云函数，负责课程管理、预约、签到、商学院内容等功能。

## 📋 功能概述

### 公开接口（7个）
- `getList` - 获取课程列表
- `getDetail` - 获取课程详情
- `getCaseList` - 获取案例列表
- `getCaseDetail` - 获取案例详情
- `getMaterialList` - 获取资料列表
- `getAcademyList` - 获取商学院介绍列表
- `getAcademyDetail` - 获取商学院介绍详情

### 客户端接口（7个）
- `getClassRecords` - 获取上课排期列表
- `createAppointment` - 创建预约
- `cancelAppointment` - 取消预约
- `getMyAppointments` - 获取我的预约列表
- `checkin` - 签到
- `recordAcademyProgress` - 记录商学院学习进度
- `getAcademyProgress` - 获取商学院学习进度

### 管理端接口（20个）

**课程管理（4个）**
- `createCourse` - 创建课程
- `updateCourse` - 更新课程
- `deleteCourse` - 删除课程
- `getCourseList` - 获取课程列表

**上课排期管理（4个）**
- `createClassRecord` - 创建上课排期
- `updateClassRecord` - 更新上课排期
- `deleteClassRecord` - 删除上课排期
- `getClassRecordList` - 获取上课排期列表

**预约管理（3个）**
- `getAppointmentList` - 获取预约列表
- `updateAppointmentStatus` - 更新预约状态
- `batchCheckin` - 批量签到

**案例管理（4个）**
- `createCase` - 创建案例
- `updateCase` - 更新案例
- `deleteCase` - 删除案例
- `getCaseList` - 获取案例列表

**资料管理（4个）**
- `createMaterial` - 创建资料
- `updateMaterial` - 更新资料
- `deleteMaterial` - 删除资料
- `getMaterialList` - 获取资料列表

**商学院内容管理（1个）**
- `manageAcademyContent` - 管理商学院介绍（创建/更新/删除）

## 📁 目录结构

```
course/
├── index.js                    # 入口文件
├── package.json                # 依赖配置
├── cloudfunction.json          # 云函数配置
├── README.md                   # 本文档
├── common/                     # 公共模块（从 order 复制）
│   ├── db.js                   # 数据库操作
│   ├── auth.js                 # 权限验证
│   ├── response.js             # 响应格式
│   ├── utils.js                # 工具函数
│   └── index.js                # 导出
├── business-logic/             # 业务逻辑层（从 order 复制）
│   ├── config.js
│   ├── order.js
│   ├── payment.js
│   ├── points.js
│   ├── ambassador.js
│   ├── notification.js
│   └── qrcode.js
└── handlers/
    ├── public/                 # 公开接口（7个）
    │   ├── getList.js
    │   ├── getDetail.js
    │   ├── getCaseList.js
    │   ├── getCaseDetail.js
    │   ├── getMaterialList.js
    │   ├── getAcademyList.js
    │   └── getAcademyDetail.js
    ├── client/                 # 客户端接口（7个）
    │   ├── getClassRecords.js
    │   ├── createAppointment.js
    │   ├── cancelAppointment.js
    │   ├── getMyAppointments.js
    │   ├── checkin.js
    │   ├── recordAcademyProgress.js
    │   └── getAcademyProgress.js
    └── admin/                  # 管理端接口（20个）
        ├── createCourse.js
        ├── updateCourse.js
        ├── deleteCourse.js
        ├── getCourseList.js
        ├── createClassRecord.js
        ├── updateClassRecord.js
        ├── deleteClassRecord.js
        ├── getClassRecordList.js
        ├── getAppointmentList.js
        ├── updateAppointmentStatus.js
        ├── batchCheckin.js
        ├── createCase.js
        ├── updateCase.js
        ├── deleteCase.js
        ├── getCaseList.js
        ├── createMaterial.js
        ├── updateMaterial.js
        ├── deleteMaterial.js
        ├── getMaterialList.js
        └── manageAcademyContent.js
```

## 🗄️ 数据库表

### 主要操作表
- `courses` - 课程表
- `class_records` - 上课排期表
- `appointments` - 预约表
- `user_courses` - 用户课程表
- `academy_intro` - 商学院介绍表
- `academy_cases` - 商学院案例表
- `academy_materials` - 商学院资料表
- `academy_progress` - 商学院学习进度表

## 🚀 部署说明

### 1. 安装依赖
```bash
cd cloudfunctions/course
npm install
```

### 2. 部署云函数
```bash
# 在项目根目录执行
cloudbase functions:deploy course
```

### 3. 验证部署
```bash
# 查看云函数列表
cloudbase functions:list

# 查看云函数日志
cloudbase functions:log course
```

## 🧪 测试示例

### 测试公开接口 - 获取课程列表
```javascript
wx.cloud.callFunction({
  name: 'course',
  data: {
    action: 'getList',
    type: 1,  // 1-初探班 2-密训班 3-咨询服务
    page: 1,
    page_size: 10
  }
}).then(res => {
  console.log('课程列表:', res.result);
});
```

### 测试客户端接口 - 创建预约
```javascript
wx.cloud.callFunction({
  name: 'course',
  data: {
    action: 'createAppointment',
    class_record_id: 1
  }
}).then(res => {
  console.log('预约结果:', res.result);
});
```

### 测试管理端接口 - 创建课程
```javascript
wx.cloud.callFunction({
  name: 'course',
  data: {
    action: 'createCourse',
    name: '初探班',
    type: 1,
    current_price: 1688.00,
    original_price: 1688.00,
    description: '课程简介',
    status: 1
  }
}).then(res => {
  console.log('创建结果:', res.result);
});
```

## 📝 关键业务逻辑

### 预约流程
1. 验证用户是否已购买课程
2. 检查是否已预约该排期
3. 检查名额是否充足
4. 事务处理：创建预约 + 扣减名额

### 签到流程
1. 验证预约记录存在且状态正确
2. 如果提供签到码，验证签到码
3. 如果未提供签到码，生成签到码返回
4. 签到成功后更新预约状态和用户课程上课次数

### 学习进度记录
1. 查询是否已有学习记录
2. 如果存在，更新进度（取最大值）和累计时长
3. 如果不存在，创建新的学习记录

## ⚠️ 注意事项

1. **权限验证**
   - 公开接口无需登录
   - 客户端接口需要用户登录
   - 管理端接口需要管理员权限

2. **数据库连接**
   - 使用 CloudBase SDK `rdb()` 方法
   - 数据库名：`tiandao_culture`
   - 无需配置环境变量

3. **软删除**
   - 所有删除操作使用软删除（设置 deleted_at）
   - 查询时需过滤 `deleted_at IS NULL`

4. **事务处理**
   - 预约创建/取消涉及名额变更，使用事务保证一致性
   - 批量签到使用事务保证原子性

## 🔗 相关文档

- [后端API接口文档](../../后端API接口文档.md)
- [数据库详细信息](../../docs/database/数据库详细信息.md)
- [云函数标准部署规范](../云函数标准部署规范.md)
- [Common 层文档](../layers/common/README.md)
- [Business Logic 层文档](../layers/business-logic/README.md)

## 📊 接口统计

- 总计：34 个 action
- 公开接口：7 个
- 客户端接口：7 个
- 管理端接口：20 个

## 🎯 开发规范

遵循 [云函数标准部署规范](../云函数标准部署规范.md)：
- ✅ 使用本地模块（common + business-logic）
- ✅ 使用 CloudBase SDK rdb() 连接数据库
- ✅ 统一的错误处理和日志记录
- ✅ 标准的响应格式
- ✅ 完善的参数验证
