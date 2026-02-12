/**
 * 云存储模块 API
 */

import { getApp } from '@/utils/cloudbase'
import { ensureLogin } from '@/utils/cloudbase'
import { callCloudFunction } from '@/api/request'

/**
 * 上传文件选项
 */
interface UploadFileOptions {
  /** 云存储路径 */
  cloudPath: string
  /** 本地临时文件路径 */
  filePath: string
  /** 上传进度回调 */
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
}

/**
 * 上传文件结果
 */
interface UploadFileResult {
  /** 文件 ID */
  fileID: string
  /** 临时下载 URL */
  tempFileURL?: string
}

/**
 * 获取临时下载链接选项
 */
interface GetTempFileURLOptions {
  /** 文件 ID 列表 */
  fileList: string[]
  /** 有效期（秒），默认 3600 */
  maxAge?: number
}

/**
 * 临时下载链接结果
 */
interface TempFileURLResult {
  /** 文件 ID */
  fileID: string
  /** 临时下载 URL */
  tempFileURL: string
  /** 过期时间（时间戳） */
  maxAge: number
}

/**
 * 云存储 API 类
 */
export class StorageApi {
  /**
   * 上传单个文件（通过云函数中转）
   * @param options 上传选项
   * @returns 上传结果
   */
  static async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    try {
      // 读取文件为 base64
      const fileSystem = uni.getFileSystemManager()
      const fileContent = await new Promise<string>((resolve, reject) => {
        fileSystem.readFile({
          filePath: options.filePath,
          encoding: 'base64',
          success: (res: any) => resolve(res.data),
          fail: reject
        })
      })

      // 通过云函数上传（不显示 loading，由调用方控制）
      const result = await callCloudFunction<{ fileID: string; tempFileURL: string }>({
        name: 'system',
        action: 'uploadFile',
        data: {
          cloudPath: options.cloudPath,
          fileContent
        },
        showLoading: false  // 由调用方控制 loading
      })

      return {
        fileID: result.fileID,
        tempFileURL: result.tempFileURL || result.fileID
      }
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    }
  }

  /**
   * 获取临时下载链接
   * @param options 获取选项
   * @returns 临时链接列表
   */
  static async getTempFileURL(options: GetTempFileURLOptions): Promise<TempFileURLResult[]> {
    const app = getApp()
    
    return new Promise((resolve, reject) => {
      app.getTempFileURL({
        fileList: options.fileList
      }).then((res: any) => {
        const results = res.fileList.map((item: any) => ({
          fileID: item.fileID,
          tempFileURL: item.tempFileURL || item.download_url,
          maxAge: options.maxAge || 3600
        }))
        resolve(results)
      }).catch((err: any) => {
        console.error('获取临时下载链接失败:', err)
        reject(err)
      })
    })
  }

  /**
   * 删除文件
   * @param fileList 文件 ID 列表
   * @returns 删除结果
   */
  static async deleteFile(fileList: string[]): Promise<{ success: boolean; fileList: any[] }> {
    const app = getApp()
    
    return new Promise((resolve, reject) => {
      app.deleteFile({
        fileList
      }).then((res: any) => {
        resolve({
          success: true,
          fileList: res.fileList
        })
      }).catch((err: any) => {
        console.error('删除文件失败:', err)
        reject(err)
      })
    })
  }

  /**
   * 选择并上传图片
   * @param cloudPathPrefix 云存储路径前缀（如 'user-avatars/'）
   * @param count 最多可选择的图片数量，默认 1
   * @returns 上传结果列表
   */
  static async chooseAndUploadImage(
    cloudPathPrefix: string,
    count = 1
  ): Promise<UploadFileResult[]> {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res: UniApp.ChooseImageSuccessCallbackResult) => {
          try {
            const tempFilePaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
            const uploadPromises = tempFilePaths.map((filePath: string, index: number) => {
              // 生成唯一的云存储路径
              const timestamp = Date.now()
              const random = Math.random().toString(36).substring(2, 8)
              const ext = filePath.substring(filePath.lastIndexOf('.'))
              const cloudPath = `${cloudPathPrefix}${timestamp}_${index}_${random}${ext}`
              
              return this.uploadFile({ cloudPath, filePath })
            })
            
            const results = await Promise.all(uploadPromises)
            resolve(results)
          } catch (error) {
            console.error('上传图片失败:', error)
            reject(error)
          }
        },
        fail: (err: any) => {
          console.error('选择图片失败:', err)
          reject(err)
        }
      })
    })
  }

  /**
   * 获取单个文件的临时下载链接
   * @param fileID 文件 ID
   * @param maxAge 有效期（秒），默认 3600
   * @returns 临时下载 URL
   */
  static async getSingleTempFileURL(fileID: string, maxAge = 3600): Promise<string> {
    if (!fileID) {
      return ''
    }
    
    // 如果已经是 HTTP/HTTPS URL，直接返回
    if (fileID.startsWith('http://') || fileID.startsWith('https://')) {
      return fileID
    }
    
    try {
      const results = await this.getTempFileURL({ fileList: [fileID], maxAge })
      return results[0]?.tempFileURL || ''
    } catch (error) {
      console.error('获取临时下载链接失败:', error)
      return ''
    }
  }

  /**
   * 上传文件并返回 fileID 和临时 URL
   * @param filePath 本地临时文件路径
   * @param cloudPath 云存储路径
   * @returns 上传结果（包含 fileID 和临时 URL）
   */
  static async uploadFileWithUrl(
    filePath: string,
    cloudPath: string
  ): Promise<UploadFileResult> {
    const result = await this.uploadFile({ cloudPath, filePath })
    
    // 获取临时 URL
    if (result.fileID && !result.tempFileURL) {
      const tempURL = await this.getSingleTempFileURL(result.fileID)
      result.tempFileURL = tempURL
    }
    
    return result
  }

  /**
   * 批量获取临时下载链接（用于列表渲染）
   * @param fileIDs 文件 ID 列表（JSON 字符串或数组）
   * @param maxAge 有效期（秒），默认 3600
   * @returns 临时下载 URL 列表
   */
  static async getBatchTempFileURLs(
    fileIDs: string | string[],
    maxAge = 3600
  ): Promise<string[]> {
    if (!fileIDs) {
      return []
    }
    
    try {
      // 解析 JSON 字符串
      const fileList = typeof fileIDs === 'string' ? JSON.parse(fileIDs) : fileIDs
      
      if (!Array.isArray(fileList) || fileList.length === 0) {
        return []
      }
      
      // 过滤掉已经是 HTTP/HTTPS URL 的项
      const needFetch = fileList.filter(
        (id) => id && !id.startsWith('http://') && !id.startsWith('https://')
      )
      
      if (needFetch.length === 0) {
        return fileList
      }
      
      const results = await this.getTempFileURL({ fileList: needFetch, maxAge })
      
      // 合并结果
      return fileList.map((id) => {
        if (id.startsWith('http://') || id.startsWith('https://')) {
          return id
        }
        const result = results.find((r) => r.fileID === id)
        return result?.tempFileURL || ''
      })
    } catch (error) {
      console.error('批量获取临时下载链接失败:', error)
      return []
    }
  }
}

// 导出单个方法（便于按需导入）
export const {
  uploadFile,
  getTempFileURL,
  deleteFile,
  chooseAndUploadImage,
  getSingleTempFileURL,
  getBatchTempFileURLs,
  uploadFileWithUrl
} = StorageApi

// 默认导出
export default StorageApi
