/**
 * 侧边导航栏模板生成器
 * 用于批量为页面添加侧边导航栏
 */

// 顶部导航栏和侧边菜单的完整 HTML
const SIDEBAR_LAYOUT_START = `    <!-- 侧边导航栏布局 -->
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
          <span>{{ adminInfo?.real_name || adminInfo?.username || '管理员' }}</span>
          <t-button size="small" @click="handleLogout">退出</t-button>
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
            value="MENU_VALUE"
            :default-expanded="['user', 'order', 'course', 'ambassador', 'system']"
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
              <t-menu-item value="user-referee">推荐人管理</t-menu-item>
            </t-submenu>
            
            <t-submenu value="order">
              <template #icon><t-icon name="order" /></template>
              <template #title>订单管理</template>
              <t-menu-item value="order-list">订单列表</t-menu-item>
              <t-menu-item value="order-refund">退款管理</t-menu-item>
              <t-menu-item value="withdraw-audit">提现审核</t-menu-item>
            </t-submenu>
            
            <t-submenu value="course">
              <template #icon><t-icon name="file" /></template>
              <template #title>课程管理</template>
              <t-menu-item value="course-list">课程列表</t-menu-item>
              <t-menu-item value="schedule-list">排期管理</t-menu-item>
              <t-menu-item value="appointment-list">预约管理</t-menu-item>
              <t-menu-item value="case-list">案例管理</t-menu-item>
              <t-menu-item value="material-list">资料管理</t-menu-item>
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
              <t-menu-item value="announcement-list">公告管理</t-menu-item>
              <t-menu-item value="feedback-list">反馈管理</t-menu-item>
              <t-menu-item value="notification-list">通知管理</t-menu-item>
              <t-menu-item value="level-config">等级配置</t-menu-item>
            </t-submenu>
          </t-menu>
        </t-aside>
        
        <!-- 主内容区 -->
        <t-content class="page-content">`;

const SIDEBAR_LAYOUT_END = `        </t-content>
      </t-layout>
    </t-layout>`;

// Vue setup 函数的侧边栏相关代码
const SIDEBAR_SETUP_CODE = `        // 管理员信息
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
        `;

// 样式修改
const SIDEBAR_STYLES = `  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      height: 100%;
      overflow: hidden;
    }
    
    .page-content {
      height: 100%;
      overflow-y: auto;
      background: #f5f5f5;
      padding: 24px;
    }
    
    .page-header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-title {
      font-size: 20px;
      font-weight: 600;
    }
    
    .search-form {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .table-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
    }
    
    .form-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
    }
  </style>`;

// 页面配置
const PAGE_CONFIG = {
  'user/referee.html': { menuValue: 'user-referee', title: '推荐人管理' },
  'order/list.html': { menuValue: 'order-list', title: '订单列表' },
  'order/refund.html': { menuValue: 'order-refund', title: '退款管理' },
  'order/withdraw-audit.html': { menuValue: 'withdraw-audit', title: '提现审核' },
  'course/list.html': { menuValue: 'course-list', title: '课程列表' },
  'course/schedule.html': { menuValue: 'schedule-list', title: '排期管理' },
  'course/appointment.html': { menuValue: 'appointment-list', title: '预约管理' },
  'course/case.html': { menuValue: 'case-list', title: '案例管理' },
  'course/material.html': { menuValue: 'material-list', title: '资料管理' },
  'ambassador/list.html': { menuValue: 'ambassador-list', title: '大使列表' },
  'ambassador/application-audit.html': { menuValue: 'application-audit', title: '申请审核' },
  'ambassador/activity.html': { menuValue: 'activity-list', title: '活动管理' },
  'ambassador/contract.html': { menuValue: 'contract-list', title: '合约管理' },
  'system/admin.html': { menuValue: 'admin-list', title: '管理员管理' },
  'system/config.html': { menuValue: 'config', title: '系统配置' },
  'system/announcement.html': { menuValue: 'announcement-list', title: '公告管理' },
  'system/feedback.html': { menuValue: 'feedback-list', title: '反馈管理' },
  'system/notification.html': { menuValue: 'notification-list', title: '通知管理' },
  'system/level-config.html': { menuValue: 'level-config', title: '等级配置' }
};

module.exports = {
  SIDEBAR_LAYOUT_START,
  SIDEBAR_LAYOUT_END,
  SIDEBAR_SETUP_CODE,
  SIDEBAR_STYLES,
  PAGE_CONFIG
};




