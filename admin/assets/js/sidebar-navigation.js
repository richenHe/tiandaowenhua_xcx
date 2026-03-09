/**
 * 侧边栏导航通用脚本
 * 提供统一的菜单切换、登出功能、权限过滤，以及可复用的 SidebarMenu Vue 组件
 */

function getBasePath() {
  return window.CONFIG?.BASE_PATH || '/tiandaowenhua/';
}

function getPathPrefix() {
  return getBasePath();
}

// URL 路由 → menu key 映射
const ROUTE_MAP = {
  'dashboard':          'dashboard.html',
  'user-list':          'pages/user/list.html',
  'user-referee':       'pages/user/referee.html',
  'evaluation-list':    'pages/user/evaluation.html',
  'user-courses':       'pages/user/user-courses.html',
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
  'academy-sections':   'pages/course/academy-sections.html',
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

// 反向映射：URL path → menu key（用于页面级权限校验）
const PATH_TO_KEY = {};
for (const [key, path] of Object.entries(ROUTE_MAP)) {
  PATH_TO_KEY[path] = key;
}

// 菜单结构定义（二级分组）
const MENU_STRUCTURE = [
  { key: 'user', children: ['user-list', 'user-referee', 'evaluation-list', 'user-courses'] },
  { key: 'order', children: ['order-list', 'order-refund', 'withdraw-audit', 'mall-goods', 'exchange-records'] },
  { key: 'course', children: ['course-list', 'schedule-list', 'appointment-list', 'case-list', 'material-list', 'academy-sections'] },
  { key: 'ambassador', children: ['ambassador-list', 'application-audit', 'activity-list', 'contract-list'] },
  { key: 'system', children: ['admin-list', 'config', 'banner-list', 'announcement-list', 'feedback-list', 'notification-list', 'level-config', 'auto-test', 'method-check', 'button-test'] }
];

/**
 * 获取当前管理员的权限列表
 */
function getAdminPermissions() {
  try {
    const raw = localStorage.getItem('admin_permissions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 检查是否有指定页面的权限
 */
function hasPagePermission(menuKey, permissions) {
  if (!permissions || permissions.length === 0) return true;
  if (permissions.includes('*')) return true;
  return permissions.includes(menuKey);
}

/**
 * 从当前 URL 反查 menu key
 */
function getCurrentMenuKey() {
  const pathname = window.location.pathname;
  for (const [path, key] of Object.entries(PATH_TO_KEY)) {
    if (pathname.endsWith(path) || pathname.endsWith('/' + path)) {
      return key;
    }
  }
  return null;
}

function handleMenuChange(value) {
  if (value === 'playground') {
    window.open(getPathPrefix() + 'playground.html', '_blank');
    return;
  }
  if (ROUTE_MAP[value]) {
    window.location.href = getPathPrefix() + ROUTE_MAP[value];
  }
}

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
 * 检查管理员登录状态 + 页面权限校验
 */
function checkAdminAuth() {
  const adminInfo = AdminAPI.getCurrentAdmin();
  if (!adminInfo) {
    window.location.href = getPathPrefix() + 'index.html';
    return null;
  }

  // 页面级权限校验
  const permissions = getAdminPermissions();
  if (permissions.length > 0 && !permissions.includes('*')) {
    const currentKey = getCurrentMenuKey();
    // 登录页、dashboard 不拦截；测试工具页面不拦截
    const skipKeys = ['auto-test', 'method-check', 'button-test'];
    if (currentKey && !skipKeys.includes(currentKey) && !permissions.includes(currentKey)) {
      TDesign.MessagePlugin.warning('您没有该页面的访问权限');
      window.location.href = getPathPrefix() + 'dashboard.html';
      return null;
    }
  }

  return adminInfo;
}

function useSidebarNavigation() {
  const { ref, onMounted } = Vue;
  const adminInfo = ref(null);

  onMounted(() => {
    adminInfo.value = checkAdminAuth();
  });

  return { adminInfo, handleMenuChange, handleLogout };
}

/**
 * SidebarMenu — 可复用 Vue 组件（带权限过滤）
 */
const SidebarMenu = {
  name: 'SidebarMenu',
  props: {
    activeKey: { type: String, default: 'dashboard' }
  },
  setup(props) {
    const permissions = getAdminPermissions();
    const isFullAccess = !permissions.length || permissions.includes('*');

    const hasPerm = (key) => isFullAccess || permissions.includes(key);

    // 判断一级菜单组是否有至少一个可见子项
    const hasGroupPerm = (groupKey) => {
      if (isFullAccess) return true;
      const group = MENU_STRUCTURE.find(g => g.key === groupKey);
      if (!group) return false;
      return group.children.some(childKey => permissions.includes(childKey));
    };

    return { handleMenuChange, hasPerm, hasGroupPerm };
  },
  template: `
    <div style="width:240px;min-width:240px;background:#fff;border-right:1px solid #dcdcdc;overflow-y:auto;flex-shrink:0;">
      <t-menu
        :value="activeKey"
        :default-expanded="['user','order','course','ambassador','system']"
        theme="light"
        @change="handleMenuChange"
      >
        <t-menu-item v-if="hasPerm('dashboard')" value="dashboard">
          <template #icon><t-icon name="dashboard" /></template>
          数据概览
        </t-menu-item>

        <t-submenu v-if="hasGroupPerm('user')" value="user">
          <template #icon><t-icon name="user" /></template>
          <template #title>用户管理</template>
          <t-menu-item v-if="hasPerm('user-list')" value="user-list">学员列表</t-menu-item>
          <t-menu-item v-if="hasPerm('user-referee')" value="user-referee">推荐关系查询</t-menu-item>
          <t-menu-item v-if="hasPerm('evaluation-list')" value="evaluation-list">评估名单</t-menu-item>
          <t-menu-item v-if="hasPerm('user-courses')" value="user-courses">用户课程</t-menu-item>
        </t-submenu>

        <t-submenu v-if="hasGroupPerm('order')" value="order">
          <template #icon><t-icon name="order" /></template>
          <template #title>订单管理</template>
          <t-menu-item v-if="hasPerm('order-list')" value="order-list">订单列表</t-menu-item>
          <t-menu-item v-if="hasPerm('order-refund')" value="order-refund">退款管理</t-menu-item>
          <t-menu-item v-if="hasPerm('withdraw-audit')" value="withdraw-audit">提现审核</t-menu-item>
          <t-menu-item v-if="hasPerm('mall-goods')" value="mall-goods">商城商品</t-menu-item>
          <t-menu-item v-if="hasPerm('exchange-records')" value="exchange-records">兑换管理</t-menu-item>
        </t-submenu>

        <t-submenu v-if="hasGroupPerm('course')" value="course">
          <template #icon><t-icon name="file" /></template>
          <template #title>课程管理</template>
          <t-menu-item v-if="hasPerm('course-list')" value="course-list">课程列表</t-menu-item>
          <t-menu-item v-if="hasPerm('schedule-list')" value="schedule-list">排期管理</t-menu-item>
          <t-menu-item v-if="hasPerm('appointment-list')" value="appointment-list">预约管理</t-menu-item>
          <t-menu-item v-if="hasPerm('case-list')" value="case-list">案例管理</t-menu-item>
          <t-menu-item v-if="hasPerm('material-list')" value="material-list">素材管理</t-menu-item>
          <t-menu-item v-if="hasPerm('academy-sections')" value="academy-sections">商学院板块</t-menu-item>
        </t-submenu>

        <t-submenu v-if="hasGroupPerm('ambassador')" value="ambassador">
          <template #icon><t-icon name="usergroup" /></template>
          <template #title>大使管理</template>
          <t-menu-item v-if="hasPerm('ambassador-list')" value="ambassador-list">大使列表</t-menu-item>
          <t-menu-item v-if="hasPerm('application-audit')" value="application-audit">申请审核</t-menu-item>
          <t-menu-item v-if="hasPerm('activity-list')" value="activity-list">活动管理</t-menu-item>
          <t-menu-item v-if="hasPerm('contract-list')" value="contract-list">合约管理</t-menu-item>
        </t-submenu>

        <t-submenu v-if="hasGroupPerm('system')" value="system">
          <template #icon><t-icon name="setting" /></template>
          <template #title>系统管理</template>
          <t-menu-item v-if="hasPerm('admin-list')" value="admin-list">管理员管理</t-menu-item>
          <t-menu-item v-if="hasPerm('config')" value="config">系统配置</t-menu-item>
          <t-menu-item v-if="hasPerm('banner-list')" value="banner-list">轮播图管理</t-menu-item>
          <t-menu-item v-if="hasPerm('announcement-list')" value="announcement-list">公告管理</t-menu-item>
          <t-menu-item v-if="hasPerm('feedback-list')" value="feedback-list">反馈管理</t-menu-item>
          <t-menu-item v-if="hasPerm('notification-list')" value="notification-list">通知管理</t-menu-item>
          <t-menu-item v-if="hasPerm('level-config')" value="level-config">等级配置</t-menu-item>
          <t-menu-item v-if="hasPerm('auto-test')" value="auto-test">🔍 接口健康检查</t-menu-item>
          <t-menu-item v-if="hasPerm('method-check')" value="method-check">🔧 前端方法检查</t-menu-item>
          <t-menu-item v-if="hasPerm('button-test')" value="button-test">🧪 按钮自动化测试</t-menu-item>
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
    SidebarMenu,
    getAdminPermissions,
    hasPagePermission
  };

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
