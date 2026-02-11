# 字段映射总结

## 个人资料页面 (pages/mine/profile/index) 字段映射

### 前端 → API → 云函数 → 数据库 完整流程

#### 1. 头像 (Avatar)
- **前端变量**: `formData.avatar` (string)
- **API 参数**: `avatar` (camelCase)
- **云函数参数**: `avatar`
- **数据库字段**: `avatar` (VARCHAR(255))
- **映射**: 直接传递，无转换

#### 2. 真实姓名 (Real Name)
- **前端变量**: `formData.realName` (string)
- **API 参数**: `realName` (camelCase)
- **云函数参数**: `realName`
- **数据库字段**: `real_name` (VARCHAR(50))
- **映射**: camelCase → snake_case

#### 3. 手机号 (Phone)
- **前端变量**: `formData.phone` (string)
- **API 参数**: `phone` (camelCase)
- **云函数参数**: `phone`
- **数据库字段**: `phone` (VARCHAR(20))
- **映射**: 直接传递，无转换

#### 4. 性别 (Gender)
- **前端变量**: `formData.gender` ('male' | 'female')
- **API 参数**: `gender` ('男' | '女')
- **云函数参数**: `gender` ('男' | '女')
- **数据库字段**: `gender` (TINYINT: 1=男, 2=女)
- **映射**: 
  - 前端保存时: 'male' → '男', 'female' → '女'
  - 云函数写入: '男' → 1, '女' → 2
  - 云函数读取: 1 → '男', 2 → '女'
  - 前端加载时: '男' → 'male', '女' → 'female'

#### 5. 出生八字 (Birthday)
- **前端变量**: `formData.birthdate` (object: { year, month, day, hour })
- **API 参数**: `birthday` (string: "年-月-日-时")
- **云函数参数**: `birthday` (string: "年-月-日-时")
- **数据库字段**: `birth_bazi` (JSON: { "year": "xx", "month": "xx", "day": "xx", "hour": "xx" })
- **映射**:
  - 前端保存时: { year, month, day, hour } → "年-月-日-时"
  - 云函数写入: "年-月-日-时" → JSON { year, month, day, hour }
  - 云函数读取: JSON → "年-月-日-时"
  - 前端加载时: "年-月-日-时" → { year, month, day, hour }

#### 6. 从事行业 (Industry)
- **前端变量**: `formData.industry` (string)
- **API 参数**: `industry` (camelCase)
- **云函数参数**: `industry`
- **数据库字段**: `industry` (VARCHAR(50))
- **映射**: 直接传递，无转换

#### 7. 所在地区 (Region/City)
- **前端变量**: `formData.region` (string: "省 市 区")
- **API 参数**: `city` (camelCase)
- **云函数参数**: `city`
- **数据库字段**: `city` (VARCHAR(50))
- **映射**: 直接传递，无转换

#### 8. 推荐人信息 (Referee Info) - 只读
- **前端变量**: `refereeInfo` (object: { name, level, status })
- **数据来源**: `UserApi.getProfile()` 返回的 `referee_id`, `referee_confirmed_at`
- **数据库字段**: 
  - `referee_id` (INT)
  - `referee_confirmed_at` (DATETIME)
- **映射**: 仅用于展示，不可编辑

---

## 字段命名规范

### 1. 前端 API 参数（传给云函数）
使用 **camelCase（驼峰命名）**：
```typescript
// ✅ 正确
{
  realName: '张三',
  phone: '13800138000',
  city: '北京',
  avatar: 'https://...',
  gender: '男',
  industry: '互联网',
  birthday: '1990-01-01-12'
}
```

### 2. 云函数接收参数
使用 **camelCase（驼峰命名）**，与前端 API 参数保持一致：
```javascript
// ✅ 正确
const { realName, phone, city, avatar, gender, industry, birthday } = event;
```

### 3. 数据库字段
使用 **snake_case（蛇形命名）**：
```sql
-- ✅ 正确
UPDATE users SET 
  real_name = ?,
  phone = ?,
  city = ?,
  avatar = ?,
  gender = ?,
  industry = ?,
  birth_bazi = ?
WHERE _openid = ?
```

### 4. TypeScript 接口
- **API 参数接口**: 使用 camelCase
- **数据库返回接口**: 使用 snake_case（与数据库字段一致）

```typescript
// API 参数接口 - camelCase
export interface UpdateProfileParams {
  realName: string
  phone: string
  city?: string
  avatar?: string
  gender?: string
  industry?: string
  birthday?: string
}

// 数据库返回接口 - snake_case
export interface UserProfile {
  id: number
  _openid: string
  real_name: string
  phone: string
  city: string
  avatar: string
  gender?: string
  industry?: string
  birthday?: string  // 云函数已转换为字符串
  // ... 其他字段
}
```

---

## 数据转换逻辑

### 云函数 `getProfile.js`
从数据库读取 → 转换 → 返回给前端

```javascript
const profileData = {
  ...user,
  // 性别: TINYINT → 字符串
  gender: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '',
  // 出生八字: JSON → 字符串
  birthday: user.birth_bazi ? (() => {
    const bazi = JSON.parse(user.birth_bazi);
    return `${bazi.year}-${bazi.month}-${bazi.day}-${bazi.hour}`;
  })() : ''
};
```

### 云函数 `updateProfile.js`
前端参数 → 转换 → 写入数据库

```javascript
const updateData = {
  real_name: realName,  // camelCase → snake_case
  phone: phone,
  city: city || '',
  avatar: avatar || '',
  profile_completed: 1
};

// 性别: 字符串 → TINYINT
if (gender) {
  updateData.gender = gender === '男' ? 1 : gender === '女' ? 2 : 0;
}

// 行业: 直接传递
if (industry) {
  updateData.industry = industry;
}

// 出生八字: 字符串 → JSON
if (birthday) {
  const parts = birthday.split('-');
  if (parts.length === 4) {
    updateData.birth_bazi = JSON.stringify({
      year: parts[0],
      month: parts[1],
      day: parts[2],
      hour: parts[3]
    });
  }
}
```

---

## Code Review 检查清单

### 前端检查
- [ ] 表单字段使用 `formData.xxx` 格式
- [ ] API 调用使用 camelCase 参数名
- [ ] 性别值正确转换: 'male'/'female' ↔ '男'/'女'
- [ ] 出生八字正确转换: object ↔ string
- [ ] 地区选择正确处理: array ↔ string

### 云函数检查
- [ ] 接收参数使用 camelCase
- [ ] 写入数据库使用 snake_case
- [ ] 性别正确转换: '男'/'女' ↔ 1/2
- [ ] 出生八字正确转换: string ↔ JSON
- [ ] 必填参数验证: realName, phone

### 数据库检查
- [ ] 字段名使用 snake_case
- [ ] 所有表包含 `_openid` 字段
- [ ] 性别字段类型为 TINYINT
- [ ] 出生八字字段类型为 JSON

---

## 常见错误及解决方案

### 错误 1: 缺少必填参数
```
缺少必填参数: real_name
```
**原因**: 前端使用了 snake_case，应该使用 camelCase
**解决**: 将 `real_name` 改为 `realName`

### 错误 2: 性别字段类型不匹配
```
类型"UserProfile"上不存在属性"gender"
```
**原因**: TypeScript 接口未定义 gender 字段
**解决**: 在 `UserProfile` 接口中添加 `gender?: string`

### 错误 3: 出生八字解析失败
```
解析出生八字失败
```
**原因**: 数据库 `birth_bazi` 字段不是有效的 JSON
**解决**: 确保云函数正确保存 JSON 格式

### 错误 4: 查询了错误的数据库
```
查询结果为空或表不存在
```
**原因**: 查询了环境数据库而非业务数据库
**解决**: 明确指定数据库名 `tiandao_culture.users`

---

## 更新日志

### 2025-02-11
- ✅ 修复前端字段命名：`real_name` → `realName`
- ✅ 扩展 `UserProfile` 接口：添加 `gender`, `industry`, `birthday`
- ✅ 扩展 `UpdateProfileParams` 接口：添加 `gender`, `industry`, `birthday`
- ✅ 修改 `getProfile.js`：转换 `gender`, `birthday` 为前端格式
- ✅ 修改 `updateProfile.js`：转换前端参数为数据库格式
- ✅ 部署云函数：确保最新代码生效
- ✅ 更新 `pages/mine/profile/index` 为可编辑表单
- ✅ 添加头像选择器组件
- ✅ 应用 TDesign CSS 组件样式
- ✅ 所有 linter 错误已修复



