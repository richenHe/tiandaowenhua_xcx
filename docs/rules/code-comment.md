# 代码注释规范

> 📌 **适用场景**：生成或修改任何代码（云函数、Vue 组件、工具函数）时参考此文档。

## 强制要求

**生成或修改代码时必须添加必要注释，确保后续 AI 能够理解代码逻辑和业务含义。**

## 注释原则

1. **清晰性**：注释要清晰表达代码的意图，而非重复代码本身
2. **必要性**：关键业务逻辑、复杂算法、特殊处理必须注释
3. **及时性**：编写代码时同步添加注释，不要事后补充
4. **准确性**：注释要与代码保持一致，修改代码时同步更新注释

---

## 注释类型和规范

### 1. 文件头部注释

```javascript
/**
 * 文件说明：用户订单创建支付接口
 * 功能：创建订单并生成微信支付参数
 */
```

```vue
<!--
  页面说明：订单支付页面
  功能：处理课程订单、复训订单、升级订单的统一支付
  路由参数：orderId（订单ID）、orderType（订单类型）
-->
```

### 2. 函数/方法注释（JSDoc）

```javascript
/**
 * 创建订单并生成支付参数
 * @param {Object} event - 事件对象
 * @param {string} event.courseId - 课程ID（驼峰命名）
 * @param {number} event.orderType - 订单类型：1-课程订单，2-复训订单，3-升级订单
 * @param {Object} context - 上下文对象
 * @param {string} context.OPENID - 用户openid
 * @returns {Promise<Object>} 返回支付参数或错误信息
 */
module.exports = async (event, context) => {};
```

### 3. 业务逻辑注释

```javascript
// ✅ 正确 - 详细说明业务逻辑
// 订单状态流转：待支付(1) -> 已支付(2) -> 已完成(3)
// 注意：只有已支付订单才能申请退款
if (order.status === 2) {
  // 检查退款条件：订单完成时间在7天内
  const daysDiff = (Date.now() - order.completed_at) / (1000 * 60 * 60 * 24);
}

// ❌ 错误 - 注释没有价值
// 如果订单状态是2
if (order.status === 2) {}
```

### 4. 参数转换注释（驼峰 ↔ 下划线）

```javascript
// 前端传入驼峰命名（realName），需要转换为数据库下划线命名（real_name）
const updateData = {
  real_name: realName,  // 转换为 snake_case 存入数据库
  phone: phone,
};
```

### 5. 数据库查询注释

```javascript
// 查询用户订单列表，关联查询推荐人信息
// 使用外键 fk_orders_referee 关联 users 表
const { data: orders, error } = await db
  .from('orders')
  .select(`*, referee:users!fk_orders_referee(id, real_name, nickname)`)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### 6. 特殊处理注释

```javascript
// 注意：status 参数可能为 null，需要先验证再使用 parseInt
// 原因：parseInt(null) 返回 NaN，会导致查询失败
if (status != null && status !== '') {
  queryBuilder = queryBuilder.eq('status', parseInt(status));
}

// 订单类型说明：
// 1 - 课程订单（初探班/密训班）
// 2 - 复训订单（已购买用户再次购买）
// 3 - 升级订单（大使等级升级）
const orderTypeMap = { 1: '课程订单', 2: '复训订单', 3: '升级订单' };

// TODO: 当前实现仅支持单课程订单，后续需要支持多课程合并支付
```

### 7. Vue 组件注释

```vue
<template>
  <!-- 订单列表卡片 -->
  <!-- 支持三种订单类型：课程订单、复训订单、升级订单 -->
  <view class="t-card">
    <!-- 订单状态标签 -->
    <t-badge :content="statusText" />
  </view>
</template>

<script setup>
/**
 * 订单列表项组件
 * @component OrderItem
 * @description 显示单个订单信息，支持点击跳转到订单详情
 */

/**
 * @prop {Object} order - 订单对象
 * @prop {number} order.order_type - 订单类型（数据库字段，下划线命名）
 * @prop {number} order.status - 订单状态：1-待支付，2-已支付，3-已完成
 */
const props = defineProps({ order: { type: Object, required: true } });

/**
 * @emits {number} orderId - 点击卡片，传出订单ID
 */
const handleClick = () => {
  uni.navigateTo({ url: `/pages/order/detail/index?orderId=${props.order.id}` });
};
</script>
```

### 8. 错误处理注释

```javascript
try {
  // 业务逻辑
} catch (error) {
  // 数据库错误：记录日志但不暴露给用户
  // 业务错误：返回友好提示
  // 系统错误：返回通用错误信息
  console.error('[createOrder] 订单创建失败:', error);
  if (error.code === 'DB_ERROR') {
    return response.error('系统繁忙，请稍后重试', error);
  }
  return response.error(error.message || '操作失败', error);
}
```

---

## 注释检查清单

生成或修改代码后必须检查：

- [ ] **文件头部**：已添加文件说明注释
- [ ] **函数注释**：所有函数都有 JSDoc 注释，包含参数和返回值说明
- [ ] **业务逻辑**：关键业务逻辑有清晰注释，说明业务规则和流程
- [ ] **参数转换**：字段命名转换（驼峰↔下划线）有注释说明
- [ ] **数据库查询**：复杂查询有注释，说明查询意图和关联关系
- [ ] **特殊处理**：特殊逻辑、边界情况、已知问题有注释
- [ ] **组件注释**：Vue 组件、props、事件有注释说明
- [ ] **错误处理**：错误处理逻辑有注释，说明处理策略
