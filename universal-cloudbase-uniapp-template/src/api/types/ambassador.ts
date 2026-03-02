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
  wechat_id?: string
  /** 所在城市 */
  city?: string
  /** 职业 */
  occupation?: string
  /** 申请理由 */
  apply_reason?: string
  /** 对天道文化的理解 */
  understanding?: string
  /** 是否愿意帮助他人 */
  willing_help?: number
  /** 推广计划 */
  promotion_plan?: string
  /** 目标等级（camelCase）：1=准青鸾, 2=青鸾, 3=鸿鹄, 4=金凤 */
  targetLevel?: number
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
 * 升级权益文案条目
 */
export interface UpgradeBenefitItem {
  /** 权益标题 */
  title: string
  /** 权益说明（支持 HTML 富文本） */
  desc: string
}

/**
 * 申请列表文案条目（大使申请页动态问题）
 */
export interface ApplyQuestion {
  /** 问题文本 */
  question: string
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
    /** 后台配置的升级权益文案（优先于 benefits 展示） */
    upgrade_benefits: UpgradeBenefitItem[] | null
    /** 后台配置的申请列表文案（大使申请页动态问题） */
    apply_questions: ApplyQuestion[] | null
  }
  /** 升级选项 */
  upgrade_options: Array<{
    type: 'payment' | 'contract'
    name: string
    eligible: boolean
    /** 该步骤是否已完成（已支付 / 已签署） */
    completed?: boolean
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
  /**
   * 用户针对目标等级的申请状态
   * null=未申请, 0=待审核, 1=待面试, 2=已通过, 3=已拒绝
   */
  application_status: number | null
  /** 拒绝原因（application_status=3 时有值） */
  application_reject_reason: string | null
  /** 申请记录 ID */
  application_id: number | null
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
  /** 分享文案，格式：'我是{姓名}大使，邀请您一起学习！' */
  share_text: string
  expires_at: null
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
 * 协议内容已改为电子合同文件（PDF/Word），通过 contract_file_url 下载查看
 */
export interface ContractTemplate {
  /** 模板ID */
  id: number
  /** 协议标题 */
  title: string
  /** 版本号 */
  version: string
  /** 大使等级 */
  level: number
  /** 等级名称 */
  level_name: string
  /** 关联课程ID（课程学习协议时使用） */
  course_id?: number
  /** 有效期（年） */
  validity_years?: number
  /** 生效日期 */
  effective_date?: string | null
  /** 电子合同文件 URL（PDF/Word，用于下载查看） */
  contract_file_url: string | null
}

/**
 * 签署协议请求参数
 */
export interface SignContractParams {
  /** 协议模板ID（camelCase 兼容） */
  templateId?: number
  /** 协议模板ID */
  template_id?: number
  /** 手写签名图片的 cloud:// fileID */
  signatureFileId: string
  /** 是否同意协议（必填 true） */
  agreed: boolean
  /** 身份证号码，用于注入 Word 合同头部「身份证号码」字段 */
  idNumber?: string
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
  expire_at?: string
  /** 合同开始日期 */
  effective_date?: string
  /** 合同结束日期 */
  expiry_date?: string
  /** 电子合同文件 URL（PDF/Word，用于下载查看） */
  contract_file_url?: string | null
}

/**
 * 协议详情
 * 协议内容已改为电子合同文件，通过 contract_file_url 下载查看
 */
export interface ContractDetail {
  /** 协议签署记录 */
  signature: {
    id: number
    template_id: number
    contract_name: string
    ambassador_level: number
    contract_version: string
    contract_file_url: string | null
    sign_time: string
    contract_start: string
    contract_end: string
    status: number
    status_text: string
    sign_ip?: string
    sign_device?: string
    effective_time?: string
  }
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
 * 活动类型枚举
 */
export enum ActivityType {
  /** 辅导员 */
  TUTOR = 1,
  /** 会务义工 */
  VOLUNTEER = 2,
  /** 沙龙组织 */
  SALON = 3,
  /** 其他活动 */
  OTHER = 4
}

/**
 * 活动记录
 */
export interface ActivityRecord {
  /** 活动记录ID */
  id: number
  /** 活动类型 */
  activity_type: ActivityType
  /** 活动名称 */
  activity_name: string
  /** 活动描述 */
  activity_desc: string | null
  /** 活动地点 */
  location: string | null
  /** 活动开始时间 */
  start_time: string
  /** 活动时长 */
  duration: string | null
  /** 参与人数 */
  participant_count: number | null
  /** 获得功德分 */
  merit_points: number
  /** 活动备注 */
  note: string | null
  /** 创建时间 */
  created_at: string
}

/**
 * 活动统计信息
 */
export interface ActivityStats {
  /** 累计活动次数 */
  total_count: number
  /** 累计功德分 */
  total_merit_points: number
  /** 本月活动次数 */
  month_count: number
  /** 活动类型统计 */
  type_stats: {
    [key: number]: number
  }
}

/**
 * 获取活动记录请求参数
 */
export interface GetActivityRecordsParams extends PaginationParams {
  /** 活动类型筛选：0全部/1辅导员/2义工/3沙龙/4其他 */
  activityType?: number
}

/**
 * 获取活动记录响应数据
 */
export interface GetActivityRecordsResponse extends PaginationResponse<ActivityRecord> {
  /** 统计信息 */
  stats: ActivityStats
}

/**
 * 推荐统计信息
 */
export interface ReferralStats {
  /** 总推荐人数 */
  total_referrals: number
  /** 成为大使时间 */
  ambassador_start_date: string | null
  /** 累计活动次数 */
  total_activity_count: number
}

// 兼容旧的类型定义
export interface Activity {
  id: number
  user_id: number
  activity_type: string
  activity_name: string
  description: string
  points_earned: number
  created_at: string
}

export interface GetActivityListParams extends PaginationParams {
  activity_type?: string
}

export interface GetActivityListResponse extends PaginationResponse<Activity> {}

/**
 * 大使等级配置信息
 */
export interface LevelConfig {
  /** 等级ID */
  id: number
  /** 等级值（0-普通用户，1-准青鸾，2-青鸾，3-鸿鹄） */
  level: number
  /** 等级名称 */
  level_name: string
  /** 等级图标 */
  level_icon?: string
  /** 等级描述（支持 HTML 富文本，小程序等级体系页展示） */
  level_desc?: string
  /** 升级条件列表 */
  upgrade_conditions?: string[]
  /** 等级权益列表 */
  benefits?: string[]
  /** 后台配置的升级权益文案（{title, desc} 数组，小程序升级指南页展示） */
  upgrade_benefits?: UpgradeBenefitItem[] | null
  /** 后台配置的申请列表文案（{question} 数组，大使申请页动态问题） */
  apply_questions?: ApplyQuestion[] | null
  /** 推荐初探班功德分比例 */
  merit_rate_basic?: number
  /** 推荐密训班功德分比例 */
  merit_rate_advanced?: number
  /** 推荐初探班可提现积分比例 */
  cash_rate_basic?: number
  /** 推荐密训班可提现积分比例 */
  cash_rate_advanced?: number
  /** 升级时发放的冻结积分 */
  frozen_points?: number
  /** 每次推荐解冻积分金额 */
  unfreeze_per_referral?: number
  /** 支付升级所需金额 */
  upgrade_payment_amount?: number
  /** 升级赠送初探班名额 */
  gift_quota_basic?: number
  /** 升级赠送密训班名额 */
  gift_quota_advanced?: number
  /** 是否可获得推荐奖励 */
  can_earn_reward?: boolean
  /** 状态 */
  status?: number
}

/**
 * 大使等级体系响应数据
 */
export interface LevelSystemResponse {
  /** 等级配置列表 */
  levels: LevelConfig[]
  /** 当前用户等级 */
  current_level?: number
  /** 下一等级 */
  next_level?: LevelConfig | null
}

/**
 * 活动岗位
 */
export interface ActivityPosition {
  /** 岗位名称 */
  name: string
  /** 总名额 */
  quota: number
  /** 功德分奖励 */
  merit_points: number
  /** 已报名人数 */
  registered_count: number
  /** 剩余名额 */
  remaining: number
  /** 报名门槛等级（对应ambassador_level_configs.level），null表示无限制 */
  required_level: number | null
  /** 门槛等级名称（用于展示，如"青鸾大使"） */
  required_level_name: string | null
  /** 当前用户是否满足报名条件 */
  can_apply: boolean
}

/**
 * 可报名活动（新版）
 */
export interface AvailableActivity {
  /** 活动ID */
  id: number
  /** 关联排期ID */
  schedule_id: number
  /** 排期名称 */
  schedule_name: string
  /** 排期日期 */
  schedule_date: string
  /** 排期地点 */
  schedule_location: string | null
  /** 活动岗位列表 */
  positions: ActivityPosition[]
  /** 活动状态 1=报名中 */
  status: number
  /** 当前用户的大使等级 */
  user_level: number
  /** 当前用户的报名信息（null表示未报名） */
  my_registration: {
    position_name: string
    status: number
  } | null
}

/**
 * 获取可报名活动请求参数
 */
export interface GetAvailableActivitiesParams {
  page?: number
  pageSize?: number
}

/**
 * 申请报名活动参数（camelCase）
 */
export interface ApplyForActivityParams {
  /** 活动ID */
  activityId: number
  /** 报名岗位名称 */
  positionName: string
}

/**
 * 用户当前全局有效报名（跨活动唯一报名）
 */
export interface MyActiveRegistration {
  /** 报名记录ID */
  registration_id: number
  /** 活动ID */
  activity_id: number
  /** 活动名称 */
  activity_name: string
  /** 已报名的岗位名称 */
  position_name: string
  /** 活动排期日期 */
  schedule_date: string
  /** 活动地点 */
  schedule_location: string
}

/**
 * 取消报名活动参数
 */
export interface CancelActivityRegistrationParams {
  /** 活动ID */
  activityId: number
}

/**
 * 获取可报名活动响应（含全局报名状态）
 */
export interface AvailableActivitiesResult {
  list: AvailableActivity[]
  total: number
  /** 用户当前全局有效报名（null 表示无有效报名） */
  my_active_registration: MyActiveRegistration | null
}

/**
 * 检查课程合同签署状态的返回结果
 */
export interface CheckCourseContractResult {
  needSign: boolean
  hasTemplate: boolean
  templateId?: number
  reason?: string
}

/**
 * 签署课程学习服务协议的参数
 */
export interface SignCourseContractParams {
  courseId: number
  templateId: number
  signatureFileId: string
  agreed: boolean
  idNumber?: string
}