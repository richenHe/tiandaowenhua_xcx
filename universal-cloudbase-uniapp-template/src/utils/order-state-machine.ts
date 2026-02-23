/**
 * 订单状态机
 * 定义订单状态枚举和流转规则
 */

// 订单类型
export enum OrderType {
  COURSE = 1,     // 课程购买
  RETRAIN = 2,    // 复训费
  UPGRADE = 4     // 大使升级
}

// 订单支付状态（与数据库 orders.pay_status 一致）
export enum OrderStatus {
  PENDING = 0,    // 待支付
  PAID = 1,       // 已支付
  CANCELLED = 2,  // 已取消
  CLOSED = 3,     // 已关闭
  REFUNDED = 4    // 已退款
}

// 支付状态（与数据库 orders.pay_status 一致）
export enum PayStatus {
  UNPAID = 0,     // 待支付
  PAID = 1,       // 已支付
  CANCELLED = 2,  // 已取消
  CLOSED = 3,     // 已关闭
  REFUNDED = 4    // 已退款
}

// 订单类型名称映射
export const OrderTypeNames: Record<OrderType, string> = {
  [OrderType.COURSE]: '课程购买',
  [OrderType.RETRAIN]: '复训费',
  [OrderType.UPGRADE]: '大使升级'
}

// 订单状态名称映射
export const OrderStatusNames: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.CLOSED]: '已关闭',
  [OrderStatus.REFUNDED]: '已退款'
}

// 支付状态名称映射
export const PayStatusNames: Record<PayStatus, string> = {
  [PayStatus.UNPAID]: '待支付',
  [PayStatus.PAID]: '已支付',
  [PayStatus.CANCELLED]: '已取消',
  [PayStatus.CLOSED]: '已关闭',
  [PayStatus.REFUNDED]: '已退款'
}

/**
 * 判断订单是否可以支付
 */
export function canPayOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING
}

/**
 * 判断订单是否可以取消
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING
}

/**
 * 判断订单是否可以退款
 */
export function canRefundOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PAID
}

/**
 * 获取订单类型名称
 */
export function getOrderTypeName(type: OrderType): string {
  return OrderTypeNames[type] || '未知类型'
}

/**
 * 获取订单状态名称
 */
export function getOrderStatusName(status: OrderStatus): string {
  return OrderStatusNames[status] || '未知状态'
}

/**
 * 获取支付状态名称
 */
export function getPayStatusName(status: PayStatus): string {
  return PayStatusNames[status] || '未知状态'
}






















