/**
 * 打开文档工具（PDF/Word）
 * 用于小程序中下载并打开电子合同等文件
 */

/**
 * 根据 URL 推断文件类型
 */
function getFileTypeFromUrl(url: string): 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' {
  const lower = url.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.doc')) return 'doc'
  if (lower.endsWith('.xlsx')) return 'xlsx'
  if (lower.endsWith('.xls')) return 'xls'
  if (lower.endsWith('.pptx')) return 'pptx'
  if (lower.endsWith('.ppt')) return 'ppt'
  return 'pdf'
}

/**
 * 下载并打开文档（PDF/Word）
 * 微信小程序需将域名配置到 downloadFile 合法域名
 * @param url 文件 HTTPS URL（cloudFileIDToURL 转换后的 CDN 地址）
 * @param fileName 可选，用于提示
 */
export function openContractDocument(url: string, fileName?: string): Promise<void> {
  if (!url || !url.startsWith('http')) {
    return Promise.reject(new Error('无效的文件地址'))
  }

  return new Promise((resolve, reject) => {
    uni.showLoading({ title: '下载中...', mask: true })

    uni.downloadFile({
      url,
      success: (downloadRes) => {
        uni.hideLoading()
        if (downloadRes.statusCode !== 200) {
          uni.showToast({ title: '下载失败', icon: 'none' })
          reject(new Error('下载失败'))
          return
        }

        const fileType = getFileTypeFromUrl(url)

        uni.openDocument({
          filePath: downloadRes.tempFilePath,
          fileType,
          showMenu: true,
          success: () => {
            uni.showToast({
              title: '可点击右上角保存到手机',
              icon: 'none',
              duration: 2000
            })
            resolve()
          },
          fail: (err) => {
            console.error('打开文档失败:', err)
            uni.showToast({ title: '打开失败，请尝试保存后查看', icon: 'none' })
            reject(err)
          }
        })
      },
      fail: (err) => {
        uni.hideLoading()
        console.error('下载文件失败:', err)
        uni.showToast({ title: '下载失败，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}
