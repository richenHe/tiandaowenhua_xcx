# API 接口修复清单

**生成时间**: 2026-02-12  
**参考文档**: `.agents/plans/前后端联通实施计划.md` + API测试结果  
**总接口数**: 46个  
**待修复数**: 12个（2个错误修复 + 10个新增接口）

---

## 🚨 P0 - 最高优先级（支付流程核心）

### 1. order.createPayment - 发起支付 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: createPayment  
**影响页面**: `/pages/order/payment/index.vue`  
**业务流程**: 订单支付 → 微信支付  

**需求分析**:
- 接收订单号 (orderNo)
- 调用微信支付API
- 返回支付参数 (timeStamp, nonceStr, package, signType, paySign)

**云函数路径**: `cloudfunctions/order/handlers/client/createPayment.js`

**参考实现**:
```javascript
module.exports = async (event, context) => {
  const { orderNo } = event;
  const { user } = context;

  // 1. 验证订单状态
  // 2. 调用微信支付统一下单
  // 3. 返回支付参数
  
  return response.success({
    timeStamp, nonceStr, package, signType, paySign, prepay_id
  });
};
```

**预计工作量**: 4小时（包含微信支付对接）

---

## 🔥 P1 - 高优先级（核心业务流程）

### 2. user.searchReferees - 搜索推荐人 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: searchReferees  
**影响页面**: `/pages/order/select-referee/index.vue`  
**业务流程**: 选择推荐人 → 订单创建

**需求分析**:
- 接收关键词 (keyword: 手机号/姓名)
- 查询大使用户
- 返回推荐人列表（含等级、推荐限制）

**云函数路径**: `cloudfunctions/user/handlers/client/searchReferees.js`

**参考实现**:
```javascript
module.exports = async (event, context) => {
  const { keyword } = event;
  
  const { data, error } = await db
    .from('users')
    .select('id, uid, real_name, phone, avatar, ambassador_level, referee_code')
    .gte('ambassador_level', 1)
    .or(`phone.like.%${keyword}%,real_name.like.%${keyword}%`)
    .limit(20);
    
  return response.success(data);
};
```

**预计工作量**: 1小时

---

### 3. user.updateReferee - 更新推荐人 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: updateReferee  
**影响页面**: `/pages/order/select-referee/index.vue`  
**业务流程**: 确认推荐人 → 更新用户推荐关系

**需求分析**:
- 接收推荐码 (refereeCode)
- 验证推荐人资格（等级、推荐限制）
- 验证修改次数（7天内只能修改1次）
- 更新 users.referee_id

**云函数路径**: `cloudfunctions/user/handlers/client/updateReferee.js`

**预计工作量**: 2小时（含业务逻辑验证）

---

### 4. course.createAppointment - 创建预约 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: createAppointment  
**影响页面**: `/pages/course/appointment-confirm/index.vue`  
**业务流程**: 选择排期 → 确认预约

**需求分析**:
- 接收排期ID (classRecordId)
- 验证课程购买状态
- 验证名额是否充足
- 创建预约记录
- 更新排期已预约人数

**云函数路径**: `cloudfunctions/course/handlers/client/createAppointment.js`

**数据库操作**:
```sql
INSERT INTO appointments (user_id, class_record_id, course_id, status)
UPDATE class_records SET current_students = current_students + 1
```

**预计工作量**: 2小时

---

### 5. course.getMyAppointments - 获取我的预约 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: getMyAppointments  
**影响页面**: `/pages/mine/appointments/index.vue`  
**业务流程**: 我的 → 预约列表

**需求分析**:
- 查询用户所有预约
- 关联课程信息、排期信息
- 返回预约状态（待上课/已上课/已取消）

**云函数路径**: `cloudfunctions/course/handlers/client/getMyAppointments.js`

**参考实现**:
```javascript
const { data, error } = await db
  .from('appointments')
  .select(`
    *,
    course:courses!fk_appointments_course(name, type),
    class_record:class_records!fk_appointments_class_record(class_date, start_time, location)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**预计工作量**: 1.5小时

---

### 6. ambassador.getContractTemplate - 获取协议模板 ⚠️ 待修复

**状态**: ❌ 字段错误  
**错误**: `Unknown column 'level' in 'where clause'`  
**影响页面**: `/pages/ambassador/contract-sign/index.vue`  
**业务流程**: 升级大使 → 查看协议 → 签署

**问题分析**:
- contract_templates 表中没有 level 字段
- 查看数据库文档，正确字段可能是 `ambassador_level` 或其他

**修复方案**:
1. 检查 contract_templates 表结构
2. 修正查询字段名
3. 或添加缺失字段到数据库

**云函数路径**: `cloudfunctions/ambassador/handlers/client/getContractTemplate.js`

**预计工作量**: 30分钟

---

### 7. ambassador.signContract - 签署协议 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: signContract  
**影响页面**: `/pages/ambassador/contract-sign/index.vue`  
**业务流程**: 查看协议 → 签署确认

**需求分析**:
- 接收模板ID (templateId)
- 接收手机号后四位验证 (phoneLastFour)
- 创建签署记录 (contract_signatures)
- 返回签署记录ID

**云函数路径**: `cloudfunctions/ambassador/handlers/client/signContract.js`

**数据库操作**:
```sql
INSERT INTO contract_signatures (
  user_id, template_id, contract_content, signed_at, 
  effective_date, expiry_date, status
)
```

**预计工作量**: 2小时

---

## 📌 P2 - 中优先级（重要功能）

### 8. user.applyWithdraw - 申请提现 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: applyWithdraw  
**影响页面**: `/pages/ambassador/withdraw/index.vue`  
**业务流程**: 积分管理 → 申请提现

**需求分析**:
- 接收提现金额 (amount)
- 接收提现方式 (withdrawType: 1=微信零钱)
- 接收账户信息 (accountInfo)
- 验证可提现金额
- 创建提现记录
- 冻结对应积分

**云函数路径**: `cloudfunctions/user/handlers/client/applyWithdraw.js`

**数据库操作**:
```sql
INSERT INTO withdrawals (user_id, withdraw_no, amount, withdraw_type, account_info, status)
UPDATE users SET cash_points_frozen = cash_points_frozen + amount
```

**预计工作量**: 2小时

---

### 9. order.getMallGoods - 获取商城商品 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: getMallGoods  
**影响页面**: `/pages/mall/index.vue`  
**业务流程**: 商城首页 → 商品列表

**需求分析**:
- 查询上架商品
- 返回商品信息（名称、图片、价格、库存）
- 计算用户是否可兑换

**云函数路径**: `cloudfunctions/order/handlers/client/getMallGoods.js`

**参考实现**:
```javascript
const { data, error } = await db
  .from('mall_goods')
  .select('*')
  .eq('status', 1)
  .gt('stock_quantity', 0)
  .order('sort_order', { ascending: true });
```

**预计工作量**: 1小时

---

### 10. ambassador.generateQRCode - 生成推广二维码 ❌ 未实现

**状态**: 🚫 接口不存在  
**错误**: 未知的操作: generateQRCode  
**影响页面**: `/pages/ambassador/qrcode/index.vue`  
**业务流程**: 大使推广 → 生成二维码

**需求分析**:
- 生成/获取用户推荐码
- 调用小程序码生成API
- 返回二维码URL、推荐码、分享文案

**云函数路径**: `cloudfunctions/ambassador/handlers/client/generateQRCode.js`

**参考实现**:
```javascript
// 调用微信小程序码生成API
const result = await cloud.openapi.wxacode.getUnlimited({
  scene: user.referee_code,
  page: 'pages/index/index'
});

return response.success({
  qrcode_url: uploadedUrl,
  referee_code: user.referee_code,
  share_text: '邀请您加入...',
  expires_at: null
});
```

**预计工作量**: 3小时（含小程序码API对接）

---

### 11. system.submitFeedback - 提交反馈 ⚠️ 待修复

**状态**: ❌ 字段错误  
**错误**: `Unknown column 'images' in 'field list'`  
**影响页面**: `/pages/mine/feedback/index.vue`  
**业务流程**: 意见反馈 → 提交

**问题分析**:
- feedbacks 表中缺少 images 字段
- 需要添加 images 字段存储截图

**修复方案**:
```sql
ALTER TABLE tiandao_culture.feedbacks 
ADD COLUMN images TEXT NULL COMMENT '截图（JSON数组）' AFTER content;
```

**云函数路径**: `cloudfunctions/system/handlers/client/submitFeedback.js`

**预计工作量**: 30分钟

---

## 📋 修复计划总览

### 按优先级排序

| 优先级 | 接口 | 类型 | 工作量 | 依赖 |
|-------|------|------|--------|------|
| **P0** | order.createPayment | 新增 | 4h | 微信支付API |
| **P1** | user.searchReferees | 新增 | 1h | - |
| **P1** | user.updateReferee | 新增 | 2h | searchReferees |
| **P1** | course.createAppointment | 新增 | 2h | - |
| **P1** | course.getMyAppointments | 新增 | 1.5h | - |
| **P1** | ambassador.getContractTemplate | 修复 | 0.5h | - |
| **P1** | ambassador.signContract | 新增 | 2h | getContractTemplate |
| **P2** | user.applyWithdraw | 新增 | 2h | - |
| **P2** | order.getMallGoods | 新增 | 1h | - |
| **P2** | ambassador.generateQRCode | 新增 | 3h | 微信API |
| **P2** | system.submitFeedback | 修复 | 0.5h | 数据库修改 |
| **P3** | system.getNotificationConfigs | 修复 | 1h | 创建表 |

### 总工作量估算
- **P0级**: 4小时
- **P1级**: 9小时
- **P2级**: 7.5小时
- **总计**: **20.5小时**

---

## 🔧 实施建议

### 第一批（P0+P1核心）- 优先修复
1. ✅ **已修复**: system.getAnnouncementDetail, system.getMyFeedback, course.getClassRecords, course.getAcademyProgress
2. ⚠️ **立即修复**:
   - ambassador.getContractTemplate (30分钟)
   - system.submitFeedback (30分钟)
3. 🚀 **立即实现**:
   - order.createPayment (4小时) - **最高优先级**
   - user.searchReferees + updateReferee (3小时)
   - course.createAppointment + getMyAppointments (3.5小时)
   - ambassador.signContract (2小时)

**第一批总计**: 13.5小时

### 第二批（P2功能完善）
4. user.applyWithdraw (2小时)
5. order.getMallGoods (1小时)
6. ambassador.generateQRCode (3小时)

**第二批总计**: 6小时

### 第三批（可选）
7. system.getNotificationConfigs (1小时) - 前端未使用，可延后

---

## 📊 影响页面统计

### 高影响页面（功能受阻）
1. `/pages/order/payment/index.vue` - **无法支付**
2. `/pages/order/select-referee/index.vue` - **无法选择推荐人**
3. `/pages/course/appointment-confirm/index.vue` - **无法预约课程**
4. `/pages/mine/appointments/index.vue` - **无法查看预约**
5. `/pages/ambassador/contract-sign/index.vue` - **无法签署协议**

### 中影响页面（功能不完整）
6. `/pages/ambassador/withdraw/index.vue` - 无法申请提现
7. `/pages/mall/index.vue` - 无法查看商品
8. `/pages/ambassador/qrcode/index.vue` - 无法生成二维码
9. `/pages/mine/feedback/index.vue` - 无法上传截图

### 低影响页面（可延后）
10. 消息通知设置页面（未创建）

---

## ✅ 验收标准

### 每个接口修复后必须验证：
1. ✅ 接口调用成功，返回正确数据
2. ✅ 参数验证正常（必填/选填/格式）
3. ✅ 错误处理完整（参数错误/业务错误/系统错误）
4. ✅ 数据库操作正确（增删改查/事务）
5. ✅ 字段命名遵循规范（驼峰 ↔ 下划线转换）
6. ✅ API文档已更新
7. ✅ 前端页面功能正常

---

## 📝 修复进度跟踪

- [ ] P0: order.createPayment
- [ ] P1: user.searchReferees
- [ ] P1: user.updateReferee
- [ ] P1: course.createAppointment
- [ ] P1: course.getMyAppointments
- [ ] P1: ambassador.getContractTemplate ⚠️ 修复
- [ ] P1: ambassador.signContract
- [ ] P2: user.applyWithdraw
- [ ] P2: order.getMallGoods
- [ ] P2: ambassador.generateQRCode
- [ ] P2: system.submitFeedback ⚠️ 修复
- [ ] P3: system.getNotificationConfigs ⚠️ 可选

**进度**: 0/12 完成

---

## 🎯 最终目标

- ✅ 所有前端页面功能可用
- ✅ 核心业务流程完整（登录→选推荐人→购课→支付→预约→上课）
- ✅ 大使系统完整（申请→升级→签约→推广→提现）
- ✅ 商城系统完整（浏览→兑换→查看记录）
- ✅ API测试通过率 > 95%







