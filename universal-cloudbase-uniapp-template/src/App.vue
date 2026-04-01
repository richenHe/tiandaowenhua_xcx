<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(async () => {
  // ========== 初始化 wx.cloud（微信支付等云调用必需） ==========
  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    console.error('wx.cloud 未定义，请检查微信开发者工具版本');
  } else {
    try {
      wx.cloud.init({
        env: 'cloud1-0gnn3mn17b581124', // 你的云开发环境ID
        traceUser: true
      });
      console.log('wx.cloud 初始化成功');
    } catch (error) {
      console.error('wx.cloud 初始化失败:', error);
    }
  }
  // #endif

  // 不在此强制跳转登录：允许游客浏览首页/商城/商学院（微信审核合规）。
  // 业务登录态见 utils/auth-state.ts；需登录的操作与「我的」Tab 在各自入口拦截。
});

onShow(() => {
  // App Show
});

onHide(() => {
  // App Hide
});
</script>

<style lang="scss">
/* 导入公共样式和组件样式 */
@import './styles/common.scss';
@import './styles/components/index.scss';
</style>
