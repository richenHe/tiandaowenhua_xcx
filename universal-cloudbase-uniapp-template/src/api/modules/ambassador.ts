/**
 * 大使模块 API
 */

import { callCloudFunction } from '../request'
import type {
  ApplyAmbassadorParams,
  ApplyAmbassadorResponse,
  AmbassadorApplication,
  UpgradeAmbassadorParams,
  UpgradeAmbassadorResponse,
  UpgradeGuide,
  GenerateQRCodeParams,
  GenerateQRCodeResponse,
  QuotaInfo,
  GiftQuotaParams,
  GiftQuotaResponse,
  ContractTemplate,
  SignContractParams,
  SignContractResponse,
  Contract,
  ContractDetail
} from '../types/ambassador'

/**
 * 大使模块 API 类
 */
export class AmbassadorApi {
  // ==================== 客户端接口 ====================

  /**
   * 1. 申请成为大使
   * @param params 申请参数
   * @returns 申请结果
   */
  static async apply(params: ApplyAmbassadorParams): Promise<ApplyAmbassadorResponse> {
    return callCloudFunction<ApplyAmbassadorResponse>({
      name: 'ambassador',
      action: 'apply',
      data: params,
      loadingText: '提交申请中...'
    })
  }

  /**
   * 2. 获取申请状态
   * @returns 申请状态
   */
  static async getApplicationStatus(): Promise<AmbassadorApplication> {
    return callCloudFunction<AmbassadorApplication>({
      name: 'ambassador',
      action: 'getApplicationStatus',
      showLoading: false
    })
  }

  /**
   * 3. 大使升级
   * @param params 升级参数
   * @returns 升级结果
   */
  static async upgrade(params: UpgradeAmbassadorParams): Promise<UpgradeAmbassadorResponse> {
    return callCloudFunction<UpgradeAmbassadorResponse>({
      name: 'ambassador',
      action: 'upgrade',
      data: params,
      loadingText: '升级中...'
    })
  }

  /**
   * 4. 获取升级指南
   * @returns 升级指南
   */
  static async getUpgradeGuide(): Promise<UpgradeGuide> {
    return callCloudFunction<UpgradeGuide>({
      name: 'ambassador',
      action: 'getUpgradeGuide',
      showLoading: false
    })
  }

  /**
   * 5. 生成推广二维码
   * @param params 二维码参数
   * @returns 二维码信息
   */
  static async generateQRCode(params?: GenerateQRCodeParams): Promise<GenerateQRCodeResponse> {
    return callCloudFunction<GenerateQRCodeResponse>({
      name: 'ambassador',
      action: 'generateQRCode',
      data: params,
      loadingText: '生成中...'
    })
  }

  /**
   * 6. 获取我的名额
   * @returns 名额信息
   */
  static async getMyQuotas(): Promise<QuotaInfo> {
    return callCloudFunction<QuotaInfo>({
      name: 'ambassador',
      action: 'getMyQuotas',
      showLoading: false
    })
  }

  /**
   * 7. 赠送名额
   * @param params 赠送参数
   * @returns 赠送结果
   */
  static async giftQuota(params: GiftQuotaParams): Promise<GiftQuotaResponse> {
    return callCloudFunction<GiftQuotaResponse>({
      name: 'ambassador',
      action: 'giftQuota',
      data: params,
      loadingText: '赠送中...'
    })
  }

  /**
   * 8. 获取协议模板
   * @param level 大使等级
   * @returns 协议模板
   */
  static async getContractTemplate(level: number): Promise<ContractTemplate> {
    return callCloudFunction<ContractTemplate>({
      name: 'ambassador',
      action: 'getContractTemplate',
      data: { level },
      showLoading: false
    })
  }

  /**
   * 9. 签署协议
   * @param params 签署参数
   * @returns 签署结果
   */
  static async signContract(params: SignContractParams): Promise<SignContractResponse> {
    return callCloudFunction<SignContractResponse>({
      name: 'ambassador',
      action: 'signContract',
      data: params,
      loadingText: '签署中...'
    })
  }

  /**
   * 10. 获取我的协议列表
   * @returns 协议列表
   */
  static async getMyContracts(): Promise<Contract[]> {
    return callCloudFunction<Contract[]>({
      name: 'ambassador',
      action: 'getMyContracts',
      showLoading: false
    })
  }

  /**
   * 11. 获取协议详情
   * @param id 协议ID
   * @returns 协议详情
   */
  static async getContractDetail(id: number): Promise<ContractDetail> {
    return callCloudFunction<ContractDetail>({
      name: 'ambassador',
      action: 'getContractDetail',
      data: { id },
      showLoading: false
    })
  }
}

// 导出单个方法（便于按需导入）
export const {
  apply,
  getApplicationStatus,
  upgrade,
  getUpgradeGuide,
  generateQRCode,
  getMyQuotas,
  giftQuota,
  getContractTemplate,
  signContract,
  getMyContracts,
  getContractDetail
} = AmbassadorApi

// 默认导出
export default AmbassadorApi
