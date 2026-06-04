import { createSSRApp } from "vue";
import App from "./App.vue";
// import { initCloudBase } from "./utils/cloudbase";
import showCaptcha from "./components/show-captcha.vue";

export function createApp() {
  const app = createSSRApp(App);

  app.component("show-captcha", showCaptcha);

  // 全局页面分享配置：所有页面默认支持转发，统一跳转到首页
  app.mixin({
    onShareAppMessage() {
      return {
        title: '天道文化',
        path: '/pages/index/index'
      }
    },
    onShareTimeline() {
      return {
        title: '天道文化'
      }
    }
  });

  return {
    app,
  };
}
