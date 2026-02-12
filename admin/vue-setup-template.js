// Vue setup 函数中的侧边导航栏代码模板
// 复制此代码到 setup() 函数的开头

// 管理员信息
const adminInfo = ref(null);

// 检查登录状态
const checkAuth = () => {
  adminInfo.value = AdminAPI.getCurrentAdmin();
  if (!adminInfo.value) {
    window.location.href = '../../login.html';
    return false;
  }
  return true;
};

// 退出登录
const handleLogout = () => {
  TDesign.DialogPlugin.confirm({
    header: '确认退出',
    body: '确定要退出登录吗？',
    onConfirm: () => {
      AdminAPI.logout();
    }
  });
};

// 菜单切换
const handleMenuChange = (value) => {
  const routes = {
    'dashboard': '../../index.html',
    'user-list': '../user/list.html',
    'user-referee': '../user/referee.html',
    'order-list': '../order/list.html',
    'order-refund': '../order/refund.html',
    'withdraw-audit': '../order/withdraw-audit.html',
    'course-list': '../course/list.html',
    'schedule-list': '../course/schedule.html',
    'appointment-list': '../course/appointment.html',
    'case-list': '../course/case.html',
    'material-list': '../course/material.html',
    'ambassador-list': '../ambassador/list.html',
    'application-audit': '../ambassador/application-audit.html',
    'activity-list': '../ambassador/activity.html',
    'contract-list': '../ambassador/contract.html',
    'admin-list': '../system/admin.html',
    'config': '../system/config.html',
    'announcement-list': '../system/announcement.html',
    'feedback-list': '../system/feedback.html',
    'notification-list': '../system/notification.html',
    'level-config': '../system/level-config.html',
  };
  
  if (routes[value]) {
    window.location.href = routes[value];
  }
};

// 在 onMounted 中添加 checkAuth() 调用
// 在 return 中添加: adminInfo, handleLogout, handleMenuChange

