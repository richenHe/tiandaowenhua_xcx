<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { checkEnvironment, auth } from "./utils/cloudbase";

onLaunch(async () => {
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
