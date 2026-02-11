/**
 * 订单模块类型定义
 */

import type { PaginationParams, PaginationResponse } from '../types'

/**
 * 订单信息
 */
export interface Order {
  /** 订单号 */
  order_no: string
  /** 用户ID */
  user_id: number
  /** 订单类型（1-课程，2-复训，4-升级） */
  order_type: number
  /** 订单名称 */
  order_name: string
  /** 原始金额 */
  original_amount: number
  /** 最终金额 */
  final_amount: number
  /** 支付状态（0-待支付，1-已支付，2-已取消，3-已关闭，4-已退款） */
  pay_status: number
  /** 支付状态名称 */
  pay_status_name: string
  /** 支付时间 */
  pay_time: string | null
  /** 支付方式 */
  pay_method: string | null
  /** 微信交易号 */
  transaction_id: string | null
  /** 是否已发放奖励 */
  is_reward_granted: boolean
  /** 奖励发放时间 */
  reward_granted_at: string | null
  /** 创建时间 */
  created_at: string
  /** 过期时间 */
  expires_at: string
  /** 推荐人ID */
  referee_id: number | null
  /** 推荐人UID */
  referee_uid: string | null
  /** 推荐人姓名 */
  referee_name: string | null
  /** 推荐人等级 */
  referee_level: number | null
  /** 课程ID */
  course_id?: number
  /** 课程名称 */
  course_name?: string
  /** 课程类型 */
  course_type?: number
}

/**
 * 创建订单请求参数
 */
export interface CreateOrderParams {
  /** 订单类型（1-课程，2-复训，4-升级） */
  order_type: number
  /** 项目ID（根据order_type含义不同） */
  item_id: number
  /** 上课记录ID（复训专用） */
  class_record_id?: number
  /** 推荐人ID */
  referee_id?: number
}

/**
 * 创建订单响应数据
 */
export interface CreateOrderResponse {
  order_no: string
  order_type: number
  order_name: string
  amount: number
  referee_id: number | null
  referee_uid: string | null
  referee_name: string | null
  referee_level: number | null
  status: number
  expires_at: string
}

/**
 * 发起支付请求参数
 */
export interface CreatePaymentParams {
  /** 订单号 */
  order_no: string
}

/**
 * 发起支付响应数据
 */
export interface CreatePaymentResponse {
  status: string
  message: string
  order_no: string
  amount: number
}

/**
 * 获取订单列表请求参数
 */
export interface GetOrderListParams extends PaginationParams {
  /** 支付状态筛选 */
  status?: number
}

/**
 * 获取订单列表响应数据
 */
export interface GetOrderListResponse extends PaginationResponse<Order> {}

/**
 * 取消订单请求参数
 */
export interface CancelOrderParams {
  /** 订单号 */
  order_no: string
  /** 取消原因 */
  cancel_reason?: string
}

/**
 * 取消订单响应数据
 */
export interface CancelOrderResponse {
  order_no: string
  status: number
  status_name: string
}

/**
 * 商城商品
 */
export interface MallGoods {
  /** 商品ID */
  id: number
  /** 商品名称 */
  goods_name: string
  /** 商品图片 */
  goods_image: string
  /** 功德分价格 */
  merit_points_price: number
  /** 库存数量 */
  stock_quantity: number
  /** 已售数量 */
  sold_quantity: number
  /** 商品描述 */
  description: string
  /** 是否无限库存 */
  is_unlimited_stock: boolean
  /** 是否可兑换 */
  can_exchange: boolean
}

/**
 * 获取商城商品列表请求参数
 */
export interface GetMallGoodsParams extends PaginationParams {
  /** 关键词搜索 */
  keyword?: string
}

/**
 * 获取商城商品列表响应数据
 */
export interface GetMallGoodsResponse extends PaginationResponse<MallGoods> {}

/**
 * 兑换商品请求参数
 */
export interface ExchangeGoodsParams {
  /** 商品ID */
  goods_id: number
  /** 数量 */
  quantity?: number
  /** 功德分不足时是否使用积分补充 */
  use_cash_points_if_not_enough?: boolean
}

/**
 * 兑换商品响应数据
 */
export interface ExchangeGoodsResponse {
  exchange_no: string
  goods_name: string
  quantity: number
  merit_points_used: number
  cash_points_used: number
  total_cost: number
  status: string
  pickup_info: string
}

/**
 * 兑换记录
 */
export interface ExchangeRecord {
  /** 兑换单号 */
  exchange_no: string
  /** 商品名称 */
  goods_name: string
  /** 数量 */
  quantity: number
  /** 使用的功德分 */
  merit_points_used: number
  /** 使用的积分 */
  cash_points_used: number
  /** 总花费 */
  total_cost: number
  /** 状态（1-已兑换，2-已领取，3-已取消） */
  status: number
  /** 状态名称 */
  status_name: string
  /** 创建时间 */
  created_at: string
}

/**
 * 获取兑换记录请求参数
 */
export interface GetExchangeRecordsParams extends PaginationParams {
  /** 状态筛选 */
  status?: number
}

/**
 * 获取兑换记录响应数据
 */
export interface GetExchangeRecordsResponse extends PaginationResponse<ExchangeRecord> {}

/**
 * 商城课程
 */
export interface MallCourse {
  /** 课程ID */
  id: number
  /** 课程名称 */
  name: string
  /** 课程昵称 */
  nickname: string
  /** 课程类型 */
  type: number
  /** 封面图片 */
  coverImage: string
  /** 当前价格 */
  currentPrice: number
  /** 原价 */
  originalPrice: number
  /** 已售数量 */
  soldCount: number
  /** 库存 */
  stock: number
  /** 是否无限库存 */
  isUnlimitedStock: boolean
  /** 状态 */
  status: number
}

/**
 * 获取商城课程列表请求参数
 */
export interface GetMallCoursesParams extends PaginationParams {
  /** 课程类型筛选 */
  type?: number
  /** 关键词搜索 */
  keyword?: string
}

/**
 * 获取商城课程列表响应数据
 */
export interface GetMallCoursesResponse extends PaginationResponse<MallCourse> {}
