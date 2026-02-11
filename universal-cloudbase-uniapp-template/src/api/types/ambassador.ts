/**
 * 大使模块类型定义
 */

import type { PaginationParams, PaginationResponse } from '../types'

/**
 * 大使申请信息
 */
export interface AmbassadorApplication {
  /** 申请ID */
  id: number
  /** 用户ID */
  user_id: number
  /** 状态（0-待审核，1-通过，2-拒绝） */
  status: number
  /** 状态文本 */
  status_text: string
  /** 申请理由 */
  reason: string
  /** 拒绝理由 */
  reject_reason: string | null
  /** 创建时间 */
  created_at: string
  /** 审核时间 */
  audited_at: string | null
}

/**
 * 申请成为大使请求参数
 */
export interface ApplyAmbassadorParams {
  /** 真实姓名 */
  real_name: string
  /** 联系电话 */
  phone: string
  /** 微信号 */
  wechat?: string
  /** 申请理由 */
  reason: string
}

/**
 * 申请成为大使响应数据
 */
export interface ApplyAmbassadorResponse {
  id: number
  status: number
  created_at: string
}

/**
 * 大使升级请求参数
 */
export interface UpgradeAmbassadorParams {
  /** 目标等级（2-5） */
  target_level: number
  /** 升级方式（payment-支付，contract-协议） */
  upgrade_type: 'payment' | 'contract'
  /** 订单ID（支付方式必填） */
  order_id?: number
  /** 协议ID（协议方式必填） */
  contract_id?: number
}

/**
 * 大使升级响应数据
 */
export interface UpgradeAmbassadorResponse {
  new_level: number
  level_name: string
  benefits: {
    commission_rate: number
    quotas: number
  }
}

/**
 * 升级指南信息
 */
export interface UpgradeGuide {
  /** 当前等级信息 */
  current_level: {
    level: number
    name: string
    benefits: string[]
  }
  /** 目标等级信息 */
  target_level: {
    level: number
    name: string
    benefits: string[]
  }
  /** 升级选项 */
  upgrade_options: Array<{
    type: 'payment' | 'contract'
    name: string
    eligible: boolean
    fee?: number
    requirements?: string[]
    reason?: string
  }>
  /** 当前统计数据 */
  current_stats: {
    referee_count: number
    order_count: number
    merit_points: number
    cash_points: number
  }
  /** 升级要求 */
  requirements: Record<string, any>
}

/**
 * 生成二维码请求参数
 */
export interface GenerateQRCodeParams {
  /** 跳转页面 */
  page?: string
  /** 二维码宽度 */
  width?: number
}

/**
 * 生成二维码响应数据
 */
export interface GenerateQRCodeResponse {
  qrcode_url: string
  referee_code: string
  share_link: string
}

/**
 * 名额信息
 */
export interface QuotaInfo {
  /** 总名额 */
  total_quotas: number
  /** 已使用名额 */
  used_quotas: number
  /** 可用名额 */
  available_quotas: number
  /** 名额记录 */
  quota_records: QuotaRecord[]
}

/**
 * 名额记录
 */
export interface QuotaRecord {
  id: number
  type: string
  quantity: number
  used_quantity: number
  created_at: string
}

/**
 * 赠送名额请求参数
 */
export interface GiftQuotaParams {
  /** 接收人UID */
  receiver_uid: string
  /** 赠送数量 */
  quantity: number
  /** 备注 */
  note?: string
}

/**
 * 赠送名额响应数据
 */
export interface GiftQuotaResponse {
  remaining_quotas: number
}

/**
 * 协议模板
 */
export interface ContractTemplate {
  /** 模板ID */
  id: number
  /** 协议标题 */
  title: string
  /** 协议内容 */
  content: string
  /** 版本号 */
  version: string
  /** 生效日期 */
  effective_date: string
}

/**
 * 签署协议请求参数
 */
export interface SignContractParams {
  /** 协议模板ID */
  template_id: number
  /** 电子签名 */
  signature: string
  /** 是否同意 */
  agree: boolean
}

/**
 * 签署协议响应数据
 */
export interface SignContractResponse {
  id: number
  contract_no: string
  signed_at: string
  expire_at: string
}

/**
 * 协议信息
 */
export interface Contract {
  /** 协议ID */
  id: number
  /** 协议编号 */
  contract_no: string
  /** 协议标题 */
  title: string
  /** 大使等级 */
  level: number
  /** 状态（1-生效中，2-已过期，3-已终止） */
  status: number
  /** 状态文本 */
  status_text: string
  /** 签署时间 */
  signed_at: string
  /** 过期时间 */
  expire_at: string
}

/**
 * 协议详情
 */
export interface ContractDetail extends Contract {
  /** 协议内容 */
  content: string
  /** 签名 */
  signature: string
  /** 签署IP */
  sign_ip: string
  /** 签署设备 */
  sign_device: string
}

/**
 * 大使信息
 */
export interface Ambassador {
  id: number
  real_name: string
  phone: string
  ambassador_level: number
  level_name: string
  referee_code: string
  referral_count: number
  team_size: number
  total_commission: number
  created_at: string
}

/**
 * 大使详情
 */
export interface AmbassadorDetail extends Ambassador {
  quotas: {
    total: number
    used: number
    available: number
  }
  performance: {
    total_orders: number
    total_revenue: number
    this_month_orders: number
    this_month_revenue: number
  }
  team: {
    direct_referrals: number
    indirect_referrals: number
    active_members: number
  }
}

/**
 * 获取申请列表请求参数
 */
export interface GetApplicationListParams extends PaginationParams {
  /** 状态筛选 */
  status?: number
}

/**
 * 获取申请列表响应数据
 */
export interface GetApplicationListResponse extends PaginationResponse<AmbassadorApplication> {}

/**
 * 获取大使列表请求参数
 */
export interface GetAmbassadorListParams extends PaginationParams {
  /** 等级筛选 */
  level?: number
}

/**
 * 获取大使列表响应数据
 */
export interface GetAmbassadorListResponse extends PaginationResponse<Ambassador> {}

/**
 * 活动记录
 */
export interface Activity {
  id: number
  user_id: number
  activity_type: string
  activity_name: string
  description: string
  points_earned: number
  created_at: string
}

/**
 * 获取活动记录请求参数
 */
export interface GetActivityListParams extends PaginationParams {
  /** 活动类型筛选 */
  activity_type?: string
}

/**
 * 获取活动记录响应数据
 */
export interface GetActivityListResponse extends PaginationResponse<Activity> {}
