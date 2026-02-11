# API 接口测试错误报告

## 测试时间
2026-02-11

## 测试环境
- 环境ID: cloud1-0gnn3mn17b581124
- 数据库: tiandao_culture

## 测试概览

### 测试统计
- **User 模块**: 14 个接口（需登录）
- **Course 模块**: 14 个接口
  - ✅ 通过: 3 个 (`getList`, `getDetail`, `getCalendarSchedule`)
  - ❌ 失败: 3 个 (`getCaseList`, `getAcademyList`, `getMaterialList`)
  - 🔒 需登录: 8 个
- **Order 模块**: 9 个接口
  - 🔒 需登录: 9 个
- **Ambassador 模块**: 11 个接口
  - 🔒 需登录: 11 个
- **System 模块**: 10 个接口
  - ✅ 通过: 2 个 (`getBannerList`, `getAnnouncementList`)
  - 🔒 需登录: 8 个

---

## 🚨 严重错误：使用了已废弃的 rawQuery 方法

### 错误等级
**P0 - 严重**（导致接口完全不可用）

### 错误详情

#### 1. Course 模块 - getCaseList
- **文件**: `cloudfunctions/course/handlers/public/getCaseList.js`
- **错误**: `rawQuery is not a function`
- **行号**: 第 4 行引入，第 34、55 行调用
- **影响**: 案例列表接口完全失败

```javascript
// 第 4 行 - 错误的引入
const { from, rawQuery } = require('../../common/db');

// 第 34、55 行 - 错误的调用
const countResult = await rawQuery(countSql, params);
const list = await rawQuery(listSql, params);
```

#### 2. Course 模块 - getAcademyList
- **文件**: `cloudfunctions/course/handlers/public/getAcademyList.js`
- **错误**: `rawQuery is not a function`
- **行号**: 第 4 行引入，第 23 行调用
- **影响**: 商学院介绍列表接口完全失败

```javascript
// 第 4 行 - 错误的引入
const { from, rawQuery } = require('../../common/db');

// 第 23 行 - 错误的调用
const list = await rawQuery(sql);
```

#### 3. Course 模块 - getMaterialList
- **文件**: `cloudfunctions/course/handlers/public/getMaterialList.js`
- **错误**: `rawQuery is not a function`
- **行号**: 第 4 行引入，第 34、59 行调用
- **影响**: 资料列表接口完全失败

```javascript
// 第 4 行 - 错误的引入
const { from, rawQuery } = require('../../common/db');

// 第 34、59 行 - 错误的调用
const countResult = await rawQuery(countSql, params);
const list = await rawQuery(listSql, params);
```

### 根本原因分析
根据项目规范文档 `CLAUDE.md`：

> **⚠️ 统一使用 Query Builder（强制执行）**：
> - **禁止使用原生 SQL**（`rawQuery`、`query` 等方法）
> - **必须使用 CloudBase Query Builder**（Supabase-style）
> - **所有查询（包括 JOIN）统一使用 `db.from()` 链式调用**

当前 `common/db.js` 已经移除了 `rawQuery` 方法，只保留了 Query Builder 相关的方法。但是部分云函数代码还在使用已废弃的 `rawQuery`。

---

## ✅ 通过测试的接口

### Course 模块
1. **getList** - 获取课程列表
   - 状态: ✅ 成功
   - 返回数据: 1 条课程记录

2. **getDetail** - 获取课程详情
   - 状态: ✅ 成功
   - 测试ID: 1
   - 返回: 完整的课程详细信息

3. **getCalendarSchedule** - 获取日历排课数据
   - 状态: ✅ 成功
   - 测试参数: 2026-02-01 至 2026-02-28
   - 返回: 空数据（正常，因为没有排课数据）

### System 模块
1. **getBannerList** - 获取轮播图列表
   - 状态: ✅ 成功
   - 返回: 空列表（正常，因为没有轮播图数据）

2. **getAnnouncementList** - 获取公告列表
   - 状态: ✅ 成功
   - 返回: 2 条公告记录

---

## 🔒 需要登录的接口（无法测试）

由于 MCP `invokeFunction` 工具不支持模拟用户登录状态，以下接口返回 `401 未登录` 错误，无法进行完整测试：

### User 模块（14 个接口全部需要登录）
1. login - 微信登录/注册（特殊：不需要提前验证）
2. getProfile - 获取个人资料
3. updateProfile - 更新个人资料
4. updateReferee - 修改推荐人
5. getRefereeInfo - 获取推荐人信息
6. searchReferees - 搜索推荐人列表
7. getMyCourses - 获取我的课程列表
8. getMyOrders - 获取我的订单列表
9. getMeritPoints - 获取功德分余额
10. getMeritPointsHistory - 获取功德分明细
11. getCashPoints - 获取积分余额
12. getCashPointsHistory - 获取积分明细
13. applyWithdraw - 申请积分提现
14. getWithdrawRecords - 获取提现记录
15. getMyReferees - 获取我推荐的用户列表

### Course 模块（8 个接口需要登录）
1. getClassRecords - 获取上课排期列表
2. createAppointment - 创建预约
3. cancelAppointment - 取消预约
4. getMyAppointments - 获取我的预约列表
5. checkin - 签到
6. recordAcademyProgress - 记录商学院学习进度
7. getAcademyProgress - 获取商学院学习进度
8. getCaseDetail - 获取案例详情（可能需要登录）

### Order 模块（9 个接口全部需要登录）
1. create - 创建订单
2. createPayment - 发起支付
3. getDetail - 获取订单详情
4. getList - 获取订单列表
5. cancel - 取消订单
6. getMallGoods - 获取商城商品列表
7. exchangeGoods - 功德分兑换商品
8. getExchangeRecords - 获取兑换记录列表
9. getMallCourses - 获取商城课程列表

### Ambassador 模块（11 个接口全部需要登录）
1. apply - 申请成为大使
2. getApplicationStatus - 获取申请状态
3. upgrade - 大使升级
4. getUpgradeGuide - 获取升级指南
5. generateQRCode - 生成推广二维码
6. getMyQuotas - 获取我的名额
7. giftQuota - 赠送名额
8. getContractTemplate - 获取协议模板
9. signContract - 签署协议
10. getMyContracts - 获取我的协议列表
11. getContractDetail - 获取协议详情

### System 模块（8 个接口需要登录）
1. getFeedbackCourses - 获取可反馈的课程列表
2. getFeedbackTypes - 获取反馈类型列表
3. submitFeedback - 提交反馈
4. getMyFeedback - 获取我的反馈列表
5. getNotificationConfigs - 获取通知配置列表
6. subscribeNotification - 订阅/取消订阅通知
7. getAnnouncementDetail - 获取公告详情（可能需要登录）
8. getUserPoints - 获取用户积分信息

---

## 修复方案

### ✅ 已完成修复（P0 - 公开接口）

以下 3 个公开接口已完成修复并已部署：

1. ✅ `getCaseList` - 案例列表
2. ✅ `getAcademyList` - 商学院介绍列表
3. ✅ `getMaterialList` - 资料列表

### 优先级 P1 - 建议修复（管理端接口）

以下 7 个管理端接口需要修复，但不影响前端用户使用：

#### 1. 简单查询接口（可直接转换）
- `cloudfunctions/course/handlers/admin/getMaterialList.js`
- `cloudfunctions/course/handlers/admin/getCourseList.js`
- `cloudfunctions/course/handlers/admin/getCaseList.js`

#### 2. 复杂 JOIN 查询接口（需谨慎处理）
- `cloudfunctions/course/handlers/admin/getClassRecordList.js` - 含 INNER JOIN courses
- `cloudfunctions/course/handlers/admin/getAppointmentList.js` - 含多表 JOIN（appointments, users, courses, class_records）
- `cloudfunctions/course/handlers/admin/batchCheckin.js` - 含批量更新和事务操作

#### 3. 客户端复杂查询接口
- `cloudfunctions/course/handlers/client/getAcademyProgress.js` - 商学院学习进度（含条件查询）

### 优先级 P0 - 立即修复（示例代码 - 已完成）

#### 修复 getCaseList 接口
**文件**: `cloudfunctions/course/handlers/public/getCaseList.js`

需要将原生 SQL 查询改为 Query Builder：

```javascript
// 修复后的代码
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询
    let queryBuilder = db.from('academy_cases')
      .select('*', { count: 'exact' })
      .eq('status', 1)
      .is('deleted_at', null);

    // 添加分类筛选
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`);
    }

    // 执行查询（带总数）
    const { data: list, error, count: total } = await queryBuilder
      .select('id, title, category, cover_image, summary, author, view_count, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getCaseList] 查询失败:', error);
    return response.error('查询案例列表失败', error);
  }
};
```

#### 修复 getAcademyList 接口
**文件**: `cloudfunctions/course/handlers/public/getAcademyList.js`

```javascript
// 修复后的代码
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    // 使用 Query Builder 查询
    const { data: list, error } = await db
      .from('academy_intro')
      .select('id, title, cover_image, summary, sort_order, created_at')
      .eq('status', 1)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return response.success({
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getAcademyList] 查询失败:', error);
    return response.error('查询商学院列表失败', error);
  }
};
```

#### 修复 getMaterialList 接口
**文件**: `cloudfunctions/course/handlers/public/getMaterialList.js`

```javascript
// 修复后的代码
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询
    let queryBuilder = db.from('academy_materials')
      .select('*', { count: 'exact' })
      .eq('status', 1);

    // 添加分类筛选
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }

    // 执行查询（带总数）
    const { data: list, error, count: total } = await queryBuilder
      .select('id, title, category, image_url, video_url, content, tags, view_count, download_count, share_count, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return response.success({
      total: total || 0,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });

  } catch (error) {
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
```

---

## 🔍 全局代码审查结果

### 发现的所有 rawQuery 使用情况

通过全局搜索，发现以下文件仍在使用已废弃的 `rawQuery` 方法：

#### Course 模块（已修复 3 个，待修复 7 个）

**✅ 已修复**：
1. `cloudfunctions/course/handlers/public/getCaseList.js` - 案例列表（公开接口）
2. `cloudfunctions/course/handlers/public/getAcademyList.js` - 商学院介绍列表（公开接口）
3. `cloudfunctions/course/handlers/public/getMaterialList.js` - 资料列表（公开接口）

**⚠️ 待修复（管理端接口 - 复杂查询）**：
1. `cloudfunctions/course/handlers/admin/getClassRecordList.js` - 上课排期列表（含 JOIN）
2. `cloudfunctions/course/handlers/admin/getAppointmentList.js` - 预约列表（含多表 JOIN）
3. `cloudfunctions/course/handlers/admin/batchCheckin.js` - 批量签到（含事务操作）
4. `cloudfunctions/course/handlers/admin/getMaterialList.js` - 资料列表（管理端）
5. `cloudfunctions/course/handlers/admin/getCourseList.js` - 课程列表（管理端）
6. `cloudfunctions/course/handlers/admin/getCaseList.js` - 案例列表（管理端）
7. `cloudfunctions/course/handlers/client/getAcademyProgress.js` - 商学院学习进度

#### 文档文件（无需修复）
- `cloudfunctions/order/common/db-migration-guide.md` - 仅为文档说明
- `cloudfunctions/user/common/db-migration-guide.md` - 仅为文档说明
- `cloudfunctions/course/common/db-migration-guide.md` - 仅为文档说明
- `cloudfunctions/course/common/db.js.backup` - 备份文件

### 1. 搜索所有使用 rawQuery 的文件
已执行全局搜索：

```bash
# 搜索命令
grep -r "rawQuery" cloudfunctions/
```

**发现问题文件数量**: 10 个（其中 3 个已修复，7 个待修复）

### 2. 统一导入规范
确保所有云函数统一使用以下导入方式：

```javascript
// ✅ 正确
const { db } = require('../../common/db');

// ❌ 错误
const { from, rawQuery } = require('../../common/db');
const { query, rawQuery } = require('../../common/db');
```

### 3. Query Builder 最佳实践
参考项目规范，统一使用 Query Builder：
- 简单查询：`db.from('table').select('*').eq('id', 1)`
- 分页查询：使用 `range(offset, offset + limit - 1)`
- 模糊搜索：使用 `.ilike()` 或 `.or()`
- 关联查询：使用外键语法 `.select('*, users!fk_name(id, name)')`

---

## 测试建议

### 1. 修复后重新测试
完成代码修复后，建议重新测试以下接口：
- ✅ Course/getCaseList
- ✅ Course/getAcademyList
- ✅ Course/getMaterialList

### 2. 前端集成测试
由于 MCP 工具无法模拟用户登录，建议通过以下方式测试需要登录的接口：
1. 使用小程序开发者工具进行真机测试
2. 使用 Postman + 真实用户 Token 测试
3. 编写自动化测试脚本（使用 wx-server-sdk 模拟登录）

### 3. 端到端测试
建议测试完整的业务流程：
1. 用户登录 → 获取个人资料
2. 浏览课程 → 创建订单 → 支付
3. 预约课程 → 签到 → 获取积分
4. 申请大使 → 升级 → 推广赚取佣金

---

## 总结

### 已发现的问题
1. **P0 严重**: 3 个 Course 模块接口使用了已废弃的 `rawQuery` 方法，导致接口完全失败
2. **测试限制**: 大部分接口需要用户登录，MCP 工具无法完全测试

### 修复优先级
1. **立即修复**: Course 模块的 3 个失败接口（getCaseList、getAcademyList、getMaterialList）
2. **代码审查**: 全局搜索并修复所有使用 `rawQuery` 的代码
3. **测试验证**: 使用前端真实环境测试所有接口

### 预期修复时间
- ✅ P0 公开接口修复: 已完成（3 个接口）
- 🔄 P1 管理端接口修复: 预计 2-3 小时（7 个接口）
- 🔄 完整测试验证: 预计 2 小时

### 修复优先级说明

#### 为什么 P0 先修复公开接口？
1. **影响面最大**: 公开接口是前端用户直接访问的，故障会导致前端页面加载失败
2. **修复最简单**: 公开接口查询逻辑简单，可快速转换为 Query Builder
3. **验证最容易**: 可以直接通过前端页面验证修复效果

#### 为什么 P1 是管理端接口？
1. **影响面较小**: 仅管理员使用，不影响普通用户
2. **修复较复杂**: 涉及多表 JOIN 和复杂条件，需要仔细测试
3. **可以延后**: 管理端功能可以暂时不使用，不影响业务运行

#### 复杂查询的 Query Builder 转换策略

根据项目规范文档 `CLAUDE.md` 的 **Query Builder JOIN 查询规范**：
- 必须使用外键语法：`.select('*, 关联表别名:关联表名!外键名称(字段1, 字段2)')`
- 外键命名格式：`fk_表名_字段名`
- 需要先查询外键信息：
  ```sql
  SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'tiandao_culture'
  AND TABLE_NAME = '表名'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
  ```

**示例**：管理端预约列表需要关联 users, courses, class_records 三张表，需要先确认外键名称后再转换。

---

## 附录：完整测试日志

### 测试接口清单
| 模块 | 接口 | 状态 | 错误信息 |
|------|------|------|----------|
| Course | getList | ✅ 成功 | - |
| Course | getDetail | ✅ 成功 | - |
| Course | getCalendarSchedule | ✅ 成功 | - |
| Course | getCaseList | ❌ 失败 | `rawQuery is not a function` |
| Course | getAcademyList | ❌ 失败 | `rawQuery is not a function` |
| Course | getMaterialList | ❌ 失败 | `rawQuery is not a function` |
| System | getBannerList | ✅ 成功 | - |
| System | getAnnouncementList | ✅ 成功 | - |
| Order | getMallGoods | 🔒 需登录 | `未登录` |
| Order | getMallCourses | 🔒 需登录 | `未登录` |
| User | getProfile | 🔒 需登录 | `未登录` |

### 环境信息
- 环境ID: cloud1-0gnn3mn17b581124
- 数据库: tiandao_culture
- 测试工具: CloudBase MCP `invokeFunction`
- 测试时间: 2026-02-11

