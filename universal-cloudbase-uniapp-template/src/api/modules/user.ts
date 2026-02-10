/**
 * 用户模块 API
 */

import { callCloudFunction } from '../request'
import type {
  LoginParams,
  LoginResponse,
  UserProfile,
  UpdateProfileParams,
  UpdateProfileResponse,
  UpdateRefereeParams,
  RefereeInfo,
  MeritPointsInfo,
  GetMeritPointsHistoryParams,
  GetMeritPointsHistoryResponse,
  CashPointsInfo,
  GetCashPointsHistoryParams,
  GetCashPointsHistoryResponse,
  ApplyWithdrawParams,
  GetWithdrawRecordsParams,
  GetWithdrawRecordsResponse,
  GetRefereesParams,
  GetRefereesResponse,
  GetMyCoursesParams,
  GetMyCoursesResponse,
  GetMyOrdersParams,
  GetMyOrdersResponse
} from '../types/user'

/**
 * 用户模块 API 类
 */
export class UserApi {
  /**
   * 1. 微信登录/注册
   * @param params 登录参数
   * @returns 用户信息
   */
  static async login(params?: LoginParams): Promise<LoginResponse> {
    return callCloudFunction<LoginResponse>({
      name: 'user',
      action: 'login',
      data: params,
      loadingText: '登录中...'
    })
  }

  /**
   * 2. 获取个人资料
   * @returns 用户资料
   */
  static async getProfile(): Promise<UserProfile> {
    return callCloudFunction<UserProfile>({
      name: 'user',
      action: 'getProfile',
      showLoading: false
    })
  }

  /**
   * 3. 更新个人资料
   * @param params 更新参数
   * @returns 更新结果
   */
  static async updateProfile(params: UpdateProfileParams): Promise<UpdateProfileResponse> {
    return callCloudFunction<UpdateProfileResponse>({
      name: 'user',
      action: 'updateProfile',
      data: params,
      loadingText: '保存中...'
    })
  }

  /**
   * 4. 修改推荐人
   * @param params 修改参数
   * @returns 修改结果
   */
  static async updateReferee(params: UpdateRefereeParams): Promise<{ message: string }> {
    return callCloudFunction<{ message: string }>({
      name: 'user',
      action: 'updateReferee',
      data: params,
      loadingText: '修改中...'
    })
  }

  /**
   * 5. 获取推荐人信息
   * @param referralCode 推荐码
   * @returns 推荐人信息
   */
  static async getRefereeInfo(referralCode: string): Promise<RefereeInfo> {
    return callCloudFunction<RefereeInfo>({
      name: 'user',
      action: 'getRefereeInfo',
      data: { referralCode },
      showLoading: false
    })
  }

  /**
   * 6. 获取我的课程列表
   * @param params 分页参数
   * @returns 课程列表
   */
  static async getMyCourses(params?: GetMyCoursesParams): Promise<GetMyCoursesResponse> {
    return callCloudFunction<GetMyCoursesResponse>({
      name: 'user',
      action: 'getMyCourses',
      data: params,
      showLoading: false
    })
  }

  /**
   * 7. 获取我的订单列表
   * @param params 分页参数
   * @returns 订单列表
   */
  static async getMyOrders(params?: GetMyOrdersParams): Promise<GetMyOrdersResponse> {
    return callCloudFunction<GetMyOrdersResponse>({
      name: 'user',
      action: 'getMyOrders',
      data: params,
      showLoading: false
    })
  }

  /**
   * 8. 获取功德分余额
   * @returns 功德分信息
   */
  static async getMeritPoints(): Promise<MeritPointsInfo> {
    return callCloudFunction<MeritPointsInfo>({
      name: 'user',
      action: 'getMeritPoints',
      showLoading: false
    })
  }

  /**
   * 9. 获取功德分明细
   * @param params 分页参数
   * @returns 功德分明细列表
   */
  static async getMeritPointsHistory(
    params?: GetMeritPointsHistoryParams
  ): Promise<GetMeritPointsHistoryResponse> {
    return callCloudFunction<GetMeritPointsHistoryResponse>({
      name: 'user',
      action: 'getMeritPointsHistory',
      data: params,
      showLoading: false
    })
  }

  /**
   * 10. 获取积分余额
   * @returns 积分信息
   */
  static async getCashPoints(): Promise<CashPointsInfo> {
    return callCloudFunction<CashPointsInfo>({
      name: 'user',
      action: 'getCashPoints',
      showLoading: false
    })
  }

  /**
   * 11. 获取积分明细
   * @param params 分页参数
   * @returns 积分明细列表
   */
  static async getCashPointsHistory(
    params?: GetCashPointsHistoryParams
  ): Promise<GetCashPointsHistoryResponse> {
    return callCloudFunction<GetCashPointsHistoryResponse>({
      name: 'user',
      action: 'getCashPointsHistory',
      data: params,
      showLoading: false
    })
  }

  /**
   * 12. 申请积分提现
   * @param params 提现参数
   * @returns 申请结果
   */
  static async applyWithdraw(params: ApplyWithdrawParams): Promise<{ message: string }> {
    return callCloudFunction<{ message: string }>({
      name: 'user',
      action: 'applyWithdraw',
      data: params,
      loadingText: '提交中...'
    })
  }

  /**
   * 13. 获取提现记录
   * @param params 分页参数
   * @returns 提现记录列表
   */
  static async getWithdrawRecords(
    params?: GetWithdrawRecordsParams
  ): Promise<GetWithdrawRecordsResponse> {
    return callCloudFunction<GetWithdrawRecordsResponse>({
      name: 'user',
      action: 'getWithdrawRecords',
      data: params,
      showLoading: false
    })
  }

  /**
   * 14. 获取我推荐的用户列表
   * @param params 分页参数
   * @returns 推荐用户列表
   */
  static async getMyReferees(params?: GetRefereesParams): Promise<GetRefereesResponse> {
    return callCloudFunction<GetRefereesResponse>({
      name: 'user',
      action: 'getMyReferees',
      data: params,
      showLoading: false
    })
  }
}

// 导出单个方法（便于按需导入）
export const {
  login,
  getProfile,
  updateProfile,
  updateReferee,
  getRefereeInfo,
  getMyCourses,
  getMyOrders,
  getMeritPoints,
  getMeritPointsHistory,
  getCashPoints,
  getCashPointsHistory,
  applyWithdraw,
  getWithdrawRecords,
  getMyReferees
} = UserApi

// 默认导出
export default UserApi
