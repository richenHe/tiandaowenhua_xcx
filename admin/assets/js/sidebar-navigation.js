/**
 * 侧边栏导航通用脚本
 * 提供统一的菜单切换和登出功能
 */

// 获取当前页面所在的目录层级（用于计算相对路径）
function getPageLevel() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s);
  const adminIndex = segments.findIndex(s => s === 'admin');
  if (adminIndex === -1) return 0;
  
  // admin 根目录的页面（如 index.html）层级为 0
  // admin/pages 下的页面层级为 1
  // admin/pages/xxx 下的页面层级为 2
  // 计算：总段数 - admin位置 - 1(admin本身) - 1(文件名) = 目录层级
  return segments.length - adminIndex - 2;
}

// 根据层级生成路径前缀
function getPathPrefix() {
  const level = getPageLevel();
  if (level === 0) return './';
  if (level === 1) return '../';
  if (level === 2) return '../../';
  return '../../../';
}

/**
 * 处理菜单切换
 * @param {string} value - 菜单项的值
 */
function handleMenuChange(value) {
  // 组件展示页面在新窗口打开
  if (value === 'playground') {
    const prefix = getPathPrefix();
    window.open(`${prefix}playground.html`, '_blank');
    return;
  }
  
  // 页面路由映射（相对于 admin 目录）
  const routes = {
    'dashboard': 'index.html',
    'user-list': 'pages/user/list.html',
    'user-referee': 'pages/user/referee.html',
    'order-list': 'pages/order/list.html',
    'order-refund': 'pages/order/refund.html',
    'withdraw-audit': 'pages/order/withdraw-audit.html',
    'course-list': 'pages/course/list.html',
    'schedule-list': 'pages/course/schedule.html',
    'appointment-list': 'pages/course/appointment.html',
    'case-list': 'pages/course/case.html',
    'material-list': 'pages/course/material.html',
    'ambassador-list': 'pages/ambassador/list.html',
    'application-audit': 'pages/ambassador/application-audit.html',
    'activity-list': 'pages/ambassador/activity.html',
    'contract-list': 'pages/ambassador/contract.html',
    'admin-list': 'pages/system/admin.html',
    'config': 'pages/system/config.html',
    'announcement-list': 'pages/system/announcement.html',
    'feedback-list': 'pages/system/feedback.html',
    'notification-list': 'pages/system/notification.html',
    'level-config': 'pages/system/level-config.html',
  };
  
  // 跳转页面
  if (routes[value]) {
    const prefix = getPathPrefix();
    window.location.href = prefix + routes[value];
  }
}

/**
 * 处理退出登录
 */
function handleLogout() {
  TDesign.DialogPlugin.confirm({
    header: '确认退出',
    body: '确定要退出登录吗？',
    onConfirm: () => {
      AdminAPI.logout();
    }
  });
}

/**
 * 检查管理员登录状态
 * @returns {Object|null} 管理员信息，未登录返回 null
 */
function checkAdminAuth() {
  const adminInfo = AdminAPI.getCurrentAdmin();
  
  if (!adminInfo) {
    const prefix = getPathPrefix();
    window.location.href = prefix + 'login.html';
    return null;
  }
  
  return adminInfo;
}

/**
 * 为 Vue 应用提供的通用混入选项
 * 使用示例：
 * const app = createApp({
 *   setup() {
 *     const { adminInfo, handleMenuChange, handleLogout } = useSidebarNavigation();
 *     // ... 其他代码
 *     return { adminInfo, handleMenuChange, handleLogout, ... };
 *   }
 * });
 */
function useSidebarNavigation() {
  const { ref, onMounted } = Vue;
  const adminInfo = ref(null);
  
  onMounted(() => {
    adminInfo.value = checkAdminAuth();
  });
  
  return {
    adminInfo,
    handleMenuChange,
    handleLogout
  };
}

// 导出全局函数（兼容不同的使用方式）
if (typeof window !== 'undefined') {
  window.SidebarNavigation = {
    handleMenuChange,
    handleLogout,
    checkAdminAuth,
    useSidebarNavigation
  };
}

