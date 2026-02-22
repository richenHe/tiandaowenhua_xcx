/**
 * Vue Router 路由守卫示例
 * 用于保护管理后台页面，要求用户登录后才能访问
 */

import { createRouter, createWebHistory } from 'vue-router';
import AdminAPI from '@/utils/admin-api';

const routes = [
  // 登录页（无需鉴权）
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/admin/LoginPage.vue'),
    meta: { requiresAuth: false }
  },

  // 管理后台（需要鉴权）
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // 仪表盘
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },

      // 用户管理
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/admin/UserList.vue')
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/admin/UserDetail.vue')
      },

      // 订单管理
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/admin/OrderList.vue')
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/admin/OrderDetail.vue')
      },

      // 课程管理
      {
        path: 'courses',
        name: 'CourseList',
        component: () => import('@/views/admin/CourseList.vue')
      },
      {
        path: 'courses/create',
        name: 'CourseCreate',
        component: () => import('@/views/admin/CourseEdit.vue')
      },
      {
        path: 'courses/:id/edit',
        name: 'CourseEdit',
        component: () => import('@/views/admin/CourseEdit.vue')
      },

      // 大使管理
      {
        path: 'ambassadors',
        name: 'AmbassadorList',
        component: () => import('@/views/admin/AmbassadorList.vue')
      },
      {
        path: 'ambassadors/:id',
        name: 'AmbassadorDetail',
        component: () => import('@/views/admin/AmbassadorDetail.vue')
      },
      {
        path: 'ambassador-applications',
        name: 'ApplicationList',
        component: () => import('@/views/admin/ApplicationList.vue')
      },

      // 系统管理
      {
        path: 'feedback',
        name: 'FeedbackList',
        component: () => import('@/views/admin/FeedbackList.vue')
      },
      {
        path: 'announcements',
        name: 'AnnouncementList',
        component: () => import('@/views/admin/AnnouncementList.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/admin/Settings.vue')
      }
    ]
  },

  // 默认重定向
  {
    path: '/',
    redirect: '/admin/dashboard'
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 全局前置守卫
 * 在每次路由跳转前执行
 */
router.beforeEach((to, from, next) => {
  // 检查路由是否需要鉴权
  const requiresAuth = to.meta.requiresAuth;

  // 不需要鉴权的页面直接放行
  if (requiresAuth === false) {
    next();
    return;
  }

  // 需要鉴权：检查是否已登录
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // 未登录，跳转到登录页
    console.log('未登录，跳转到登录页');
    next({
      path: '/admin/login',
      query: { redirect: to.fullPath }  // 保存目标路径，登录后自动跳转
    });
    return;
  }

  // 已登录，验证 Token 是否有效
  const adminInfo = AdminAPI.getCurrentAdmin();

  if (!adminInfo) {
    // Token 存在但管理员信息不存在（异常情况）
    console.log('管理员信息不存在，清除 Token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    next({
      path: '/admin/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // 一切正常，放行
  next();
});

/**
 * 全局后置钩子
 * 在路由跳转完成后执行
 */
router.afterEach((to, from) => {
  // 设置页面标题
  const title = to.meta.title || '管理后台';
  document.title = `${title} - 天道文化`;

  // 记录页面访问日志（可选）
  console.log(`导航到: ${to.path}`, {
    from: from.path,
    to: to.path,
    admin: AdminAPI.getCurrentAdmin()?.username
  });
});

/**
 * 错误处理
 */
router.onError((error) => {
  console.error('路由错误:', error);

  // 处理 Token 过期错误
  if (error.message.includes('登录已过期')) {
    AdminAPI.logout();
  }
});

export default router;









