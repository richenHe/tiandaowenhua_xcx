/**
 * 系统模块类型定义
 */

import type { PaginationParams, PaginationResponse } from '../types'

/**
 * 反馈类型
 */
export interface FeedbackType {
  /** 类型值 */
  value: number
  /** 类型标签 */
  label: string
  /** 图标 */
  icon: string
}

/**
 * 可反馈的课程
 */
export interface FeedbackCourse {
  /** 课程ID */
  id: number
  /** 课程名称 */
  name: string
  /** 封面图片 */
  cover_image: string
  /** 课程类型 */
  type: number
}

/**
 * 提交反馈请求参数
 */
export interface SubmitFeedbackParams {
  /** 反馈类型（1-5） */
  type: number
  /** 课程ID */
  course_id?: number
  /** 反馈内容 */
  content: string
  /** 图片列表 */
  images?: string[]
  /** 联系方式 */
  contact?: string
}

/**
 * 提交反馈响应数据
 */
export interface SubmitFeedbackResponse {
  id: number
  created_at: string
}

/**
 * 反馈记录
 */
export interface Feedback {
  /** 反馈ID */
  id: number
  /** 反馈类型 */
  type: number
  /** 类型文本 */
  type_text: string
  /** 课程ID */
  course_id: number | null
  /** 课程信息 */
  course?: {
    name: string
  }
  /** 反馈内容 */
  content: string
  /** 图片列表 */
  images: string[]
  /** 状态（0-待处理，1-已回复，2-已关闭） */
  status: number
  /** 状态文本 */
  status_text: string
  /** 回复内容 */
  reply_content: string | null
  /** 回复时间 */
  reply_at: string | null
  /** 创建时间 */
  created_at: string
}

/**
 * 获取我的反馈列表请求参数
 */
export interface GetMyFeedbackParams extends PaginationParams {}

/**
 * 获取我的反馈列表响应数据
 */
export interface GetMyFeedbackResponse extends PaginationResponse<Feedback> {}

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 配置ID */
  id: number
  /** 通知名称 */
  name: string
  /** 通知描述 */
  description: string
  /** 模板ID */
  template_id: string
  /** 场景标识 */
  scene: string
  /** 是否必需（1-必需，0-可选） */
  required: number
  /** 是否已订阅 */
  subscribed: boolean
  /** 是否可取消订阅 */
  can_unsubscribe: boolean
}

/**
 * 订阅通知请求参数
 */
export interface SubscribeNotificationParams {
  /** 通知配置ID */
  config_id: number
  /** 是否订阅 */
  subscribed: boolean
}

/**
 * 订阅通知响应数据
 */
export interface SubscribeNotificationResponse {
  config_id: number
  subscribed: boolean
}

/**
 * 公告信息
 */
export interface Announcement {
  /** 公告ID */
  id: number
  /** 公告标题 */
  title: string
  /** 公告内容 */
  content: string
  /** 公告摘要 */
  summary?: string
  /** 封面图片 */
  cover_image?: string
  /** 分类 */
  category: string
  /** 分类文本 */
  category_text?: string
  /** 目标用户类型 */
  target_type: number
  /** 目标用户文本 */
  target_type_text?: string
  /** 是否置顶 */
  is_top: number
  /** 开始时间 */
  start_time?: string
  /** 结束时间 */
  end_time?: string
  /** 浏览次数 */
  view_count: number
  /** 排序 */
  sort_order: number
  /** 发布状态（0-草稿，1-已发布） */
  status: number
  /** 发布时间 */
  published_at: string | null
  /** 创建时间 */
  created_at: string
}

/**
 * 获取公告列表请求参数
 */
export interface GetAnnouncementListParams extends PaginationParams {
  /** 类型筛选 */
  type?: string
  /** 状态筛选 */
  status?: number
}

/**
 * 获取公告列表响应数据
 */
export interface GetAnnouncementListResponse extends PaginationResponse<Announcement> {}

/**
 * 轮播图信息
 */
export interface Banner {
  /** 轮播图ID */
  id: number
  /** 标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 封面图片 */
  cover_image: string
  /** 跳转链接 */
  link?: string
  /** 排序 */
  sort_order: number
}

/**
 * 获取轮播图列表响应数据
 */
export interface GetBannerListResponse {
  list: Banner[]
}

/**
 * 用户积分信息
 */
export interface UserPoints {
  /** 功德积分 */
  meritPoints: number
  /** 可用现金积分 */
  cashPointsAvailable: number
  /** 冻结现金积分 */
  cashPointsFrozen: number
  /** 待结算现金积分 */
  cashPointsPending: number
}

/**
 * 系统配置项
 */
export interface SystemConfig {
  /** 配置值 */
  value: any
  /** 配置描述 */
  description: string
  /** 值类型 */
  value_type: string
}

/**
 * 系统配置集合
 */
export interface SystemConfigs {
  [key: string]: SystemConfig
}

/**
 * 大使等级配置
 */
export interface AmbassadorLevelConfig {
  /** 等级 */
  level: number
  /** 等级名称 */
  name: string
  /** 佣金比例 */
  commission_rate: number
  /** 推广名额 */
  quotas: number
  /** 升级条件 */
  upgrade_conditions: {
    payment_amount?: number
    required_level?: number
  }
  /** 权益说明 */
  benefits: string
}

/**
 * 统计数据
 */
export interface Statistics {
  /** 用户统计 */
  users: {
    total: number
    new_today: number
    new_this_week: number
    new_this_month: number
  }
  /** 订单统计 */
  orders: {
    total: number
    paid: number
    pending: number
    total_amount: number
  }
  /** 课程统计 */
  courses: {
    total: number
    active: number
    total_students: number
  }
  /** 大使统计 */
  ambassadors: {
    total: number
    by_level: {
      [level: number]: number
    }
  }
}

/**
 * 管理员信息
 */
export interface AdminUser {
  /** 管理员ID */
  id: number
  /** 用户名 */
  username: string
  /** 真实姓名 */
  real_name: string
  /** 角色 */
  role: string
  /** 权限列表 */
  permissions: string[]
  /** 状态（1-启用，0-禁用） */
  status: number
  /** 创建时间 */
  created_at: string
}

/**
 * 管理员登录请求参数
 */
export interface AdminLoginParams {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
}

/**
 * 管理员登录响应数据
 */
export interface AdminLoginResponse {
  token: string
  admin: AdminUser
}
