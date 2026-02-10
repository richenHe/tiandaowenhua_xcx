# CloudBase 数据库统一访问层迁移指南

## 📋 概述

新的 `common/db.js` 提供：
1. **Supabase 风格 Query Builder**：支持链式调用、自动 JOIN（需要外键）
2. **便捷查询方法**：`findOne`, `query`, `insert`, `update`, `delete`, `count`
3. **原始 SQL 支持**：`rawQuery`, `rawExecute`（需通过 HTTP API）

## 🔄 迁移步骤

### 1. 替换 db.js 文件

将各模块的 `common/db.js` 替换为统一的 `cloudfunctions/common/db.js`：

```bash
# user 模块
cp cloudfunctions/common/db.js cloudfunctions/user/common/db.js

# order 模块
cp cloudfunctions/common/db.js cloudfunctions/order/common/db.js

# course 模块
cp cloudfunctions/common/db.js cloudfunctions/course/common/db.js
```

### 2. 更新 Handler 代码

#### 旧代码（user 模块的原始 SQL）

```javascript
const { query } = require('../../common/db');

// 查询用户
const sql = 'SELECT * FROM users WHERE id = ?';
const users = await query(sql, [userId]);
const user = users[0];
```

#### 新代码（Supabase 风格）

```javascript
const { findOne } = require('../../common/db');

// 查询用户
const user = await findOne('users', { id: userId });
```

#### 旧代码（order 模块的 Query Builder）

```javascript
const { query } = require('../../common/db');

// 查询订单列表
const orders = await query('orders', {
  where: { user_id: userId, pay_status: 1 },
  orderBy: { column: 'created_at', ascending: false },
  limit: 10
});

// N+1 查询获取推荐人信息
const list = await Promise.all(orders.map(async (order) => {
  let referee_name = null;
  if (order.referee_id) {
    const referee = await query('users', {
      where: { id: order.referee_id },
      columns: 'real_name',
      limit: 1
    });
    referee_name = referee[0]?.real_name;
  }
  return { ...order, referee_name };
}));
```

#### 新代码（使用 JOIN，性能更优）

```javascript
const { db } = require('../../common/db');

// 一次查询，自动 JOIN（得益于外键约束）
const { data: orders } = await db
  .from('orders')
  .select(`
    *,
    referee:users!orders_referee_id_fkey(real_name)
  `)
  .eq('user_id', userId)
  .eq('pay_status', 1)
  .order('created_at', { ascending: false })
  .limit(10);

// 数据已包含关联信息，无需额外查询
const list = orders.map(order => ({
  ...order,
  referee_name: order.referee?.real_name || null
}));
```

#### 旧代码（course 模块的复杂 SQL）

```javascript
const { query } = require('../../common/db');

// 复杂关联查询
const sql = `
  SELECT
    c.id,
    c.name,
    c.type,
    COUNT(uc.id) as enrolled_count
  FROM courses c
  LEFT JOIN user_courses uc ON c.id = uc.course_id AND uc.status = 1
  WHERE c.status = 1
  GROUP BY c.id
  ORDER BY c.sort_order DESC
  LIMIT ? OFFSET ?
`;
const courses = await query(sql, [limit, offset]);
```

#### 新代码（Supabase 聚合查询）

```javascript
const { db } = require('../../common/db');

// 使用 Supabase 聚合查询
const { data: courses } = await db
  .from('courses')
  .select(`
    *,
    user_courses:user_courses(count)
  `)
  .eq('status', 1)
  .eq('user_courses.status', 1)
  .order('sort_order', { ascending: false })
  .range(offset, offset + limit - 1);

// 处理聚合结果
const result = courses.map(course => ({
  ...course,
  enrolled_count: course.user_courses?.[0]?.count || 0
}));
```

## 📝 常用模式对照表

| 操作 | 旧代码（SQL） | 新代码（Supabase） |
|------|--------------|------------------|
| 查询单条 | `query('SELECT * FROM users WHERE id = ?', [id])[0]` | `findOne('users', { id })` |
| 查询列表 | `query('SELECT * FROM users WHERE level = ?', [2])` | `query('users', { where: { level: 2 } })` |
| 插入数据 | `query('INSERT INTO users SET ?', [data])` | `insert('users', data)` |
| 更新数据 | `query('UPDATE users SET ? WHERE id = ?', [data, id])` | `update('users', data, { id })` |
| 删除数据 | `query('DELETE FROM users WHERE id = ?', [id])` | `deleteRecord('users', { id })` |
| 统计数量 | `query('SELECT COUNT(*) as c FROM users')[0].c` | `count('users')` |
| 关联查询 | 多次 `query` 或复杂 SQL | `db.from('table').select('*, relation(*)')` |

## 🎯 最佳实践

### 1. 优先使用 Supabase Query Builder

**优点**：
- 自动利用外键进行 JOIN
- 避免 N+1 查询问题
- 类型安全（如配合 TypeScript）
- 自动处理数据序列化

**示例**：
```javascript
// ✅ 推荐：一次查询获取所有数据
const { data } = await db
  .from('orders')
  .select('*, user:users(*), course:courses(*)')
  .eq('pay_status', 1);

// ❌ 不推荐：N+1 查询
const orders = await query('orders', { where: { pay_status: 1 } });
for (const order of orders) {
  order.user = await findOne('users', { id: order.user_id });
  order.course = await findOne('courses', { id: order.course_id });
}
```

### 2. 复杂查询使用便捷方法

当需要动态条件、复杂排序时，使用 `query` 方法：

```javascript
const { query } = require('../../common/db');

const options = {
  where: { status: 1 },
  orderBy: { column: 'created_at', ascending: false },
  limit: pageSize,
  offset: (page - 1) * pageSize
};

if (userId) {
  options.where.user_id = userId;
}

const list = await query('orders', options);
```

### 3. 使用存储过程处理复杂逻辑

对于复杂的业务逻辑（如多表更新、条件判断），推荐使用数据库存储过程：

```sql
-- 在数据库中创建存储过程
CREATE PROCEDURE calculate_order_total(IN order_id INT)
BEGIN
  -- 复杂计算逻辑
END;
```

```javascript
// 在云函数中调用
const { rpc } = require('../../common/db');
const result = await rpc('calculate_order_total', { order_id: 123 });
```

## ⚠️ 注意事项

### 1. 外键约束已添加

数据库已添加 32 个外键约束，Query Builder 可以自动利用这些约束进行 JOIN。

### 2. _openid 字段自动填充

插入数据时，`_openid` 字段会被服务器自动填充为当前登录用户的标识，无需手动设置：

```javascript
// ✅ 正确：不设置 _openid
await insert('orders', {
  order_no: 'ORD123',
  user_id: userId,
  // _openid 会自动填充
});

// ❌ 错误：不要手动设置 _openid
await insert('orders', {
  order_no: 'ORD123',
  user_id: userId,
  _openid: 'xxx' // 多余且可能导致权限问题
});
```

### 3. 性能优化

- 优先使用 JOIN 而不是 N+1 查询
- 只查询需要的字段：`.select('id, name')`
- 合理使用分页：`.range(start, end)`
- 为常用查询条件添加索引

### 4. 错误处理

```javascript
try {
  const { data, error } = await db.from('users').select('*');
  
  if (error) {
    console.error('Query error:', error);
    throw error;
  }
  
  return data;
} catch (err) {
  // 统一错误处理
  console.error('Database error:', err);
  throw err;
}
```

## 🚀 迁移检查清单

- [ ] 替换 `common/db.js` 文件
- [ ] 更新所有 handler 的导入路径
- [ ] 将原始 SQL 查询改为 Supabase Query Builder
- [ ] 将 N+1 查询优化为 JOIN 查询
- [ ] 移除手动设置 `_openid` 的代码
- [ ] 测试所有接口功能正常
- [ ] 检查性能是否有提升
- [ ] 更新 API 文档

## 📚 参考资料

- [Supabase JavaScript API 文档](https://supabase.com/docs/reference/javascript)
- [CloudBase Relational Database 文档](https://docs.cloudbase.net/database/relational-database)
- [数据库外键约束文档](../../docs/database/数据库详细信息.md#外键约束汇总)

