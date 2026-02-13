<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { checkEnvironment, auth } from "./utils/cloudbase";

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

  // ========== CloudBase 登录状态检查 ==========
  if (checkEnvironment()) {
    try {
      setTimeout(async () => {
        const loginState = await auth.getLoginState();
        
        if (!loginState) {
          uni.reLaunch({
            url: '/pages/auth/login/index'
          });
        }
      }, 300);
    } catch (error) {
      console.error("检查登录状态失败:", error);
    }
  }
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
