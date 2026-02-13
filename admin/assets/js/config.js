/**
 * 系统配置文件
 */

/**
 * 自动检测基础路径
 * 本地开发：根据当前 URL 路径自动判断 (/ 或 /admin/)
 * 云端部署：使用 '/tiandaowenhua/'
 */
function getBasePath() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // 本地开发环境（localhost、127.0.0.1 等）
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    // 检查当前路径是否包含 /admin/
    if (pathname.includes('/admin/')) {
      return '/admin/';
    }
    return '/';
  }
  
  // 云端部署环境
  return '/tiandaowenhua/';
}

window.CONFIG = {
  // CloudBase 环境 ID
  ENV_ID: 'cloud1-0gnn3mn17b581124',
  
  // 基础路径（自动适配环境）
  BASE_PATH: getBasePath(),
  
  // 云函数列表
  CLOUD_FUNCTIONS: {
    USER: 'user',
    ORDER: 'order',
    COURSE: 'course',
    AMBASSADOR: 'ambassador',
    SYSTEM: 'system',
  },
  
  // 本地存储键名
  STORAGE_KEYS: {
    TOKEN: 'adminToken',
    ADMIN_INFO: 'adminInfo',
  },
  
  // 分页配置
  PAGE_SIZE: 20,
  
  // 系统名称
  SYSTEM_NAME: '天道文化后台管理',
};

