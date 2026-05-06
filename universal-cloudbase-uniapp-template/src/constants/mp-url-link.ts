/**
 * 微信小程序「获取小程序链接」—— URL Link / Short Link 所用页面路径约定。
 *
 * 加密链接形如 `https://wxaurl.cn/*TICKET*`（或 `wxmpurl.cn`），须通过微信服务端接口生成，
 * 前端不可手写完整 HTTPS 链接。
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-link.html
 */

/** 与服务端 generateUrlLink 的 `path` 一致（无前导 `/`） */
export const MY_COURSES_PAGE_PATH_FOR_URL_LINK = 'pages/course/my-courses/index'

/** `uni.navigateTo` / `redirect` 等使用的站内路径（含前导 `/`） */
export const MY_COURSES_PAGE_PATH = `/${MY_COURSES_PAGE_PATH_FOR_URL_LINK}`
