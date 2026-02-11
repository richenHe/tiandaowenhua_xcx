/**
 * 订单模块 API
 */

import { callCloudFunction } from '../request'
import type {
  CreateOrderParams,
  CreateOrderResponse,
  CreatePaymentParams,
  CreatePaymentResponse,
  Order,
  GetOrderListParams,
  GetOrderListResponse,
  CancelOrderParams,
  CancelOrderResponse,
  MallGoods,
  GetMallGoodsParams,
  GetMallGoodsResponse,
  ExchangeGoodsParams,
  ExchangeGoodsResponse,
  GetExchangeRecordsParams,
  GetExchangeRecordsResponse,
  GetMallCoursesParams,
  GetMallCoursesResponse
} from '../types/order'

/**
 * 订单模块 API 类
 */
export class OrderApi {
  // ==================== 客户端接口 ====================

  /**
   * 1. 创建订单
   * @param params 订单参数
   * @returns 订单信息
   */
  static async create(params: CreateOrderParams): Promise<CreateOrderResponse> {
    return callCloudFunction<CreateOrderResponse>({
      name: 'order',
      action: 'create',
      data: params,
      loadingText: '创建订单中...'
    })
  }

  /**
   * 2. 发起支付
   * @param params 支付参数
   * @returns 支付信息
   */
  static async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    return callCloudFunction<CreatePaymentResponse>({
      name: 'order',
      action: 'createPayment',
      data: params,
      loadingText: '发起支付中...'
    })
  }

  /**
   * 3. 获取订单详情
   * @param orderNo 订单号
   * @returns 订单详情
   */
  static async getDetail(orderNo: string): Promise<Order> {
    return callCloudFunction<Order>({
      name: 'order',
      action: 'getDetail',
      data: { order_no: orderNo },
      showLoading: false
    })
  }

  /**
   * 4. 获取订单列表
   * @param params 查询参数
   * @returns 订单列表
   */
  static async getList(params?: GetOrderListParams): Promise<GetOrderListResponse> {
    return callCloudFunction<GetOrderListResponse>({
      name: 'order',
      action: 'getList',
      data: params,
      showLoading: false
    })
  }

  /**
   * 5. 取消订单
   * @param params 取消参数
   * @returns 取消结果
   */
  static async cancel(params: CancelOrderParams): Promise<CancelOrderResponse> {
    return callCloudFunction<CancelOrderResponse>({
      name: 'order',
      action: 'cancel',
      data: params,
      loadingText: '取消中...'
    })
  }

  /**
   * 6. 获取商城商品列表
   * @param params 查询参数
   * @returns 商品列表
   */
  static async getMallGoods(params?: GetMallGoodsParams): Promise<GetMallGoodsResponse> {
    return callCloudFunction<GetMallGoodsResponse>({
      name: 'order',
      action: 'getMallGoods',
      data: params,
      showLoading: false
    })
  }

  /**
   * 7. 功德分兑换商品
   * @param params 兑换参数
   * @returns 兑换结果
   */
  static async exchangeGoods(params: ExchangeGoodsParams): Promise<ExchangeGoodsResponse> {
    return callCloudFunction<ExchangeGoodsResponse>({
      name: 'order',
      action: 'exchangeGoods',
      data: params,
      loadingText: '兑换中...'
    })
  }

  /**
   * 8. 获取兑换记录列表
   * @param params 查询参数
   * @returns 兑换记录列表
   */
  static async getExchangeRecords(params?: GetExchangeRecordsParams): Promise<GetExchangeRecordsResponse> {
    return callCloudFunction<GetExchangeRecordsResponse>({
      name: 'order',
      action: 'getExchangeRecords',
      data: params,
      showLoading: false
    })
  }

  /**
   * 9. 获取商城课程列表
   * @param params 查询参数
   * @returns 课程列表
   */
  static async getMallCourses(params?: GetMallCoursesParams): Promise<GetMallCoursesResponse> {
    return callCloudFunction<GetMallCoursesResponse>({
      name: 'order',
      action: 'getMallCourses',
      data: params,
      showLoading: false
    })
  }
}

// 导出单个方法（便于按需导入）
export const {
  create,
  createPayment,
  getDetail,
  getList,
  cancel,
  getMallGoods,
  exchangeGoods,
  getExchangeRecords,
  getMallCourses
} = OrderApi

// 默认导出
export default OrderApi
