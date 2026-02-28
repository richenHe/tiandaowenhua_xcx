/**
 * 侧边栏导航通用脚本
 * 提供统一的菜单切换、登出功能，以及可复用的 SidebarMenu Vue 组件
 */

// 获取基础路径（部署路径）
function getBasePath() {
  return window.CONFIG?.BASE_PATH || '/tiandaowenhua/';
}

function getPathPrefix() {
  return getBasePath();
}

/**
 * 处理菜单切换
 */
function handleMenuChange(value) {
  if (value === 'playground') {
    window.open(getPathPrefix() + 'playground.html', '_blank');
    return;
  }

  const routes = {
    'dashboard':          'dashboard.html',
    'user-list':          'pages/user/list.html',
    'user-referee':       'pages/user/referee.html',
    'user-referee-logs':  'pages/user/referee-logs.html',
    'order-list':         'pages/order/list.html',
    'order-refund':       'pages/order/refund.html',
    'withdraw-audit':     'pages/order/withdraw-audit.html',
    'mall-goods':         'pages/order/mall-goods.html',
    'exchange-records':   'pages/order/exchange-records.html',
    'course-list':        'pages/course/list.html',
    'schedule-list':      'pages/course/schedule.html',
    'appointment-list':   'pages/course/appointment.html',
    'case-list':          'pages/course/case.html',
    'material-list':      'pages/course/material.html',
    'ambassador-list':    'pages/ambassador/list.html',
    'application-audit':  'pages/ambassador/application-audit.html',
    'activity-list':      'pages/ambassador/activity.html',
    'contract-list':      'pages/ambassador/contract.html',
    'admin-list':         'pages/system/admin.html',
    'config':             'pages/system/config.html',
    'banner-list':        'pages/system/banner.html',
    'announcement-list':  'pages/system/announcement.html',
    'feedback-list':      'pages/system/feedback.html',
    'notification-list':  'pages/system/notification.html',
    'level-config':       'pages/system/level-config.html',
    'auto-test':          'auto-test.html',
    'method-check':       'method-check.html',
    'button-test':        'button-test.html',
  };

  if (routes[value]) {
    window.location.href = getPathPrefix() + routes[value];
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
 */
function checkAdminAuth() {
  const adminInfo = AdminAPI.getCurrentAdmin();
  if (!adminInfo) {
    window.location.href = getPathPrefix() + 'index.html';
    return null;
  }
  return adminInfo;
}

/**
 * Vue composable：侧边栏导航
 */
function useSidebarNavigation() {
  const { ref, onMounted } = Vue;
  const adminInfo = ref(null);

  onMounted(() => {
    adminInfo.value = checkAdminAuth();
  });

  return { adminInfo, handleMenuChange, handleLogout };
}

/**
 * SidebarMenu — 可复用 Vue 组件
 * 用法：在每个页面的 createApp(...).component('sidebar-menu', SidebarNavigation.SidebarMenu).mount('#app')
 * 模板：<sidebar-menu active-key="banner-list"></sidebar-menu>
 */
const SidebarMenu = {
  name: 'SidebarMenu',
  props: {
    activeKey: { type: String, default: 'dashboard' }
  },
  setup(props) {
    return { handleMenuChange };
  },
  template: `
    <div style="width:240px;min-width:240px;background:#fff;border-right:1px solid #dcdcdc;overflow-y:auto;flex-shrink:0;">
      <t-menu
        :value="activeKey"
        :default-expanded="['user','order','course','ambassador','system']"
        theme="light"
        @change="handleMenuChange"
      >
        <t-menu-item value="dashboard">
          <template #icon><t-icon name="dashboard" /></template>
          数据概览
        </t-menu-item>

        <t-submenu value="user">
          <template #icon><t-icon name="user" /></template>
          <template #title>用户管理</template>
          <t-menu-item value="user-list">学员列表</t-menu-item>
          <t-menu-item value="user-referee">推荐关系查询</t-menu-item>
          <t-menu-item value="user-referee-logs">推荐人变更记录</t-menu-item>
        </t-submenu>

        <t-submenu value="order">
          <template #icon><t-icon name="order" /></template>
          <template #title>订单管理</template>
          <t-menu-item value="order-list">订单列表</t-menu-item>
          <t-menu-item value="order-refund">退款管理</t-menu-item>
          <t-menu-item value="withdraw-audit">提现审核</t-menu-item>
          <t-menu-item value="mall-goods">商城商品</t-menu-item>
          <t-menu-item value="exchange-records">兑换管理</t-menu-item>
        </t-submenu>

        <t-submenu value="course">
          <template #icon><t-icon name="file" /></template>
          <template #title>课程管理</template>
          <t-menu-item value="course-list">课程列表</t-menu-item>
          <t-menu-item value="schedule-list">排期管理</t-menu-item>
          <t-menu-item value="appointment-list">预约管理</t-menu-item>
          <t-menu-item value="case-list">案例管理</t-menu-item>
          <t-menu-item value="material-list">素材管理</t-menu-item>
        </t-submenu>

        <t-submenu value="ambassador">
          <template #icon><t-icon name="usergroup" /></template>
          <template #title>大使管理</template>
          <t-menu-item value="ambassador-list">大使列表</t-menu-item>
          <t-menu-item value="application-audit">申请审核</t-menu-item>
          <t-menu-item value="activity-list">活动管理</t-menu-item>
          <t-menu-item value="contract-list">合约管理</t-menu-item>
        </t-submenu>

        <t-submenu value="system">
          <template #icon><t-icon name="setting" /></template>
          <template #title>系统管理</template>
          <t-menu-item value="admin-list">管理员管理</t-menu-item>
          <t-menu-item value="config">系统配置</t-menu-item>
          <t-menu-item value="banner-list">轮播图管理</t-menu-item>
          <t-menu-item value="announcement-list">公告管理</t-menu-item>
          <t-menu-item value="feedback-list">反馈管理</t-menu-item>
          <t-menu-item value="notification-list">通知管理</t-menu-item>
          <t-menu-item value="level-config">等级配置</t-menu-item>
          <t-menu-item value="auto-test">🔍 接口健康检查</t-menu-item>
          <t-menu-item value="method-check">🔧 前端方法检查</t-menu-item>
          <t-menu-item value="button-test">🧪 按钮自动化测试</t-menu-item>
        </t-submenu>
      </t-menu>
    </div>
  `
};

if (typeof window !== 'undefined') {
  window.SidebarNavigation = {
    handleMenuChange,
    handleLogout,
    checkAdminAuth,
    useSidebarNavigation,
    SidebarMenu
  };

  // 修复布局：TDesign <t-layout> 嵌套时，内层需要横向排列（row）
  // 原来用 <t-aside> 时 TDesign 会自动加 row，现在换成自定义 <div> 需要手动指定
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .t-layout > .t-layout {
      flex-direction: row !important;
      overflow: hidden;
    }
    .t-layout > .t-layout > main.t-layout__content,
    .t-layout > .t-layout > .t-layout__content {
      flex: 1 !important;
      overflow-y: auto;
      min-width: 0;
      height: 100%;
    }
  `;
  document.head.appendChild(styleEl);
}
