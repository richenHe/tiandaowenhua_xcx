/**
 * API 统一导出
 */

// 导出请求方法
export * from './request'

// 导出通用类型
export * from './types'

// 导出各模块 API
export { default as UserApi } from './modules/user'
export { default as CourseApi } from './modules/course'
export { default as OrderApi } from './modules/order'
export { default as AmbassadorApi } from './modules/ambassador'
export { default as SystemApi } from './modules/system'

// 导出各模块类型
export * from './types/user'
export * from './types/course'
export * from './types/order'
export * from './types/ambassador'
export * from './types/system'
