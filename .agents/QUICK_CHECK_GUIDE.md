# 快速检查指南

## 🚀 5分钟快速验证

### 步骤1：部署云函数（2分钟）

```bash
# 进入云函数目录
cd cloudfunctions

# 部署 course 云函数
tcb fn deploy course

# 部署 order 云函数
tcb fn deploy order
```

---

### 步骤2：检查后台课程列表（1分钟）

1. 打开浏览器，访问：`admin/pages/course/list.html`
2. 查看课程列表是否显示数据
3. 检查以下关键字段：
   - ✅ 课程图片是否显示
   - ✅ 现价和原价是否都显示
   - ✅ 课程昵称是否显示
   - ✅ 已售数量是否显示

**预期结果**：所有字段完整显示，无空白

---

### 步骤3：检查排期管理（1分钟）

1. 打开：`admin/pages/course/schedule.html`
2. 查看排期列表
3. 检查名额显示：
   - ✅ 已预约/总名额 格式正确（例如：5/30）
   - ✅ 上课时间显示正确
   - ✅ 上课地点显示正确

**预期结果**：名额字段正确显示

---

### 步骤4：检查订单列表（1分钟）

1. 打开：`admin/pages/order/list.html`
2. 查看订单列表
3. 检查金额显示：
   - ✅ 原价列显示
   - ✅ 优惠列显示
   - ✅ 实付列显示
   - ✅ 用户昵称显示

**预期结果**：所有金额字段完整显示

---

## ⚡ 一键检查命令

如果你想快速检查所有修改的文件，可以运行：

```bash
# 查看修改的文件列表
git status --short | grep -E "(course|order)" | grep -v ".md"

# 查看具体修改内容
git diff admin/pages/course/list.html | head -50
git diff admin/pages/course/schedule.html | head -50
git diff admin/pages/order/list.html | head -50
```

---

## 🔍 关键修复点速查

### 课程列表页面
```javascript
// 修改前
{ colKey: 'image', title: '课程图片' }
{ colKey: 'price', title: '价格' }

// 修改后
{ colKey: 'cover_image', title: '课程图片' }
{ colKey: 'current_price', title: '现价' }
{ colKey: 'original_price', title: '原价' }  // 新增
{ colKey: 'nickname', title: '课程昵称' }    // 新增
{ colKey: 'sold_count', title: '已售' }      // 新增
```

### 排期管理页面
```javascript
// 修改前
{ colKey: 'max_students', title: '最大人数' }
{ colKey: 'current_students', title: '当前人数' }

// 修改后
{ colKey: 'total_quota', title: '总名额' }
{ colKey: 'booked_quota', title: '已预约' }
```

### 订单列表页面
```javascript
// 修改前
{ colKey: 'total_amount', title: '订单金额' }
{ colKey: 'paid_amount', title: '实付金额' }

// 修改后
{ colKey: 'original_amount', title: '原价' }
{ colKey: 'discount_amount', title: '优惠' }  // 新增
{ colKey: 'final_amount', title: '实付' }
{ colKey: 'user_nickname', title: '用户昵称' } // 新增
```

---

## 📋 快速验证清单

### 后台管理系统
- [ ] 课程列表有数据
- [ ] 课程图片正常显示
- [ ] 原价、现价、昵称、已售都显示
- [ ] 排期名额显示正确（已预约/总名额）
- [ ] 订单金额显示完整（原价、优惠、实付）

### 云函数
- [ ] course 云函数部署成功
- [ ] order 云函数部署成功
- [ ] 云函数日志无错误

---

## ❌ 常见问题

### 问题1：后台课程列表还是无数据

**解决方案**：
1. 检查云函数是否部署成功
2. 打开浏览器控制台，查看是否有错误
3. 查看云函数日志，确认 `getCourseList` 是否被调用

### 问题2：字段显示为空

**解决方案**：
1. 检查数据库是否有数据
2. 检查云函数返回的数据格式
3. 检查前端字段映射是否正确

### 问题3：名额显示错误

**解决方案**：
1. 确认数据库字段名为 `total_quota` 和 `booked_quota`
2. 检查云函数是否返回正确字段
3. 检查前端是否使用正确字段名

---

## 📞 需要帮助？

如果验证过程中遇到问题，请提供：

1. **错误截图**：浏览器控制台错误信息
2. **云函数日志**：腾讯云控制台的日志截图
3. **具体问题描述**：哪个页面、哪个字段有问题

---

## ✅ 验证通过标准

当以下所有项都通过时，表示修复成功：

1. ✅ 后台课程列表显示数据，所有字段完整
2. ✅ 后台排期管理名额显示正确
3. ✅ 后台订单列表金额显示完整
4. ✅ 云函数日志无错误
5. ✅ 小程序功能正常（可选）

---

**快速检查指南创建时间**：2026-02-13
**预计验证时间**：5 分钟
