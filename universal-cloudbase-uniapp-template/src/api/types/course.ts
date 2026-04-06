/**
 * 课程模块类型定义
 */

import type { PaginationParams, PaginationResponse } from '../types'

/** 课程简介/大纲图文块（DB JSON；详情接口图片字段已为 HTTPS） */
export type CourseRichBlock =
  | { type: 'text'; text?: string }
  | { type: 'image'; image?: string }

/**
 * 课程信息
 */
export interface Course {
  /** 课程ID */
  id: number
  /** 课程名称 */
  name: string
  /** 课程昵称 */
  nickname?: string
  /** 课程类型（1-初探班，2-深研班，3-复训） */
  type: number
  /** 封面图片 */
  cover_image: string
  /** 原价 */
  original_price: number
  /** 当前价格 */
  current_price: number
  /** 课程简介 */
  description: string
  /** 课程简介图文块 JSON（详情接口返回，图片已为 CDN URL） */
  description_blocks?: CourseRichBlock[]
  /** 课程详细内容 */
  content?: string
  /** 课程大纲 */
  outline?: string | string[]
  /** 课程大纲图文块 JSON */
  outline_blocks?: CourseRichBlock[]
  /** 课程时长 */
  duration?: string
  /** 授课老师 */
  teacher?: string
  /** 允许复训 */
  allow_retrain?: boolean
  /** 包含的课程ID */
  included_course_ids?: number[]
  /** 库存（-1表示无限） */
  stock?: number
  /** 已售数量 */
  sold_count?: number
  /** 排序 */
  sort_order?: number
  /** 状态（1-上架，0-下架） */
  status: number
  /** 创建时间 */
  created_at?: string
  /** 更新时间 */
  updated_at?: string
  /** 是否已购买（前端使用） */
  is_purchased?: boolean
  /** 用户课程ID（前端使用） */
  user_course_id?: number | null
  /** 上课次数（前端使用） */
  attend_count?: number
  /** 购买日期（前端使用） */
  purchase_date?: string
  /** 类型名称（前端使用） */
  type_name?: string
}

/**
 * 上课排期
 */
export interface ClassRecord {
  /** 排期ID */
  id: number
  /** 课程ID */
  course_id: number
  /** 课程名称 */
  course_name: string
  /** 该排期复训费（0=本排期免费复训） */
  retrain_price?: number
  /** 上课日期 */
  class_date?: string
  /** 结课日期（NULL 表示单日课，与 class_date 相同理解） */
  class_end_date?: string | null
  /** 上课时段 */
  class_time?: string
  /** 当天开始时刻（由 class_time 解析，如 09:00） */
  start_time: string
  /** 当天结束时刻（由 class_time 解析，如 17:00） */
  end_time: string
  /** 上课地点 */
  location: string
  /** 总名额 */
  total_quota: number
  /** 已预约名额 */
  booked_quota: number
  /** 可用名额 */
  available_quota: number
  /** 授课老师 */
  teacher?: string
  /** 状态 */
  status: number
}

/**
 * 预约信息
 */
export interface Appointment {
  /** 预约ID */
  id: number
  /** 上课排期ID */
  class_record_id: number
  /** 课程ID */
  course_id?: number
  /** 课程名称 */
  course_name: string
  /** 课程类型 */
  course_type?: number
  /** 开始时间 */
  start_time: string
  /** 上课时段 */
  class_time?: string
  /** 上课日期 */
  class_date?: string
  /** 结课日期 */
  class_end_date?: string
  /** 上课地点 */
  location: string
  /** 授课老师 */
  teacher?: string
  /** 是否沙龙课程 */
  is_salon?: boolean
  /** 状态：非沙龙 0进行中/1已结课/3已取消；沙龙 0待上课/1已签到/2缺席/3已取消 */
  status: number
  /** 状态文本 */
  status_name?: string
  /** 状态文本（兼容旧字段） */
  status_text?: string
  /** 签到时间 */
  checkin_time?: string | null
  /** 今日是否已签到（非沙龙课程） */
  today_checked_in?: boolean
  /** 是否有过任何签到记录（非沙龙课程） */
  has_ever_checked_in?: boolean
}

/**
 * 案例信息
 */
export interface Case {
  /** 案例ID */
  id: number
  /** 案例标题 */
  title: string
  /** 案例分类 (entrepreneur/startup/workplace) */
  category: string
  /** 案例分类标签名称 */
  category_label?: string
  /** 徽章主题色 (warning/success/primary) */
  badge_theme?: string
  /** 学员姓氏（如：王） */
  student_surname?: string
  /** 学员姓名 */
  student_name: string
  /** 学员描述 */
  student_desc?: string
  /** 学员头像（CDN URL） */
  student_avatar?: string
  /** 学员头衔/职业 */
  student_title?: string
  /** 头像主题色 (default/success/primary) */
  avatar_theme?: string
  /** 封面图片（派生字段，取 images[0]） */
  cover_image?: string
  /** 案例摘要 */
  summary: string
  /** 案例内容（HTML） */
  content?: string
  /** 学习感悟（引用文字） */
  quote?: string
  /** 成果列表 */
  achievements?: string[]
  /** 视频 URL（CDN URL） */
  video_url?: string
  /** 图片列表（CDN URL 数组） */
  images?: string[]
  /** 关联课程ID */
  course_id?: number
  /** 关联课程名称 */
  course_name?: string
  /** 浏览次数 */
  view_count?: number
  /** 点赞次数 */
  like_count?: number
  /** 是否精选 (0/1) */
  is_featured?: number
  /** 排序权重 */
  sort_order?: number
  /** 创建时间 */
  created_at: string
}

/**
 * 学习资料/朋友圈素材
 */
export interface Material {
  /** 资料ID */
  id: number
  /** 资料标题 */
  title: string
  /** 资料分类（poster-海报/copywriting-文案/video-视频） */
  category: string
  /** 图片URL */
  image_url?: string
  /** 视频URL */
  video_url?: string
  /** 文案内容 */
  content?: string
  /** 标签列表 */
  tags?: string[]
  /** 浏览次数 */
  view_count?: number
  /** 下载次数 */
  download_count?: number
  /** 分享次数 */
  share_count?: number
  /** 排序权重 */
  sort_order?: number
  /** 创建时间 */
  created_at: string
}

/**
 * 商学院内容
 */
export interface AcademyContent {
  /** 内容ID */
  id: number
  /** 标题 */
  title: string
  /** 类型 */
  type: string
  /** 封面图片 */
  cover_image: string
  /** 内容 */
  content?: string
  /** 排序 */
  sort_order: number
}

/**
 * 商学院学习进度
 */
export interface AcademyProgress {
  /** 内容ID */
  content_id: number
  /** 内容标题 */
  content_title: string
  /** 学习进度（0-100） */
  progress: number
  /** 学习时长（秒） */
  duration: number
  /** 最后学习时间 */
  last_study_at: string
}

/**
 * 获取课程列表请求参数
 */
export interface GetCourseListParams extends PaginationParams {
  /** 课程类型筛选 */
  type?: number
}

/**
 * 获取课程列表响应数据
 */
export interface GetCourseListResponse extends PaginationResponse<Course> {}

/**
 * 获取上课排期请求参数
 */
export interface GetClassRecordsParams {
  /** 课程ID */
  course_id: number
}

/**
 * 创建预约请求参数
 */
export interface CreateAppointmentParams {
  /** 上课排期ID */
  class_record_id: number
}

/**
 * 创建预约响应数据
 */
export interface CreateAppointmentResponse {
  id: number
  class_record_id: number
  status: number
  created_at: string
}

/**
 * 取消预约请求参数
 */
export interface CancelAppointmentParams {
  /** 预约ID */
  id: number
}

/**
 * 获取我的预约列表请求参数
 */
export interface GetMyAppointmentsParams extends PaginationParams {
  /** 状态筛选 */
  status?: number
}

/**
 * 获取我的预约列表响应数据
 */
export interface GetMyAppointmentsResponse extends PaginationResponse<Appointment> {}

/**
 * 签到请求参数
 */
export interface CheckinParams {
  /** 预约ID */
  appointment_id: number
  /** 签到码 */
  checkin_code?: string
}

/**
 * 记录商学院学习进度请求参数
 */
export interface RecordAcademyProgressParams {
  /** 内容ID */
  content_id: number
  /** 学习进度（0-100） */
  progress: number
  /** 学习时长（秒） */
  duration?: number
}

/**
 * 获取案例列表请求参数
 */
export interface GetCaseListParams extends PaginationParams {
  /** 案例分类 */
  category?: string
}

/**
 * 获取案例列表响应数据
 */
export interface GetCaseListResponse extends PaginationResponse<Case> {}

/**
 * 获取资料列表请求参数
 */
export interface GetMaterialListParams extends PaginationParams {
  /** 资料分类（poster-海报/copywriting-文案/video-视频） */
  category?: string
  /** 关键词搜索 */
  keyword?: string
}

/**
 * 获取资料列表响应数据
 */
export interface GetMaterialListResponse extends PaginationResponse<Material> {}

/**
 * 日历课程信息
 */
export interface CalendarCourseInfo {
  /** 课程ID */
  courseId: number
  /** 课程昵称 */
  nickname: string
  /** 课程名称 */
  courseName: string
  /** 上课时间 */
  classTime: string
  /** 排期ID */
  classRecordId: number
}

/**
 * 日历数据（key为日期字符串，value为课程信息）
 */
export type CalendarData = Record<string, CalendarCourseInfo>

/**
 * 获取日历排课请求参数
 */
export interface GetCalendarScheduleParams {
  /** 开始日期 YYYY-MM-DD */
  startDate: string
  /** 结束日期 YYYY-MM-DD */
  endDate: string
}
