/**
 * API 通用类型定义
 */

/**
 * 云函数调用选项
 */
export interface CloudFunctionOptions {
  /** 云函数名称 */
  name: string
  /** 操作名称（action） */
  action: string
  /** 请求参数 */
  data?: any
  /** 是否显示加载提示 */
  showLoading?: boolean
  /** 加载提示文字 */
  loadingText?: string
  /** 请求超时时间（毫秒） */
  timeout?: number
}

/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean
  /** 状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
  /** 时间戳 */
  timestamp: number
  /** 重定向URL（用于403错误） */
  redirect_url?: string
}

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  page?: number
  /** 每页数量 */
  page_size?: number
  /** 偏移量 */
  offset?: number
  /** 限制数量 */
  limit?: number
}

/**
 * 分页响应
 */
export interface PaginationResponse<T = any> {
  /** 数据列表 */
  list: T[]
  /** 总数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  page_size: number
  /** 总页数 */
  total_pages: number
  /** 是否有下一页 */
  has_next: boolean
  /** 是否有上一页 */
  has_prev: boolean
}

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  /** 待支付 */
  PENDING = 1,
  /** 已支付 */
  PAID = 2,
  /** 已取消 */
  CANCELLED = 3,
  /** 已完成 */
  COMPLETED = 4,
  /** 已退款 */
  REFUNDED = 5
}

/**
 * 支付状态枚举
 */
export enum PayStatus {
  /** 未支付 */
  UNPAID = 0,
  /** 已支付 */
  PAID = 1,
  /** 部分支付 */
  PARTIAL = 2,
  /** 已退款 */
  REFUNDED = 3
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  /** 课程订单 */
  COURSE = 1,
  /** 商品订单 */
  GOODS = 2,
  /** 功德分兑换 */
  MERIT_EXCHANGE = 3
}

/**
 * 预约状态枚举
 */
export enum AppointmentStatus {
  /** 待确认 */
  PENDING = 1,
  /** 已确认 */
  CONFIRMED = 2,
  /** 已取消 */
  CANCELLED = 3,
  /** 已完成 */
  COMPLETED = 4,
  /** 已签到 */
  CHECKED_IN = 5
}

/**
 * 大使等级枚举
 */
export enum AmbassadorLevel {
  /** 普通用户 */
  NORMAL = 0,
  /** 初级大使 */
  JUNIOR = 1,
  /** 中级大使 */
  INTERMEDIATE = 2,
  /** 高级大使 */
  SENIOR = 3,
  /** 特级大使 */
  SPECIAL = 4
}

/**
 * 大使申请状态枚举
 */
export enum AmbassadorApplicationStatus {
  /** 待审核 */
  PENDING = 1,
  /** 已通过 */
  APPROVED = 2,
  /** 已拒绝 */
  REJECTED = 3
}

/**
 * 提现状态枚举
 */
export enum WithdrawStatus {
  /** 待审核 */
  PENDING = 1,
  /** 审核通过 */
  APPROVED = 2,
  /** 审核拒绝 */
  REJECTED = 3,
  /** 已打款 */
  PAID = 4
}

/**
 * 反馈状态枚举
 */
export enum FeedbackStatus {
  /** 待处理 */
  PENDING = 1,
  /** 处理中 */
  PROCESSING = 2,
  /** 已完成 */
  COMPLETED = 3,
  /** 已关闭 */
  CLOSED = 4
}

/**
 * 课程类型枚举
 */
export enum CourseType {
  /** 线上课程 */
  ONLINE = 1,
  /** 线下课程 */
  OFFLINE = 2,
  /** 混合课程 */
  HYBRID = 3
}

/**
 * 错误类型
 */
export interface ApiError {
  /** 错误码 */
  code: number
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
}
