/**
 * API 请求封装
 * 统一的云函数调用方法
 */

import { app } from '@/utils/cloudbase'
import { responseInterceptor } from '@/utils/request-interceptor'
import type { CloudFunctionOptions, ApiResponse } from './types'

/**
 * 调用云函数
 * @param options 云函数调用选项
 * @returns Promise<T> 返回数据
 */
export async function callCloudFunction<T = any>(
  options: CloudFunctionOptions
): Promise<T> {
  const {
    name,
    action,
    data = {},
    showLoading = true,
    loadingText = '加载中...',
    timeout = 15000
  } = options

  // 显示加载提示
  if (showLoading) {
    uni.showLoading({
      title: loadingText,
      mask: true
    })
  }

  try {
    // 调用云函数
    const result = await app.callFunction({
      name,
      data: {
        action,
        ...data
      },
      timeout
    })

    // 隐藏加载提示
    if (showLoading) {
      uni.hideLoading()
    }

    // 获取响应数据
    const response = result.result as ApiResponse<T>

    // 使用响应拦截器处理
    const interceptedResponse = responseInterceptor(response)

    // 如果被拦截（返回null），抛出错误
    if (interceptedResponse === null) {
      throw new Error(response.message || '请求失败')
    }

    // 返回数据
    return response.data
  } catch (error: any) {
    // 隐藏加载提示
    if (showLoading) {
      uni.hideLoading()
    }

    // 处理错误
    console.error('云函数调用失败:', error)

    // 如果是云函数调用错误
    if (error.code) {
      uni.showToast({
        title: error.message || '请求失败',
        icon: 'none',
        duration: 2000
      })
    }

    // 抛出错误
    throw error
  }
}

/**
 * 批量调用云函数
 * @param requests 云函数调用选项数组
 * @returns Promise<any[]> 返回数据数组
 */
export async function batchCallCloudFunction(
  requests: CloudFunctionOptions[]
): Promise<any[]> {
  const promises = requests.map(request => callCloudFunction(request))
  return Promise.all(promises)
}

/**
 * 调用云函数（不显示加载提示）
 * @param options 云函数调用选项
 * @returns Promise<T> 返回数据
 */
export async function callCloudFunctionSilent<T = any>(
  options: CloudFunctionOptions
): Promise<T> {
  return callCloudFunction<T>({
    ...options,
    showLoading: false
  })
}

/**
 * 调用云函数（自定义加载提示）
 * @param options 云函数调用选项
 * @param loadingText 加载提示文字
 * @returns Promise<T> 返回数据
 */
export async function callCloudFunctionWithLoading<T = any>(
  options: CloudFunctionOptions,
  loadingText: string
): Promise<T> {
  return callCloudFunction<T>({
    ...options,
    showLoading: true,
    loadingText
  })
}

/**
 * 请求工具类
 */
export class Request {
  /**
   * 调用云函数
   */
  static call<T = any>(options: CloudFunctionOptions): Promise<T> {
    return callCloudFunction<T>(options)
  }

  /**
   * 批量调用云函数
   */
  static batchCall(requests: CloudFunctionOptions[]): Promise<any[]> {
    return batchCallCloudFunction(requests)
  }

  /**
   * 静默调用云函数
   */
  static callSilent<T = any>(options: CloudFunctionOptions): Promise<T> {
    return callCloudFunctionSilent<T>(options)
  }

  /**
   * 自定义加载提示调用云函数
   */
  static callWithLoading<T = any>(
    options: CloudFunctionOptions,
    loadingText: string
  ): Promise<T> {
    return callCloudFunctionWithLoading<T>(options, loadingText)
  }
}

// 默认导出
export default {
  callCloudFunction,
  batchCallCloudFunction,
  callCloudFunctionSilent,
  callCloudFunctionWithLoading,
  Request
}
