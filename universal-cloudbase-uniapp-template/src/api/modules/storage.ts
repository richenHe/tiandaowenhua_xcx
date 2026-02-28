/**
 * 云存储模块 API
 */

import { app } from '@/utils/cloudbase'
import { callCloudFunction } from '@/api/request'
import { StoragePathHelper, STORAGE_PATHS } from '@/utils/storage-path'

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
 * 将 cloud:// fileID 直接转换为 CDN HTTPS URL（无需 API 调用，避免 credentials not found 错误）
 * 格式：cloud://{env-id}.{bucket}/{path} → https://{bucket}.tcb.qcloud.la/{path}
 * @param fileID cloud:// 格式的文件ID，或已是 HTTPS URL 直接返回
 */
export function cloudFileIDToURL(fileID: string): string {
  if (!fileID) return ''
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) return fileID
  if (!fileID.startsWith('cloud://')) return fileID
  const withoutScheme = fileID.slice(8)
  const dotIdx = withoutScheme.indexOf('.')
  const slashIdx = withoutScheme.indexOf('/')
  if (dotIdx === -1 || slashIdx === -1 || dotIdx >= slashIdx) return fileID
  const bucket = withoutScheme.slice(dotIdx + 1, slashIdx)
  const filePath = withoutScheme.slice(slashIdx + 1)
  return `https://${bucket}.tcb.qcloud.la/${filePath}`
}

/**
 * 云存储 API 类
 */
export class StorageApi {
  /**
   * 上传单个文件（通过云函数）
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

      // 通过云函数上传
      const result = await callCloudFunction<{ fileID: string; tempFileURL: string }>({
        name: 'system',
        action: 'uploadFile',
        data: {
          cloudPath: options.cloudPath,
          fileContent
        },
        showLoading: false
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
   * MP-WEIXIN 使用 wx.cloud.getTempFileURL()（原生微信云，无需 CloudBase Auth）
   * 其他平台使用 app.getTempFileURL()
   * @param options 获取选项
   * @returns 临时链接列表
   */
  static async getTempFileURL(options: GetTempFileURLOptions): Promise<TempFileURLResult[]> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      (wx as any).cloud.getTempFileURL({
        fileList: options.fileList,
        success: (res: any) => {
          const results = res.fileList.map((item: any) => ({
            fileID: item.fileID,
            tempFileURL: item.tempFileURL || item.download_url || cloudFileIDToURL(item.fileID),
            maxAge: options.maxAge || 3600
          }))
          resolve(results)
        },
        fail: (err: any) => {
          console.warn('wx.cloud.getTempFileURL 失败:', err)
          // 回退：直接构造 CDN URL
          const results = options.fileList.map(fileID => ({
            fileID,
            tempFileURL: cloudFileIDToURL(fileID),
            maxAge: options.maxAge || 3600
          }))
          resolve(results)
        }
      })
    })
    // #endif

    // #ifndef MP-WEIXIN
    return new Promise((resolve, reject) => {
      app.getTempFileURL({
        fileList: options.fileList
      }).then((res: any) => {
        const results = res.fileList.map((item: any) => ({
          fileID: item.fileID,
          tempFileURL: item.tempFileURL || item.download_url || cloudFileIDToURL(item.fileID),
          maxAge: options.maxAge || 3600
        }))
        resolve(results)
      }).catch((err: any) => {
        console.warn('获取临时下载链接失败，回退为直接构造 CDN URL:', err)
        // 回退：直接构造 CDN URL
        const results = options.fileList.map(fileID => ({
          fileID,
          tempFileURL: cloudFileIDToURL(fileID),
          maxAge: options.maxAge || 3600
        }))
        resolve(results)
      })
    })
    // #endif
  }

  /**
   * 删除文件
   * MP-WEIXIN 使用 wx.cloud.deleteFile()（原生微信云）
   * 其他平台使用 app.deleteFile()
   * @param fileList 文件 ID 列表
   * @returns 删除结果
   */
  static async deleteFile(fileList: string[]): Promise<{ success: boolean; fileList: any[] }> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve) => {
      (wx as any).cloud.deleteFile({
        fileList,
        success: (res: any) => resolve({ success: true, fileList: res.fileList }),
        fail: (err: any) => {
          console.warn('wx.cloud.deleteFile 失败（不影响主流程）:', err)
          resolve({ success: false, fileList: [] })
        }
      })
    })
    // #endif

    // #ifndef MP-WEIXIN
    return new Promise((resolve) => {
      app.deleteFile({
        fileList
      }).then((res: any) => {
        resolve({ success: true, fileList: res.fileList })
      }).catch((err: any) => {
        console.warn('删除文件失败（不影响主流程）:', err)
        resolve({ success: false, fileList: [] })
      })
    })
    // #endif
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
    if (!fileID) return ''
    // 已是 HTTPS URL 或 cloud:// 直接构造 CDN URL，不调用 API（避免认证问题）
    return cloudFileIDToURL(fileID)
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

  /**
   * 选择并上传视频
   * @param cloudPathPrefix 云存储路径前缀（如 'academy/cases/videos/'）
   * @returns 上传结果
   */
  static async chooseAndUploadVideo(cloudPathPrefix: string): Promise<UploadFileResult> {
    return new Promise((resolve, reject) => {
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        compressed: true,
        maxDuration: 300, // 最长 5 分钟
        success: async (res: any) => {
          try {
            const filePath = res.tempFilePath
            const timestamp = Date.now()
            const random = Math.random().toString(36).substring(2, 8)
            const cloudPath = `${cloudPathPrefix}${timestamp}_${random}.mp4`
            
            const result = await this.uploadFile({ cloudPath, filePath })
            resolve(result)
          } catch (error) {
            console.error('上传视频失败:', error)
            reject(error)
          }
        },
        fail: (err: any) => {
          console.error('选择视频失败:', err)
          reject(err)
        }
      })
    })
  }

  /**
   * 批量上传图片
   * @param cloudPathPrefix 云存储路径前缀
   * @param filePaths 本地文件路径列表
   * @returns 上传结果列表
   */
  static async uploadBatchImages(
    cloudPathPrefix: string,
    filePaths: string[]
  ): Promise<UploadFileResult[]> {
    const uploadPromises = filePaths.map((filePath, index) => {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = filePath.substring(filePath.lastIndexOf('.'))
      const cloudPath = `${cloudPathPrefix}${timestamp}_${index}_${random}${ext}`
      
      return this.uploadFile({ cloudPath, filePath })
    })
    
    return Promise.all(uploadPromises)
  }

  /**
   * 替换文件（删除旧文件，上传新文件）
   * @param oldFileID 旧文件 ID（如果存在）
   * @param newFilePath 新文件本地路径
   * @param cloudPath 云存储路径
   * @returns 上传结果
   */
  static async replaceFile(
    oldFileID: string | null,
    newFilePath: string,
    cloudPath: string
  ): Promise<UploadFileResult> {
    // 上传新文件
    const result = await this.uploadFile({ cloudPath, filePath: newFilePath })
    
    // 删除旧文件
    if (oldFileID && oldFileID.startsWith('cloud://')) {
      try {
        await this.deleteFile([oldFileID])
      } catch (error) {
        console.warn('删除旧文件失败:', error)
        // 不影响主流程，仅记录警告
      }
    }
    
    return result
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
  uploadFileWithUrl,
  chooseAndUploadVideo,
  uploadBatchImages,
  replaceFile
} = StorageApi

// 导出路径生成工具
export { StoragePathHelper, STORAGE_PATHS }

// 默认导出
export default StorageApi
