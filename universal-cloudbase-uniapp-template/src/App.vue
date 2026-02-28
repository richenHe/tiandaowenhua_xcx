<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { checkEnvironment } from "./utils/cloudbase";

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

  // ========== 登录状态检查 ==========
  // MP-WEIXIN 使用 wx.cloud.callFunction()，不走 CloudBase JS SDK auth。
  // auth.getLoginState() 对 wx.cloud 用户始终返回 null，不能用于判断登录态。
  // 改用本地存储：响应拦截器在每次成功 API 调用后写入 userInfo.profile_completed。
  const storedUser = uni.getStorageSync('userInfo');
  const isLoggedIn = storedUser && storedUser.profile_completed !== undefined;
  if (!isLoggedIn) {
    uni.reLaunch({ url: '/pages/auth/login/index' });
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
