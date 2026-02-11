/**
 * 用户模块类型定义
 */

import type { PaginationParams, PaginationResponse } from '../types'

/**
 * 用户信息
 */
export interface UserProfile {
  /** 用户ID */
  id: number
  /** 微信OpenID */
  _openid: string
  /** 真实姓名 */
  real_name: string
  /** 手机号 */
  phone: string
  /** 城市 */
  city: string
  /** 头像URL */
  avatar: string
  /** 推荐码 */
  referral_code: string
  /** 推荐人ID */
  referee_id: number | null
  /** 大使等级 */
  ambassador_level: number
  /** 功德分 */
  merit_points: number
  /** 积分（可用） */
  cash_points: number
  /** 冻结积分 */
  frozen_cash_points: number
  /** 资料是否完善 */
  profile_completed: number
  /** 推荐人确认时间 */
  referee_confirmed_at: string | null
  /** 创建时间 */
  created_at: string
  /** 性别 */
  gender?: string
  /** 行业 */
  industry?: string
  /** 出生八字（格式：年-月-日-时） */
  birthday?: string
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  /** 场景值（推荐码） */
  scene?: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  id: number
  _openid: string
  referral_code: string
  referee_id: number | null
  profile_completed: number
  created_at: string
}

/**
 * 更新资料请求参数
 */
export interface UpdateProfileParams {
  /** 真实姓名 */
  realName: string
  /** 手机号 */
  phone: string
  /** 城市 */
  city?: string
  /** 头像URL */
  avatar?: string
  /** 微信昵称 */
  nickname?: string
  /** 性别 */
  gender?: string
  /** 行业 */
  industry?: string
  /** 出生八字（格式：年-月-日-时） */
  birthday?: string
}

/**
 * 更新资料响应数据
 */
export interface UpdateProfileResponse {
  profile_completed: number
}

/**
 * 修改推荐人请求参数
 */
export interface UpdateRefereeParams {
  /** 推荐码 */
  refereeCode: string
}

/**
 * 推荐人信息
 */
export interface RefereeInfo {
  id: number
  real_name: string
  phone: string
  referral_code: string
  ambassador_level: number
  avatar: string
}

/**
 * 搜索推荐人请求参数
 */
export interface SearchRefereesParams {
  /** 搜索关键词（姓名或手机号） */
  keyword: string
}

/**
 * 搜索推荐人列表项
 */
export interface SearchRefereeItem {
  id: number
  uid: string
  name: string
  phone: string
  avatar: string
  level: string
  ambassador_level: number
  limitation: string
  referee_code: string
}

/**
 * 搜索推荐人响应数据
 */
export interface SearchRefereesResponse {
  list: SearchRefereeItem[]
  total: number
}

/**
 * 功德分信息
 */
export interface MeritPointsInfo {
  /** 当前余额 */
  balance: number
  /** 总获得 */
  total_earned: number
  /** 总消耗 */
  total_spent: number
}

/**
 * 功德分明细记录
 */
export interface MeritPointsRecord {
  id: number
  /** 变动金额 */
  change_amount: number
  /** 变动后余额 */
  balance_after: number
  /** 变动类型 */
  change_type: string
  /** 关联ID */
  related_id: number | null
  /** 备注 */
  remark: string
  /** 创建时间 */
  created_at: string
}

/**
 * 积分信息
 */
export interface CashPointsInfo {
  /** 可用积分 */
  available: number
  /** 冻结积分 */
  frozen: number
  /** 提现中积分 */
  withdrawing: number
  /** 总获得 */
  total_earned: number
  /** 总提现 */
  total_spent: number
}

/**
 * 积分明细记录
 */
export interface CashPointsRecord {
  id: number
  /** 变动金额 */
  change_amount: number
  /** 变动后余额 */
  balance_after: number
  /** 变动类型 */
  change_type: string
  /** 关联ID */
  related_id: number | null
  /** 备注 */
  remark: string
  /** 创建时间 */
  created_at: string
}

/**
 * 申请提现请求参数
 */
export interface ApplyWithdrawParams {
  /** 提现金额 */
  amount: number
  /** 提现方式 */
  withdrawType: 'wechat' | 'alipay'
  /** 账户信息 */
  accountInfo: {
    name: string
    account: string
  }
}

/**
 * 提现记录
 */
export interface WithdrawRecord {
  id: number
  /** 提现单号 */
  withdraw_no: string
  /** 提现金额 */
  amount: number
  /** 提现方式 */
  withdraw_type: string
  /** 账户信息 */
  account_info: string
  /** 状态 */
  status: number
  /** 审核备注 */
  audit_remark: string | null
  /** 创建时间 */
  created_at: string
  /** 审核时间 */
  audited_at: string | null
}

/**
 * 推荐用户信息
 */
export interface RefereeUser {
  id: number
  real_name: string
  phone: string
  avatar: string
  ambassador_level: number
  created_at: string
}

/**
 * 我的课程
 */
export interface MyCourse {
  id: number
  title: string
  cover_image: string
  price: number
  purchase_date: string
  progress: number
  completed_at: string | null
}

/**
 * 我的订单
 */
export interface MyOrder {
  id: number
  order_no: string
  course_id: number
  course_title: string
  total_amount: number
  status: number
  created_at: string
  paid_at: string | null
}

/**
 * 获取推荐人列表请求参数
 */
export interface GetRefereesParams extends PaginationParams {}

/**
 * 获取推荐人列表响应数据
 */
export interface GetRefereesResponse extends PaginationResponse<RefereeUser> {}

/**
 * 获取功德分明细请求参数
 */
export interface GetMeritPointsHistoryParams extends PaginationParams {}

/**
 * 获取功德分明细响应数据
 */
export interface GetMeritPointsHistoryResponse extends PaginationResponse<MeritPointsRecord> {}

/**
 * 获取积分明细请求参数
 */
export interface GetCashPointsHistoryParams extends PaginationParams {}

/**
 * 获取积分明细响应数据
 */
export interface GetCashPointsHistoryResponse extends PaginationResponse<CashPointsRecord> {}

/**
 * 获取提现记录请求参数
 */
export interface GetWithdrawRecordsParams extends PaginationParams {
  /** 状态筛选 */
  status?: number
}

/**
 * 获取提现记录响应数据
 */
export interface GetWithdrawRecordsResponse extends PaginationResponse<WithdrawRecord> {}

/**
 * 获取我的课程请求参数
 */
export interface GetMyCoursesParams extends PaginationParams {}

/**
 * 获取我的课程响应数据
 */
export interface GetMyCoursesResponse extends PaginationResponse<MyCourse> {}

/**
 * 获取我的订单请求参数
 */
export interface GetMyOrdersParams extends PaginationParams {
  /** 状态筛选 */
  status?: number
}

/**
 * 获取我的订单响应数据
 */
export interface GetMyOrdersResponse extends PaginationResponse<MyOrder> {}
