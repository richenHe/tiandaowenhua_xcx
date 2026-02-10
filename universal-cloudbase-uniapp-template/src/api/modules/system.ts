/**
 * 系统模块 API
 */

import { callCloudFunction } from '../request'
import type {
  FeedbackType,
  FeedbackCourse,
  SubmitFeedbackParams,
  SubmitFeedbackResponse,
  GetMyFeedbackParams,
  GetMyFeedbackResponse,
  NotificationConfig,
  SubscribeNotificationParams,
  SubscribeNotificationResponse,
  Announcement,
  GetAnnouncementListParams,
  GetAnnouncementListResponse
} from '../types/system'

/**
 * 系统模块 API 类
 */
export class SystemApi {
  // ==================== 客户端接口 ====================

  /**
   * 1. 获取可反馈的课程列表
   * @returns 课程列表
   */
  static async getFeedbackCourses(): Promise<FeedbackCourse[]> {
    return callCloudFunction<FeedbackCourse[]>({
      name: 'system',
      action: 'getFeedbackCourses',
      showLoading: false
    })
  }

  /**
   * 2. 获取反馈类型列表
   * @returns 反馈类型列表
   */
  static async getFeedbackTypes(): Promise<FeedbackType[]> {
    return callCloudFunction<FeedbackType[]>({
      name: 'system',
      action: 'getFeedbackTypes',
      showLoading: false
    })
  }

  /**
   * 3. 提交反馈
   * @param params 反馈参数
   * @returns 提交结果
   */
  static async submitFeedback(params: SubmitFeedbackParams): Promise<SubmitFeedbackResponse> {
    return callCloudFunction<SubmitFeedbackResponse>({
      name: 'system',
      action: 'submitFeedback',
      data: params,
      loadingText: '提交中...'
    })
  }

  /**
   * 4. 获取我的反馈列表
   * @param params 查询参数
   * @returns 反馈列表
   */
  static async getMyFeedback(params?: GetMyFeedbackParams): Promise<GetMyFeedbackResponse> {
    return callCloudFunction<GetMyFeedbackResponse>({
      name: 'system',
      action: 'getMyFeedback',
      data: params,
      showLoading: false
    })
  }

  /**
   * 5. 获取通知配置列表
   * @returns 通知配置列表
   */
  static async getNotificationConfigs(): Promise<NotificationConfig[]> {
    return callCloudFunction<NotificationConfig[]>({
      name: 'system',
      action: 'getNotificationConfigs',
      showLoading: false
    })
  }

  /**
   * 6. 订阅/取消订阅通知
   * @param params 订阅参数
   * @returns 订阅结果
   */
  static async subscribeNotification(params: SubscribeNotificationParams): Promise<SubscribeNotificationResponse> {
    return callCloudFunction<SubscribeNotificationResponse>({
      name: 'system',
      action: 'subscribeNotification',
      data: params,
      loadingText: '操作中...'
    })
  }

  /**
   * 7. 获取公告列表
   * @param params 查询参数
   * @returns 公告列表
   */
  static async getAnnouncementList(params?: GetAnnouncementListParams): Promise<GetAnnouncementListResponse> {
    return callCloudFunction<GetAnnouncementListResponse>({
      name: 'system',
      action: 'getAnnouncementList',
      data: params,
      showLoading: false
    })
  }

  /**
   * 8. 获取公告详情
   * @param id 公告ID
   * @returns 公告详情
   */
  static async getAnnouncementDetail(id: number): Promise<Announcement> {
    return callCloudFunction<Announcement>({
      name: 'system',
      action: 'getAnnouncementDetail',
      data: { id },
      showLoading: false
    })
  }
}

// 导出单个方法（便于按需导入）
export const {
  getFeedbackCourses,
  getFeedbackTypes,
  submitFeedback,
  getMyFeedback,
  getNotificationConfigs,
  subscribeNotification,
  getAnnouncementList,
  getAnnouncementDetail
} = SystemApi

// 默认导出
export default SystemApi
