/**
 * 课程模块 API
 */

import { callCloudFunction } from '../request'
import type {
  Course,
  GetCourseListParams,
  GetCourseListResponse,
  ClassRecord,
  GetClassRecordsParams,
  CreateAppointmentParams,
  CreateAppointmentResponse,
  CancelAppointmentParams,
  GetMyAppointmentsParams,
  GetMyAppointmentsResponse,
  CheckinParams,
  Case,
  GetCaseListParams,
  GetCaseListResponse,
  Material,
  GetMaterialListParams,
  GetMaterialListResponse,
  AcademyContent,
  AcademyProgress,
  RecordAcademyProgressParams,
  CalendarData,
  GetCalendarScheduleParams
} from '../types/course'

/**
 * 课程模块 API 类
 */
export class CourseApi {
  // ==================== 公开接口 ====================

  /**
   * 1. 获取课程列表
   * @param params 查询参数
   * @returns 课程列表
   */
  static async getList(params?: GetCourseListParams): Promise<GetCourseListResponse> {
    return callCloudFunction<GetCourseListResponse>({
      name: 'course',
      action: 'getList',
      data: params,
      showLoading: false
    })
  }

  /**
   * 2. 获取课程详情
   * @param id 课程ID
   * @returns 课程详情
   */
  static async getDetail(id: number): Promise<Course> {
    return callCloudFunction<Course>({
      name: 'course',
      action: 'getDetail',
      data: { id },
      showLoading: false
    })
  }

  /**
   * 3. 获取案例列表
   * @param params 查询参数
   * @returns 案例列表
   */
  static async getCaseList(params?: GetCaseListParams): Promise<GetCaseListResponse> {
    return callCloudFunction<GetCaseListResponse>({
      name: 'course',
      action: 'getCaseList',
      data: params,
      showLoading: false
    })
  }

  /**
   * 4. 获取案例详情
   * @param id 案例ID
   * @returns 案例详情
   */
  static async getCaseDetail(id: number): Promise<Case> {
    return callCloudFunction<Case>({
      name: 'course',
      action: 'getCaseDetail',
      data: { id },
      showLoading: false
    })
  }

  /**
   * 5. 获取资料列表
   * @param params 查询参数
   * @returns 资料列表
   */
  static async getMaterialList(params?: GetMaterialListParams): Promise<GetMaterialListResponse> {
    return callCloudFunction<GetMaterialListResponse>({
      name: 'course',
      action: 'getMaterialList',
      data: params,
      showLoading: false
    })
  }

  /**
   * 6. 获取商学院介绍列表
   * @returns 商学院介绍列表
   */
  static async getAcademyList(): Promise<AcademyContent[]> {
    return callCloudFunction<AcademyContent[]>({
      name: 'course',
      action: 'getAcademyList',
      showLoading: false
    })
  }

  /**
   * 7. 获取商学院介绍详情
   * @param id 介绍ID
   * @returns 商学院介绍详情
   */
  static async getAcademyDetail(id: number): Promise<AcademyContent> {
    return callCloudFunction<AcademyContent>({
      name: 'course',
      action: 'getAcademyDetail',
      data: { id },
      showLoading: false
    })
  }

  /**
   * 8. 获取日历排课数据
   * @param params 查询参数（开始日期和结束日期）
   * @returns 日历数据
   */
  static async getCalendarSchedule(params: GetCalendarScheduleParams): Promise<CalendarData> {
    return callCloudFunction<CalendarData>({
      name: 'course',
      action: 'getCalendarSchedule',
      data: params,
      showLoading: false
    })
  }

  // ==================== 客户端接口 ====================

  /**
   * 9. 获取上课排期列表
   * @param params 查询参数
   * @returns 上课排期列表
   */
  static async getClassRecords(params: GetClassRecordsParams): Promise<ClassRecord[]> {
    return callCloudFunction<ClassRecord[]>({
      name: 'course',
      action: 'getClassRecords',
      data: params,
      showLoading: false
    })
  }

  /**
   * 10. 创建预约
   * @param params 预约参数
   * @returns 预约信息
   */
  static async createAppointment(params: CreateAppointmentParams): Promise<CreateAppointmentResponse> {
    return callCloudFunction<CreateAppointmentResponse>({
      name: 'course',
      action: 'createAppointment',
      data: params,
      loadingText: '预约中...'
    })
  }

  /**
   * 10. 取消预约
   * @param params 取消参数
   * @returns 取消结果
   */
  static async cancelAppointment(params: CancelAppointmentParams): Promise<{ message: string }> {
    return callCloudFunction<{ message: string }>({
      name: 'course',
      action: 'cancelAppointment',
      data: params,
      loadingText: '取消中...'
    })
  }

  /**
   * 11. 获取我的预约列表
   * @param params 查询参数
   * @returns 预约列表
   */
  static async getMyAppointments(params?: GetMyAppointmentsParams): Promise<GetMyAppointmentsResponse> {
    return callCloudFunction<GetMyAppointmentsResponse>({
      name: 'course',
      action: 'getMyAppointments',
      data: params,
      showLoading: false
    })
  }

  /**
   * 12. 签到
   * @param params 签到参数
   * @returns 签到结果
   */
  static async checkin(params: CheckinParams): Promise<{ message: string }> {
    return callCloudFunction<{ message: string }>({
      name: 'course',
      action: 'checkin',
      data: params,
      loadingText: '签到中...'
    })
  }

  /**
   * 13. 记录商学院学习进度
   * @param params 学习进度参数
   * @returns 记录结果
   */
  static async recordAcademyProgress(params: RecordAcademyProgressParams): Promise<{ message: string }> {
    return callCloudFunction<{ message: string }>({
      name: 'course',
      action: 'recordAcademyProgress',
      data: params,
      showLoading: false
    })
  }

  /**
   * 14. 获取商学院学习进度
   * @returns 学习进度列表
   */
  static async getAcademyProgress(): Promise<AcademyProgress[]> {
    return callCloudFunction<AcademyProgress[]>({
      name: 'course',
      action: 'getAcademyProgress',
      showLoading: false
    })
  }
}

// 导出单个方法（便于按需导入）
export const {
  getList,
  getDetail,
  getCaseList,
  getCaseDetail,
  getMaterialList,
  getAcademyList,
  getAcademyDetail,
  getCalendarSchedule,
  getClassRecords,
  createAppointment,
  cancelAppointment,
  getMyAppointments,
  checkin,
  recordAcademyProgress,
  getAcademyProgress
} = CourseApi

// 默认导出
export default CourseApi
