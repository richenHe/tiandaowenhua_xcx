# rawQuery 重构为 Query Builder 详细计划

## 📋 重构概览

**目标**: 将所有使用 `rawQuery` 的接口重构为 Query Builder（Supabase-style）  
**原因**: 根据项目规范，必须统一使用 Query Builder  
**外键信息**: 已完整查询数据库所有外键

---

## 🔑 数据库外键映射表（重要参考）

### appointments 表
- `fk_appointments_user` → users(id)
- `fk_appointments_course` → courses(id)
- `fk_appointments_class_record` → class_records(id)
- `fk_appointments_user_course` → user_courses(id)

### class_records 表
- `fk_class_records_course` → courses(id)

### orders 表
- `fk_orders_user` → users(id)
- `fk_orders_referee` → users(id)
- `fk_orders_class_record` → class_records(id)

### academy_cases 表
- `fk_academy_cases_course` → courses(id)

### users 表
- `fk_users_referee` → users(id) (自引用)

### user_courses 表
- `fk_user_courses_user` → users(id)
- `fk_user_courses_course` → courses(id)
- `fk_user_courses_source_order` → orders(id)

---

## 📚 Query Builder JOIN 语法示例

### 单表 JOIN 示例（来自 getMyAppointments.js）

```javascript
const { data, error } = await db
  .from('appointments')
  .select(`
    id,
    course_id,
    class_record_id,
    status,
    course:courses!fk_appointments_course(
      name,
      type
    ),
    class_record:class_records!fk_appointments_class_record(
      class_date,
      class_time,
      class_location,
      teacher
    )
  `, { count: 'exact' })
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

**关键点**:
1. ✅ 使用外键名称：`!fk_表名_字段名`
2. ✅ 别名格式：`别名:关联表名!外键名称(字段1, 字段2)`
3. ✅ 支持分页：`.range(offset, offset + limit - 1)`
4. ✅ 支持计数：`{ count: 'exact' }`

---

## 🎯 重构步骤计划

### 第 1 步：修复简单查询（无 JOIN）✅

**优先级**: P1  
**预计时间**: 30 分钟  
**文件数**: 3 个

#### 1.1 admin/getCourseList.js
- **当前**: 使用 rawQuery，SELECT * FROM courses
- **重构**: db.from('courses').select('*')
- **复杂度**: ⭐ 简单

#### 1.2 admin/getCaseList.js
- **当前**: 使用 rawQuery，SELECT * FROM academy_cases
- **重构**: db.from('academy_cases').select('*')
- **复杂度**: ⭐ 简单

#### 1.3 admin/getMaterialList.js
- **当前**: 使用 rawQuery，SELECT * FROM academy_materials
- **重构**: db.from('academy_materials').select('*')
- **复杂度**: ⭐ 简单

---

### 第 2 步：修复单表 JOIN（1个外键）✅

**优先级**: P2  
**预计时间**: 45 分钟  
**文件数**: 1 个

#### 2.1 admin/getClassRecordList.js
- **当前**: 
  ```sql
  SELECT cr.*, c.name as course_name, c.type as course_type
  FROM class_records cr
  INNER JOIN courses c ON c.id = cr.course_id
  ```
- **重构**: 
  ```javascript
  db.from('class_records')
    .select(`
      *,
      course:courses!fk_class_records_course(name, type)
    `)
  ```
- **外键**: `fk_class_records_course`
- **复杂度**: ⭐⭐ 中等

---

### 第 3 步：修复多表 JOIN（3个外键）✅

**优先级**: P3  
**预计时间**: 1 小时  
**文件数**: 1 个

#### 3.1 admin/getAppointmentList.js（最复杂）
- **当前**: 
  ```sql
  SELECT a.*, u.real_name, u.phone, c.name, cr.class_date, cr.start_time
  FROM appointments a
  INNER JOIN users u ON u.id = a.user_id
  INNER JOIN courses c ON c.id = a.course_id
  INNER JOIN class_records cr ON cr.id = a.class_record_id
  ```
- **重构**: 
  ```javascript
  db.from('appointments')
    .select(`
      *,
      user:users!fk_appointments_user(id, real_name, phone),
      course:courses!fk_appointments_course(name),
      class_record:class_records!fk_appointments_class_record(
        class_date,
        start_time,
        end_time,
        location
      )
    `, { count: 'exact' })
  ```
- **外键**: 
  - `fk_appointments_user`
  - `fk_appointments_course`
  - `fk_appointments_class_record`
- **复杂度**: ⭐⭐⭐ 复杂

---

### 第 4 步：修复批量操作接口✅

**优先级**: P4  
**预计时间**: 1.5 小时  
**文件数**: 2 个

#### 4.1 admin/batchCheckin.js
- **当前**: 使用 rawQuery 批量更新 + 事务操作
- **重构**: 使用 db.from().update().in('id', ids)
- **复杂度**: ⭐⭐⭐ 复杂（含事务）

#### 4.2 client/getAcademyProgress.js
- **当前**: 使用 rawQuery，复杂条件查询
- **重构**: 使用 Query Builder 链式调用
- **复杂度**: ⭐⭐ 中等

---

## ⚠️ 重构注意事项

### 1. 数据返回格式变化
```javascript
// ❌ 原生 SQL：字段扁平化
// { id: 1, course_name: '课程A', user_name: '张三' }

// ✅ Query Builder：字段嵌套化
// { 
//   id: 1, 
//   course: { name: '课程A' },
//   user: { name: '张三' }
// }
```

**解决方案**: 修改数据格式化逻辑，适配嵌套结构

### 2. 分页参数变化
```javascript
// ❌ 原生 SQL
LIMIT ? OFFSET ?  // [10, 20]

// ✅ Query Builder
.range(20, 29)  // offset=20, limit=10 → range(20, 20+10-1)
```

### 3. 总数查询
```javascript
// ❌ 原生 SQL：需要单独 SELECT COUNT(*)
const countSql = 'SELECT COUNT(*) as total FROM table';
const [{ total }] = await rawQuery(countSql);

// ✅ Query Builder：自动返回 count
const { data, error, count } = await db
  .from('table')
  .select('*', { count: 'exact' });
```

### 4. 条件查询组合
```javascript
// ❌ 原生 SQL：手动拼接 WHERE
let where = 'WHERE 1=1';
if (keyword) where += ' AND name LIKE ?';

// ✅ Query Builder：链式调用
let qb = db.from('table').select('*');
if (keyword) qb = qb.ilike('name', `%${keyword}%`);
```

---

## ✅ 验证检查清单

每个接口重构后必须检查：

1. [ ] **代码编译**: 无语法错误
2. [ ] **本地部署**: `mcp_cloudbase_updateFunctionCode` 成功
3. [ ] **功能测试**: `mcp_cloudbase_invokeFunction` 返回正确数据
4. [ ] **数据格式**: 前端期望的字段都存在（可能需要格式化）
5. [ ] **分页功能**: total 正确，page 参数生效
6. [ ] **过滤条件**: 所有过滤参数生效
7. [ ] **错误处理**: error 处理正确
8. [ ] **性能**: 查询时间合理（< 3秒）

---

## 📝 重构代码模板

### 模板 1：简单查询（无 JOIN）

```javascript
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { keyword, page = 1, page_size = 10 } = event;
  
  try {
    const { offset, limit } = getPagination(page, page_size);
    
    // 构建查询
    let queryBuilder = db
      .from('table_name')
      .select('*', { count: 'exact' })
      .eq('status', 1);
    
    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.ilike('name', `%${keyword}%`);
    }
    
    // 排序和分页
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // 执行查询
    const { data: list, error, count: total } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list: list || []
    });
    
  } catch (error) {
    console.error('[Module/Action] 查询失败:', error);
    return response.error('查询失败', error);
  }
};
```

### 模板 2：单表 JOIN

```javascript
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { course_id, page = 1, page_size = 10 } = event;
  
  try {
    const { offset, limit } = getPagination(page, page_size);
    
    // 构建查询（带 JOIN）
    let queryBuilder = db
      .from('class_records')
      .select(`
        id,
        course_id,
        class_date,
        start_time,
        end_time,
        location,
        teacher,
        max_students,
        current_students,
        course:courses!fk_class_records_course(
          name,
          type
        )
      `, { count: 'exact' })
      .eq('status', 1);
    
    // 添加课程过滤
    if (course_id) {
      queryBuilder = queryBuilder.eq('course_id', course_id);
    }
    
    // 排序和分页
    queryBuilder = queryBuilder
      .order('class_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // 执行查询
    const { data: records, error, count: total } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    // 格式化数据（扁平化嵌套字段）
    const list = (records || []).map(record => ({
      id: record.id,
      course_id: record.course_id,
      course_name: record.course?.name || '',
      course_type: record.course?.type || 0,
      class_date: record.class_date,
      start_time: record.start_time,
      end_time: record.end_time,
      location: record.location,
      teacher: record.teacher,
      max_students: record.max_students,
      current_students: record.current_students,
      available_quota: record.max_students - record.current_students
    }));
    
    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });
    
  } catch (error) {
    console.error('[Module/Action] 查询失败:', error);
    return response.error('查询失败', error);
  }
};
```

### 模板 3：多表 JOIN（最复杂）

```javascript
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { status, page = 1, page_size = 10 } = event;
  
  try {
    const { offset, limit } = getPagination(page, page_size);
    
    // 构建查询（多表 JOIN）
    let queryBuilder = db
      .from('appointments')
      .select(`
        id,
        user_id,
        course_id,
        class_record_id,
        status,
        checkin_code,
        checkin_at,
        appointed_at,
        cancelled_at,
        user:users!fk_appointments_user(
          id,
          real_name,
          phone
        ),
        course:courses!fk_appointments_course(
          name
        ),
        class_record:class_records!fk_appointments_class_record(
          class_date,
          start_time,
          end_time,
          location
        )
      `, { count: 'exact' });
    
    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }
    
    // 排序和分页
    queryBuilder = queryBuilder
      .order('appointed_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // 执行查询
    const { data: appointments, error, count: total } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    // 格式化数据（扁平化嵌套字段）
    const getStatusName = (status) => {
      const map = {
        1: '待上课',
        2: '已签到',
        3: '已取消'
      };
      return map[status] || '未知';
    };
    
    const list = (appointments || []).map(apt => ({
      id: apt.id,
      user_id: apt.user_id,
      real_name: apt.user?.real_name || '',
      phone: apt.user?.phone || '',
      course_id: apt.course_id,
      course_name: apt.course?.name || '',
      class_record_id: apt.class_record_id,
      class_date: apt.class_record?.class_date || '',
      start_time: apt.class_record?.start_time || '',
      end_time: apt.class_record?.end_time || '',
      location: apt.class_record?.location || '',
      status: apt.status,
      status_name: getStatusName(apt.status),
      checkin_code: apt.checkin_code,
      checkin_at: apt.checkin_at,
      appointed_at: apt.appointed_at,
      cancelled_at: apt.cancelled_at
    }));
    
    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });
    
  } catch (error) {
    console.error('[Module/Action] 查询失败:', error);
    return response.error('查询失败', error);
  }
};
```

---

## 📅 执行时间表

| 步骤 | 文件 | 复杂度 | 预计时间 | 负责人 |
|-----|------|--------|---------|--------|
| 1.1 | admin/getCourseList.js | ⭐ | 10分钟 | AI |
| 1.2 | admin/getCaseList.js | ⭐ | 10分钟 | AI |
| 1.3 | admin/getMaterialList.js | ⭐ | 10分钟 | AI |
| 2.1 | admin/getClassRecordList.js | ⭐⭐ | 45分钟 | AI |
| 3.1 | admin/getAppointmentList.js | ⭐⭐⭐ | 1小时 | AI |
| 4.1 | admin/batchCheckin.js | ⭐⭐⭐ | 1小时 | AI |
| 4.2 | client/getAcademyProgress.js | ⭐⭐ | 30分钟 | AI |
| **总计** | **7个文件** | - | **3小时45分钟** | - |

---

## 🚀 开始执行

准备好了吗？让我们开始重构！

**第一步**: 修复 3 个简单查询接口
**第二步**: 修复单表 JOIN 接口
**第三步**: 修复多表 JOIN 接口
**第四步**: 修复批量操作接口
**第五步**: 完整测试验证

每完成一步，立即部署和测试，确保没有问题再进行下一步。


