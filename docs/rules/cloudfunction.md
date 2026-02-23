# 云函数开发规范

> 📌 **适用场景**：创建、修改或调试 `cloudfunctions/` 下的云函数时参考此文档。

---

## 运行时版本（严格遵守）⚠️

- 当前项目层（common-layer / business-logic-layer）仅支持 **`Nodejs14.18`**
- **禁止使用其他运行时版本**，运行时不匹配会导致部署失败

```json
// ✅ 正确
{ "name": "user", "runtime": "Nodejs14.18" }

// ❌ 错误 - 层不支持此版本
{ "name": "user", "runtime": "Nodejs18.15" }
```

---

## 目录结构规范

```
cloudfunctions/
├── 云函数名/
│   ├── index.js              # 入口文件（路由分发）
│   ├── package.json
│   ├── cloudfunction.json
│   └── handlers/
│       ├── client/           # 客户端接口
│       └── admin/            # 管理端接口
├── layers/
│   ├── common/
│   └── business-logic/
└── cloudbaserc.json
```

---

## 路由架构规范

统一入口文件 `index.js` 按 `action` 参数分发路由，客户端/管理端接口分离：

```javascript
const cloud = require('wx-server-sdk');
const { response, checkClientAuth, checkAdminAuth } = require('common');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const clientHandlers = {
  action1: require('./handlers/client/action1'),
};

const adminHandlers = {
  adminAction1: require('./handlers/admin/adminAction1'),
};

const ROUTES = {
  client: Object.keys(clientHandlers),
  admin: Object.keys(adminHandlers),
};

exports.main = async (event, context) => {
  const { action } = event;
  const OPENID = cloud.getWXContext().OPENID;

  try {
    if (ROUTES.client.includes(action)) {
      const user = await checkClientAuth(OPENID);
      return await clientHandlers[action](event, { OPENID, user });
    }
    if (ROUTES.admin.includes(action)) {
      const admin = await checkAdminAuth(OPENID);
      return await adminHandlers[action](event, { OPENID, admin });
    }
    return response.paramError(`未知的操作: ${action}`);
  } catch (error) {
    console.error(`[${action}] 执行失败:`, error);
    return response.error(error.message, error, error.code || 500);
  }
};
```

---

## 响应格式规范

必须使用 common 层的 `response` 工具，统一格式 `{ success, code, message, data }`：

```javascript
const { response } = require('common');

return response.success(data, '操作成功');
// { success: true, code: 0, message: '操作成功', data: {...} }

return response.error('操作失败', error);
// { success: false, code: 500, message: '操作失败', error: {...} }

return response.paramError('缺少必要参数');
// { success: false, code: 400, ... }

return response.unauthorized('用户未登录');
// { success: false, code: 401, ... }
```

---

## 数据库操作规范

### 强制使用 Query Builder

**禁止原生 SQL**，统一使用 CloudBase Query Builder（Supabase-style）：

```javascript
const { db } = require('common');

// 简单查询
const { data: users, error } = await db
  .from('users').select('*').eq('id', userId);

// 带条件查询
const { data: orders } = await db
  .from('orders').select('*')
  .eq('user_id', userId)
  .in('status', [1, 2, 3])
  .order('created_at', { ascending: false });

// JOIN 关联查询 - 必须明确指定外键名称（格式：fk_表名_字段名）
const { data } = await db
  .from('orders')
  .select(`*, referee:users!fk_orders_referee(id, real_name, nickname)`)
  .eq('user_id', userId);

// 多个 JOIN
const { data: appointments } = await db
  .from('appointments')
  .select(`
    *,
    course:courses!fk_appointments_course(name, type),
    class_record:class_records!fk_appointments_class_record(class_date, start_time)
  `)
  .eq('user_id', userId)
  .is('deleted_at', null);
```

查询外键名称的 SQL：
```sql
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'tiandao_culture'
AND TABLE_NAME = '表名'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 查询参数验证规范

**同时检查 null、undefined 和空字符串**，避免 `parseInt(null)` → `NaN`：

```javascript
// ✅ 正确
if (status != null && status !== '') {
  queryBuilder = queryBuilder.eq('status', parseInt(status));
}

// ❌ 错误 - status = null 时 parseInt(null) 返回 NaN，查不到数据
if (status !== undefined) {
  queryBuilder = queryBuilder.eq('status', parseInt(status));
}
```

### 图片字段处理（cloud:// → HTTPS）

`<image>` 组件无法显示 `cloud://` fileID，云函数返回前必须转换：

```javascript
const { getTempFileURL } = require('./common/storage');

// 单个文件
const { tempFileURL } = await getTempFileURL(course.cover_image);
return response.success({ cover_image: tempFileURL });

// 批量转换（列表接口）
const fileIDs = list.filter(item => item.cover_image).map(item => item.cover_image);
if (fileIDs.length > 0) {
  const { fileList } = await getTempFileURL(fileIDs);
  const urlMap = {};
  fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL; });
  list.forEach(item => {
    if (item.cover_image) item.cover_image = urlMap[item.cover_image] || '';
  });
}
```

涉及图片字段必检：`cover_image`、`goods_image`、`avatar`、`background_image`、`image_url`

---

## 环境变量配置（cloudbaserc.json）

```json
{
  "functions": [{
    "name": "user",
    "runtime": "Nodejs14.18",
    "envVariables": {
      "MYSQL_HOST": "数据库主机",
      "WECHAT_APPID": "小程序AppID",
      "JWT_SECRET": "JWT密钥"
    },
    "layers": [
      {"name": "common", "version": 2},
      {"name": "business-logic", "version": 1}
    ]
  }]
}
```

---

## Code Review 检查清单

- [ ] **代码注释**：所有函数、业务逻辑已添加注释（参考 `docs/rules/code-comment.md`）
- [ ] **运行时版本**：已确认使用 `Nodejs14.18`
- [ ] **目录结构**：符合规范（index.js + handlers/client + handlers/admin）
- [ ] **权限验证**：客户端/管理端分离鉴权
- [ ] **响应格式**：使用 `response` 工具，格式统一
- [ ] **Query Builder**：使用 `db.from()` 链式调用，无原生 SQL
- [ ] **查询参数验证**：可选参数使用 `param != null && param !== ''` 验证
- [ ] **JOIN 外键**：关联查询使用正确外键名称（`fk_表名_字段名` 格式）
- [ ] **图片转换**：图片字段已通过 `getTempFileURL` 转为 HTTPS
- [ ] **_openid 字段**：所有表已添加 `_openid VARCHAR(64) DEFAULT '' NOT NULL` 字段
- [ ] **环境变量**：敏感信息配置在环境变量中
- [ ] **层依赖**：已正确引用 common 和 business-logic 层

---

## 常见错误及解决方案

### 错误1：运行时版本不匹配
```
[UpdateFunctionConfiguration] 层版本xxx不适用当前运行时
```
**解决**：删除函数，使用 `Nodejs14.18` 重新创建

### 错误2：层未找到
```
[CreateFunction] 未找到指定的Layer
```
**解决**：用 `tcb fn layer list` 查看实际层名称，更新 cloudbaserc.json

### 错误3：查询了错误的数据库（返回空或报错）
**解决**：确认 MCP SQL 查询已加 `tiandao_culture.` 前缀

### 错误4：表缺少 _openid 字段
```
Error 1054: Unknown column '_openid'
```
**解决**：
```sql
ALTER TABLE tiandao_culture.表名
ADD COLUMN _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT '用户openid' AFTER id;
```

### 错误5：Query Builder JOIN 失败
```
Error: failed to find relationship between orders and users
```
**解决**：检查外键名称格式，必须是 `fk_表名_字段名`：
```javascript
// ❌ 错误
.select('*, referee:users(id, real_name)')

// ✅ 正确
.select('*, referee:users!fk_orders_referee(id, real_name)')
```

### 错误6：查询参数为 null 导致返回空数据
**解决**：将 `!== undefined` 改为 `!= null && !== ''`

---

## 最佳实践

1. **一个云函数一个模块**：user / order / course / ambassador / system 分离
2. **复用 common 层**：数据库、工具、响应格式统一
3. **接口命名规范**：动词+名词（getProfile / updateOrder / applyWithdraw）
4. **日志记录**：关键操作记录日志，便于排查问题
5. **数据库结构变更后**：必须同步更新 `docs/database/数据库详细信息.md`
