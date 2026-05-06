/**
 * Playwright：探测微信公众平台小程序后台入口页（匿名会话）。
 *
 * 用法（需在仓库根目录已安装 `.pw-probe/node_modules/playwright` 与浏览器）：
 *   node scripts/playwright-mp-weixin-probe.cjs [可选 URL]
 *
 * 说明：`token=` 为会话参数；未携带登录 Cookie 时页面通常会载入扫码登录 iframe，
 * 无法在脚本里「查找」到你的小程序后台具体内容。
 */
const path = require('path')
const { chromium } = require(path.join(__dirname, '..', '.pw-probe', 'node_modules', 'playwright'))

process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(__dirname, '..', '.pw-probe', 'browsers')

const url =
  process.argv[2] ||
  'https://mp.weixin.qq.com/wxamp/index/index?lang=zh_CN&token=496280208'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => ({
      err: e.message
    }))
    console.log('navigation:', res?.err ? `error: ${res.err}` : `status ${res?.status?.()}`)
    await page.waitForTimeout(4000)
    console.log('final_url:', page.url())
    console.log('title:', await page.title())
    const body = await page.locator('body').innerText().catch(() => '')
    console.log('main_frame_body_text (trim):', JSON.stringify(body.trim().slice(0, 500)))
    console.log(
      'frame_urls:',
      page
        .frames()
        .map((f) => f.url())
        .join('\n')
    )
  } finally {
    await browser.close()
  }
})()
