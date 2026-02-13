/**
 * 返回按钮组件 JavaScript
 * 自动处理返回上一页的逻辑
 */

(function() {
  'use strict';

  /**
   * 初始化返回按钮
   */
  function initBackButtons() {
    // 获取所有返回按钮
    const backButtons = document.querySelectorAll('.back-button, .page-header__back');
    
    backButtons.forEach(button => {
      // 如果已经处理过，跳过
      if (button.dataset.initialized === 'true') {
        return;
      }
      
      // 标记为已初始化
      button.dataset.initialized = 'true';
      
      // 添加点击事件
      button.addEventListener('click', handleBackClick);
    });
  }

  /**
   * 处理返回按钮点击
   */
  function handleBackClick(e) {
    const button = e.currentTarget;
    
    // 如果是禁用状态，不处理
    if (button.classList.contains('back-button--disabled')) {
      e.preventDefault();
      return;
    }
    
    // 获取返回模式
    const backMode = button.dataset.back || 'auto';
    
    // 如果是链接且有 href，让浏览器处理
    if (button.tagName === 'A' && button.getAttribute('href') && backMode !== 'auto') {
      // 已有 href 的链接，让浏览器自然跳转
      return;
    }
    
    // 阻止默认行为
    e.preventDefault();
    
    // 自动模式：优先使用 history.back()
    if (backMode === 'auto' || backMode === '') {
      // 检查是否有浏览历史
      if (window.history.length > 1) {
        window.history.back();
      } else if (backMode !== 'auto' && backMode !== '') {
        // 如果没有历史且指定了后备URL，跳转到后备页面
        window.location.href = backMode;
      } else {
        // 默认返回首页
        window.location.href = '../index/home.html';
      }
    } else {
      // 指定页面模式：直接跳转
      window.location.href = backMode;
    }
  }

  /**
   * 智能返回功能
   * 根据来源自动判断返回目标
   */
  function smartBack() {
    // 尝试从 document.referrer 获取来源页面
    const referrer = document.referrer;
    
    if (referrer && referrer.includes(window.location.hostname)) {
      // 如果来源是同域名，使用 history.back()
      window.history.back();
    } else if (window.history.length > 1) {
      // 有历史记录，返回上一页
      window.history.back();
    } else {
      // 没有来源信息，返回首页
      window.location.href = '../index/home.html';
    }
  }

  /**
   * 检查是否为主入口页面
   * 主入口页面不应该显示返回按钮
   */
  function checkMainEntryPages() {
    const currentPath = window.location.pathname;
    const mainPages = [
      '/index/home.html',
      '/course/my-courses.html',
      '/mine/index.html'
    ];
    
    // 检查是否为主入口页面
    const isMainPage = mainPages.some(page => currentPath.endsWith(page));
    
    if (isMainPage) {
      // 隐藏或禁用返回按钮
      const backButtons = document.querySelectorAll('.back-button, .page-header__back');
      backButtons.forEach(button => {
        button.style.visibility = 'hidden';
        button.classList.add('back-button--disabled');
      });
    }
  }

  /**
   * 页面加载完成后初始化
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initBackButtons();
      // checkMainEntryPages(); // 可选：自动隐藏主入口页面的返回按钮
    });
  } else {
    initBackButtons();
    // checkMainEntryPages(); // 可选：自动隐藏主入口页面的返回按钮
  }

  // 暴露给全局，方便调试和手动调用
  window.BackButton = {
    init: initBackButtons,
    smartBack: smartBack,
    checkMainPages: checkMainEntryPages
  };
})();









































