/**
 * 云存储路径生成工具
 * 根据数据库设计文档中的云存储字段规范生成标准化路径
 */

/**
 * 云存储路径映射表
 * 基于 docs/database/数据库详细信息.md 中的"云存储字段汇总"
 */
export const STORAGE_PATHS = {
  // 用户模块
  USER_AVATAR: 'users/avatars',           // 用户头像
  USER_BACKGROUND: 'users/backgrounds',   // 用户背景图片
  USER_QRCODE: 'users/qrcodes',           // 用户推广二维码

  // 课程模块
  COURSE_COVER: 'courses/covers',         // 课程封面
  COURSE_CONTENT: 'courses/content',      // 课程详情图片

  // 大使模块
  AMBASSADOR_ACTIVITY: 'ambassador/activities', // 大使活动图片

  // 商学院模块
  ACADEMY_INTRO_COVER: 'academy/intro/covers',      // 商学院介绍封面
  ACADEMY_CASE_AVATAR: 'academy/cases/avatars',     // 学员头像
  ACADEMY_CASE_VIDEO: 'academy/cases/videos',       // 学员案例视频
  ACADEMY_CASE_IMAGE: 'academy/cases/images',       // 学员案例图片
  ACADEMY_MATERIAL_IMAGE: 'academy/materials',      // 素材图片（需要子分类）
  ACADEMY_MATERIAL_VIDEO: 'academy/materials/videos', // 素材视频

  // 公告模块
  ANNOUNCEMENT_COVER: 'announcements/covers', // 公告封面

  // 反馈模块
  FEEDBACK_IMAGE: 'feedbacks/images',      // 反馈图片

  // 积分商城模块
  MALL_GOODS_IMAGE: 'mall/goods',          // 商品图片

  // 管理员模块
  ADMIN_AVATAR: 'admin/avatars'            // 管理员头像
} as const

/**
 * 生成云存储路径
 * @param pathPrefix 路径前缀（来自 STORAGE_PATHS）
 * @param identifier 业务标识符（如 uid, course_id, record_id 等）
 * @param extension 文件扩展名（如 .jpg, .png, .mp4）
 * @param subPath 子路径（可选，用于如 academy/materials/{category}/ 这样的场景）
 * @returns 完整的云存储路径
 */
export function generateStoragePath(
  pathPrefix: string,
  identifier: string | number,
  extension: string,
  subPath?: string
): string {
  const timestamp = Date.now()
  const cleanExt = extension.startsWith('.') ? extension : `.${extension}`
  
  // 如果有子路径，插入到路径中
  const fullPrefix = subPath ? `${pathPrefix}/${subPath}` : pathPrefix
  
  return `${fullPrefix}/${identifier}_${timestamp}${cleanExt}`
}

/**
 * 生成目录级别的云存储路径（用于批量图片）
 * @param pathPrefix 路径前缀
 * @param identifier 业务标识符
 * @param filename 文件名（包含扩展名）
 * @returns 完整的云存储路径
 */
export function generateDirectoryPath(
  pathPrefix: string,
  identifier: string | number,
  filename: string
): string {
  return `${pathPrefix}/${identifier}/${filename}`
}

/**
 * 从本地文件路径提取扩展名
 * @param filePath 本地文件路径
 * @returns 扩展名（如 .jpg）
 */
export function getFileExtension(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return '.jpg' // 默认扩展名
  }
  return filePath.substring(lastDotIndex)
}

/**
 * 快捷路径生成器（常用场景）
 */
export const StoragePathHelper = {
  /**
   * 生成用户头像路径
   * @param uid 用户 UID
   * @param filePath 本地文件路径
   */
  userAvatar(uid: string, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.USER_AVATAR, uid, getFileExtension(filePath))
  },

  /**
   * 生成用户背景图片路径
   * @param uid 用户 UID
   * @param filePath 本地文件路径
   */
  userBackground(uid: string, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.USER_BACKGROUND, uid, getFileExtension(filePath))
  },

  /**
   * 生成用户二维码路径
   * @param uid 用户 UID
   */
  userQrcode(uid: string): string {
    return generateStoragePath(STORAGE_PATHS.USER_QRCODE, uid, '.png')
  },

  /**
   * 生成课程封面路径
   * @param courseId 课程 ID
   * @param filePath 本地文件路径
   */
  courseCover(courseId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.COURSE_COVER, courseId, getFileExtension(filePath))
  },

  /**
   * 生成课程详情图片路径
   * @param courseId 课程 ID
   * @param filename 文件名
   */
  courseContent(courseId: number, filename: string): string {
    return generateDirectoryPath(STORAGE_PATHS.COURSE_CONTENT, courseId, filename)
  },

  /**
   * 生成大使活动图片路径
   * @param recordId 活动记录 ID
   * @param filename 文件名
   */
  ambassadorActivity(recordId: number, filename: string): string {
    return generateDirectoryPath(STORAGE_PATHS.AMBASSADOR_ACTIVITY, recordId, filename)
  },

  /**
   * 生成商学院介绍封面路径
   * @param introId 介绍 ID
   * @param filePath 本地文件路径
   */
  academyIntroCover(introId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.ACADEMY_INTRO_COVER, introId, getFileExtension(filePath))
  },

  /**
   * 生成学员头像路径
   * @param caseId 案例 ID
   * @param filePath 本地文件路径
   */
  academyCaseAvatar(caseId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.ACADEMY_CASE_AVATAR, caseId, getFileExtension(filePath))
  },

  /**
   * 生成学员案例视频路径
   * @param caseId 案例 ID
   */
  academyCaseVideo(caseId: number): string {
    return generateStoragePath(STORAGE_PATHS.ACADEMY_CASE_VIDEO, caseId, '.mp4')
  },

  /**
   * 生成学员案例图片路径
   * @param caseId 案例 ID
   * @param filename 文件名
   */
  academyCaseImage(caseId: number, filename: string): string {
    return generateDirectoryPath(STORAGE_PATHS.ACADEMY_CASE_IMAGE, caseId, filename)
  },

  /**
   * 生成素材图片路径
   * @param materialId 素材 ID
   * @param category 分类（poster/copywriting/video）
   * @param filePath 本地文件路径
   */
  academyMaterialImage(materialId: number, category: string, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.ACADEMY_MATERIAL_IMAGE, materialId, getFileExtension(filePath), category)
  },

  /**
   * 生成素材视频路径
   * @param materialId 素材 ID
   */
  academyMaterialVideo(materialId: number): string {
    return generateStoragePath(STORAGE_PATHS.ACADEMY_MATERIAL_VIDEO, materialId, '.mp4')
  },

  /**
   * 生成公告封面路径
   * @param announcementId 公告 ID
   * @param filePath 本地文件路径
   */
  announcementCover(announcementId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.ANNOUNCEMENT_COVER, announcementId, getFileExtension(filePath))
  },

  /**
   * 生成反馈图片路径
   * @param feedbackId 反馈 ID
   * @param filename 文件名
   */
  feedbackImage(feedbackId: number, filename: string): string {
    return generateDirectoryPath(STORAGE_PATHS.FEEDBACK_IMAGE, feedbackId, filename)
  },

  /**
   * 生成商品图片路径
   * @param goodsId 商品 ID
   * @param filePath 本地文件路径
   */
  mallGoodsImage(goodsId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.MALL_GOODS_IMAGE, goodsId, getFileExtension(filePath))
  },

  /**
   * 生成管理员头像路径
   * @param adminId 管理员 ID
   * @param filePath 本地文件路径
   */
  adminAvatar(adminId: number, filePath: string): string {
    return generateStoragePath(STORAGE_PATHS.ADMIN_AVATAR, adminId, getFileExtension(filePath))
  }
}

export default StoragePathHelper

