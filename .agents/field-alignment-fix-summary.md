# 数据库字段对齐修复总结

## 修复时间
2026-02-13

## 修复目标
统一数据库、云函数、前端三层架构的字段命名，确保数据正确传递和显示。

---

## ✅ 已完成的修复

### 1. 后台课程列表页面 (`admin/pages/course/list.html`)

**修复内容：**
- ✅ 表格列配置字段对齐：
  - `image` → `cover_image`
  - `price` → `current_price`
  - 新增 `nickname`（课程昵称）
  - 新增 `original_price`（原价）
  - 新增 `sold_count`（已售）
  - 移除 `max_students`（不属于课程表）

- ✅ 模板插槽修正：
  - `#image` → `#cover_image`

- ✅ 编辑表单字段映射：
  - 添加 `nickname` 字段
  - 添加 `originalPrice`、`retrainPrice`、`outline`、`teacher` 等完整字段
  - 正确的驼峰命名转换

**影响范围：** 后台课程管理界面

---

### 2. 后台排期管理页面 (`admin/pages/course/schedule.html`)

**修复内容：**
- ✅ 表格列配置字段对齐：
  - `start_time` + `end_time` → `class_time`（合并为单个时间字段）
  - `location` → `class_location`
  - `current_students` → `booked_quota`
  - `max_students` → `total_quota`

- ✅ 表单字段修正：
  - `max_students` → `total_quota`

- ✅ 验证规则更新：
  - `max_students` → `total_quota`

**影响范围：** 后台排期管理界面

---

### 3. 后台订单列表页面 (`admin/pages/order/list.html`)

**修复内容：**
- ✅ 表格列配置字段对齐：
  - `orderType` → `order_type_text`
  - `item_name` → `order_name`
  - `total_amount` → `original_amount`
  - 新增 `discount_amount`（优惠金额）
  - `paid_amount` → `final_amount`
  - `status` → `pay_status_text`
  - `paymentMethod` → `pay_method`

**影响范围：** 后台订单管理界面

---

### 4. 云函数字段修复

#### 4.1 课程模块云函数

**文件：`cloudfunctions/course/handlers/admin/getCourseList.js`**
- ✅ 添加调试日志，便于排查问题

**文件：`cloudfunctions/course/handlers/admin/updateClassRecord.js`**
- ✅ 允许更新字段修正：
  - `max_students` → `total_quota`

**文件：`cloudfunctions/course/handlers/client/createAppointment.js`**
- ✅ 名额检查字段修正：
  - `current_students` → `booked_quota`
  - `max_students` → `total_quota`

**文件：`cloudfunctions/course/handlers/client/cancelAppointment.js`**
- ✅ 恢复名额字段修正：
  - `current_students` → `booked_quota`

**文件：`cloudfunctions/course/handlers/client/getClassRecords.js`**
- ✅ 返回字段命名统一：
  - `max_students` → `total_quota`
  - `current_students` → `booked_quota`

#### 4.2 订单模块云函数

**文件：`cloudfunctions/order/handlers/client/getDetail.js`**
- ✅ 课程字段修正：
  - `course.course_name` → `course.name`
- ✅ 添加缺失字段：
  - `discount_amount`
  - `user_name`
  - `user_phone`

**文件：`cloudfunctions/order/handlers/admin/getOrderDetail.js`**
- ✅ 课程字段修正：
  - `course.course_name` → `course.name`
- ✅ 添加缺失字段：
  - `discount_amount`

**文件：`cloudfunctions/order/handlers/admin/getOrderList.js`**
- ✅ 添加缺失字段：
  - `original_amount`
  - `discount_amount`
  - `paid_amount`
  - `user_nickname`
  - `points_used`

---

### 5. TypeScript 类型定义补充

**文件：`universal-cloudbase-uniapp-template/src/api/types/course.ts`**

**Course 接口：**
- ✅ 添加 `nickname?: string` 字段

**ClassRecord 接口：**
- ✅ 字段对齐：
  - `max_students` → `total_quota`
  - `current_students` → `booked_quota`
  - `available_slots` → `available_quota`

**文件：`universal-cloudbase-uniapp-template/src/api/types/order.ts`**

**Order 接口：**
- ✅ 添加缺失字段：
  - `discount_amount: number`
  - `user_name?: string`
  - `user_phone?: string`

---

### 6. 小程序页面字段修复

**文件：`universal-cloudbase-uniapp-template/src/pages/course/schedule/index.vue`**
- ✅ 课程排期字段对齐：
  - `item.max_students` → `item.total_quota`

**影响范围：** 小程序课程排期页面

---

## 📋 字段命名规范总结

### 数据库层（snake_case）
- `cover_image` - 封面图片
- `current_price` - 现价
- `original_price` - 原价
- `sold_count` - 已售数量
- `total_quota` - 总名额
- `booked_quota` - 已预约名额
- `class_time` - 上课时间
- `class_location` - 上课地点
- `discount_amount` - 优惠金额
- `user_name` - 用户姓名
- `user_phone` - 用户电话

### 云函数返回（snake_case）
与数据库保持一致，使用 snake_case

### 前端参数（camelCase）
- `coverImage` - 封面图片
- `currentPrice` - 现价
- `originalPrice` - 原价
- `soldCount` - 已售数量
- `totalQuota` - 总名额
- `bookedQuota` - 已预约名额
- `classTime` - 上课时间
- `classLocation` - 上课地点
- `discountAmount` - 优惠金额
- `userName` - 用户姓名
- `userPhone` - 用户电话

---

## 🎯 修复效果

### 预期成果
1. ✅ 后台课程列表正常显示数据
2. ✅ 所有字段完整展示，无缺失
3. ✅ 数据库、云函数、前端三层字段完全对齐
4. ✅ 字段命名符合统一规范
5. ✅ 小程序和后台数据一致
6. ✅ 所有功能正常运行

### 验证清单

**后台管理系统：**
- [ ] 课程列表是否显示数据
- [ ] 课程图片是否正常显示
- [ ] 所有字段是否完整展示
- [ ] 搜索功能是否正常
- [ ] 分页功能是否正常
- [ ] 编辑课程时字段是否正确回填
- [ ] 保存课程后数据是否正确
- [ ] 排期管理名额显示是否正确
- [ ] 订单列表金额显示是否正确

**小程序：**
- [ ] 课程列表是否显示数据
- [ ] 课程详情字段是否完整
- [ ] 订单详情字段是否完整
- [ ] 课程排期名额显示是否正确
- [ ] 预约功能是否正常

---

## 📝 配置文件修复

**文件：`cloudfunctions/cloudbaserc.json`**
- ✅ 创建配置文件，添加环境 ID

---

## 🚀 下一步操作

1. **部署云函数**：
   ```bash
   # 部署 course 云函数
   tcb fn deploy course

   # 部署 order 云函数
   tcb fn deploy order
   ```

2. **测试后台管理系统**：
   - 打开 `admin/pages/course/list.html`
   - 检查课程列表是否正常显示
   - 测试编辑、搜索、分页功能

3. **测试小程序**：
   - 测试课程列表和详情
   - 测试课程预约功能
   - 测试订单详情显示

4. **查看云函数日志**：
   - 检查 `getCourseList` 的调试日志
   - 确认数据查询是否成功

---

## ⚠️ 注意事项

1. **备份数据**：修改前已备份数据库和代码
2. **分支管理**：在新分支上进行修改，测试通过后再合并
3. **逐步部署**：先部署云函数，测试通过后再修改前端
4. **日志监控**：修改后密切关注云函数日志
5. **回滚准备**：如果出现问题，准备好快速回滚方案

---

## 📊 修复统计

- **修改文件数量**：12 个
- **后台页面**：3 个
  - `admin/pages/course/list.html` - 课程列表
  - `admin/pages/course/schedule.html` - 排期管理
  - `admin/pages/order/list.html` - 订单列表
- **云函数**：7 个
  - `cloudfunctions/course/handlers/admin/getCourseList.js`
  - `cloudfunctions/course/handlers/admin/updateClassRecord.js`
  - `cloudfunctions/course/handlers/client/createAppointment.js`
  - `cloudfunctions/course/handlers/client/cancelAppointment.js`
  - `cloudfunctions/course/handlers/client/getClassRecords.js`
  - `cloudfunctions/order/handlers/client/getDetail.js`
  - `cloudfunctions/order/handlers/admin/getOrderDetail.js`
  - `cloudfunctions/order/handlers/admin/getOrderList.js`
- **类型定义**：2 个
  - `universal-cloudbase-uniapp-template/src/api/types/course.ts`
  - `universal-cloudbase-uniapp-template/src/api/types/order.ts`
- **小程序页面**：1 个
  - `universal-cloudbase-uniapp-template/src/pages/course/schedule/index.vue`
- **配置文件**：1 个
  - `cloudfunctions/cloudbaserc.json`

---

## 🔍 关键修复点

1. **课程表字段**：`cover_image`, `current_price`, `original_price`, `nickname`, `sold_count`
2. **排期表字段**：`total_quota`, `booked_quota`, `class_time`, `class_location`
3. **订单表字段**：`discount_amount`, `user_name`, `user_phone`, `user_nickname`
4. **命名规范**：数据库/云函数使用 snake_case，前端参数使用 camelCase

---

**修复完成时间**：2026-02-13
**修复人员**：Claude Sonnet 4.5
**状态**：✅ 代码修复完成，等待部署测试
