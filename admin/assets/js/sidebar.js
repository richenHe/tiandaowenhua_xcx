/**
 * 天道文化后台管理 - 统一侧边导航栏组件
 * 提供可复用的侧边栏布局和导航逻辑
 */

// 导出侧边栏配置和方法
window.AdminSidebar = {
  /**
   * 菜单配置
   */
  menuConfig: [
    {
      value: 'dashboard',
      icon: 'dashboard',
      title: '数据概览',
      url: '../../index.html'
    },
    {
      value: 'user',
      icon: 'user',
      title: '用户管理',
      children: [
        { value: 'user-list', title: '学员列表', url: '../user/list.html' },
        { value: 'user-referee', title: '推荐人管理', url: '../user/referee.html' }
      ]
    },
    {
      value: 'order',
      icon: 'order',
      title: '订单管理',
      children: [
        { value: 'order-list', title: '订单列表', url: '../order/list.html' },
        { value: 'order-refund', title: '退款管理', url: '../order/refund.html' },
        { value: 'withdraw-audit', title: '提现审核', url: '../order/withdraw-audit.html' }
      ]
    },
    {
      value: 'course',
      icon: 'file',
      title: '课程管理',
      children: [
        { value: 'course-list', title: '课程列表', url: '../course/list.html' },
        { value: 'schedule-list', title: '排期管理', url: '../course/schedule.html' },
        { value: 'appointment-list', title: '预约管理', url: '../course/appointment.html' },
        { value: 'case-list', title: '案例管理', url: '../course/case.html' },
        { value: 'material-list', title: '资料管理', url: '../course/material.html' }
      ]
    },
    {
      value: 'ambassador',
      icon: 'usergroup',
      title: '大使管理',
      children: [
        { value: 'ambassador-list', title: '大使列表', url: '../ambassador/list.html' },
        { value: 'application-audit', title: '申请审核', url: '../ambassador/application-audit.html' },
        { value: 'activity-list', title: '活动管理', url: '../ambassador/activity.html' },
        { value: 'contract-list', title: '合约管理', url: '../ambassador/contract.html' }
      ]
    },
    {
      value: 'system',
      icon: 'setting',
      title: '系统管理',
      children: [
        { value: 'admin-list', title: '管理员管理', url: '../system/admin.html' },
        { value: 'config', title: '系统配置', url: '../system/config.html' },
        { value: 'announcement-list', title: '公告管理', url: '../system/announcement.html' },
        { value: 'feedback-list', title: '反馈管理', url: '../system/feedback.html' },
        { value: 'notification-list', title: '通知管理', url: '../system/notification.html' },
        { value: 'level-config', title: '等级配置', url: '../system/level-config.html' }
      ]
    }
  ],

  /**
   * 根据当前页面路径获取激活的菜单项
   */
  getActiveMenu() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    
    // 匹配规则映射
    const menuMap = {
      'list': 'user-list',
      'referee': 'user-referee',
      'withdraw-audit': 'withdraw-audit',
      'application-audit': 'application-audit',
      'level-config': 'level-config'
    };
    
    // 尝试从路径中提取模块和页面名称
    const pathParts = path.split('/');
    const module = pathParts[pathParts.length - 2]; // 获取父目录名
    
    // 优先使用映射表
    if (menuMap[filename]) {
      return menuMap[filename];
    }
    
    // 组合模块和文件名
    return `${module}-${filename}`;
  },

  /**
   * 处理菜单点击事件
   */
  handleMenuChange(value) {
    // 查找对应的菜单项
    let targetUrl = null;
    
    this.menuConfig.forEach(item => {
      if (item.value === value) {
        targetUrl = item.url;
      } else if (item.children) {
        const child = item.children.find(c => c.value === value);
        if (child) {
          targetUrl = child.url;
        }
      }
    });
    
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  },

  /**
   * 生成侧边栏 HTML
   */
  generateHTML(activeMenu) {
    return `
      <t-layout style="height: 100vh;">
        <!-- 顶部导航 -->
        <t-header height="64px" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          background: #fff;
          border-bottom: 1px solid #dcdcdc;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 18px; font-weight: 600; color: #333;">🎨 天道文化后台管理</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <span id="admin-name">管理员</span>
            <t-button size="small" id="logout-btn">退出</t-button>
          </div>
        </t-header>
        
        <t-layout>
          <!-- 侧边菜单 -->
          <t-aside width="240px" style="
            background: #fff;
            border-right: 1px solid #dcdcdc;
            overflow-y: auto;
          ">
            <t-menu
              id="sidebar-menu"
              value="${activeMenu}"
              default-expanded="['user', 'order', 'course', 'ambassador', 'system']"
              theme="light"
            >
              ${this.generateMenuItems()}
            </t-menu>
          </t-aside>
          
          <!-- 主内容区 -->
          <t-content id="main-content" style="
            padding: 24px;
            overflow-y: auto;
            background: #f5f5f5;
          ">
            <!-- 页面内容将被插入这里 -->
          </t-content>
        </t-layout>
      </t-layout>
    `;
  },

  /**
   * 生成菜单项 HTML
   */
  generateMenuItems() {
    return this.menuConfig.map(item => {
      if (item.children) {
        // 子菜单
        const childItems = item.children.map(child => 
          `<t-menu-item value="${child.value}">${child.title}</t-menu-item>`
        ).join('');
        
        return `
          <t-submenu value="${item.value}">
            <template #icon><t-icon name="${item.icon}" /></template>
            <template #title>${item.title}</template>
            ${childItems}
          </t-submenu>
        `;
      } else {
        // 单个菜单项
        return `
          <t-menu-item value="${item.value}">
            <template #icon><t-icon name="${item.icon}" /></template>
            ${item.title}
          </t-menu-item>
        `;
      }
    }).join('');
  },

  /**
   * 初始化侧边栏（用于完整布局的页面）
   */
  init(pageContentElement) {
    const activeMenu = this.getActiveMenu();
    
    // 替换整个 body 内容
    document.body.innerHTML = `
      <div id="app">
        ${this.generateHTML(activeMenu)}
      </div>
    `;
    
    // 将页面内容移动到主内容区
    const mainContent = document.getElementById('main-content');
    if (pageContentElement) {
      mainContent.appendChild(pageContentElement);
    }
    
    // 绑定事件
    this.bindEvents();
    
    // 加载管理员信息
    this.loadAdminInfo();
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 菜单点击事件
    const menu = document.getElementById('sidebar-menu');
    if (menu) {
      menu.addEventListener('change', (e) => {
        this.handleMenuChange(e.detail.value);
      });
    }
    
    // 退出登录
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        TDesign.DialogPlugin.confirm({
          header: '确认退出',
          body: '确定要退出登录吗？',
          onConfirm: () => {
            AdminAPI.logout();
          }
        });
      });
    }
  },

  /**
   * 加载管理员信息
   */
  loadAdminInfo() {
    try {
      const adminInfo = AdminAPI.getCurrentAdmin();
      if (adminInfo) {
        const nameEl = document.getElementById('admin-name');
        if (nameEl) {
          nameEl.textContent = adminInfo.real_name || adminInfo.username || '管理员';
        }
      }
    } catch (error) {
      console.error('加载管理员信息失败:', error);
    }
  },

  /**
   * 检查登录状态
   */
  checkAuth() {
    const adminInfo = AdminAPI.getCurrentAdmin();
    if (!adminInfo) {
      window.location.href = '../../login.html';
      return false;
    }
    return true;
  }
};

// 页面加载时自动检查登录状态
if (typeof window !== 'undefined' && window.AdminAPI) {
  // 检查是否是登录页
  if (!window.location.pathname.includes('login.html')) {
    AdminSidebar.checkAuth();
  }
}





