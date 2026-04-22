<!--
  页面说明：小程序快捷登录（uni.login）；须明示勾选协议后方可登录（合规）。
  登录按钮等可见文案避免出现「微信」字样及易与官方页面混淆的「授权登录」表述（平台审核要求）。
  路由参数：scene（扫码推广，可选）

  【登录页背景】
  - **禁止** view 的 `background-image: url(本地)`：模拟器可见、真机常空白。
  - 底图文件放在 **`src/static/auth/login-bg.jpg`**，用 **`<image :src="'/static/auth/login-bg.jpg'">` 全屏垫底**（主包固定路径，分包页最稳；勿仅用 import 进 /assets 哈希，易与 lazyCodeLoading/分包优化冲突）。
  - 单图建议压缩至约 200KB 内；操作区叠在底图上。
-->
<template>
  <!-- 全屏背景：image 组件真机可用；view 的本地 background-image 在真机常失效 -->
  <view class="page-container login-page-root">
    <image
      class="login-bg-layer"
      :src="loginBgSrc"
      mode="aspectFill"
      aria-hidden="true"
    />
    <view
      class="login-back-bar"
      :style="{ paddingTop: statusBarPx + 'px' }"
    >
      <view class="login-back-hit" @tap="handleBack">
        <view class="login-td-back">
          <view class="login-td-back__icon" />
        </view>
      </view>
    </view>

    <view class="login-body">
      <!-- 约位于底图副标题下方，避开山水区域；不同机型 cover 裁切略有差异 -->
      <view class="login-actions">
        <button
          class="t-button t-button--theme-light t-button--variant-base t-button--block t-button--size-large"
          @click="handleWechatLogin"
        >
          <text class="t-button__icon">🔐</text>
          <text class="t-button__text">一键快捷登录</text>
        </button>

        <!-- 明示同意：默认不勾选，禁止「登录即代表同意」文案 -->
        <view class="agree-row" @tap="toggleAgree">
          <checkbox
            :checked="agreedToTerms"
            class="agree-checkbox"
            :color="checkboxBrandColor"
            @tap.stop="toggleAgree"
          />
          <view class="agree-text-wrap">
            <text class="agree-text">已阅读并同意</text>
            <text class="agree-link" @tap.stop="goToAgreement">《用户服务协议》</text>
            <text class="agree-text">与</text>
            <text class="agree-link" @tap.stop="goToPrivacy">《隐私政策》</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { UserApi } from '@/api'

/**
 * 主包 static 路径：微信真机下分包引用 /assets 哈希图偶发不显示；
 * `/static/...` 随主包直出，不依赖 common 分包注入顺序。
 */
const loginBgSrc = '/static/auth/login-bg.jpg'

/** 小程序 checkbox 的 color 需实色字符串，与 $td-brand-color 一致 */
const checkboxBrandColor = '#0052D9'

/** 状态栏高度（px），用于返回按钮垂直对齐 */
const statusBarPx = ref(20)

onMounted(() => {
  try {
    statusBarPx.value = uni.getSystemInfoSync().statusBarHeight || 20
  } catch {
    statusBarPx.value = 20
  }
})

/** 与 TdPageHeader 一致：有栈则返回，否则回首页 Tab */
const handleBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

/** 是否已勾选协议（默认不勾选，符合审核要求） */
const agreedToTerms = ref(false)

const toggleAgree = () => {
  agreedToTerms.value = !agreedToTerms.value
}

/**
 * 扫推广码进入时，宿主环境会将 scene 参数注入 onLoad query（URL 编码）。
 * 格式示例：query.scene = "ref%3DTEST01" → 解码后 "ref=TEST01"
 * 该值传入 login 云函数后，由 login.js 在新用户注册时自动绑定推荐人。
 */
const sceneValue = ref<string | undefined>(undefined)

onLoad((options) => {
  if (options?.scene) {
    sceneValue.value = decodeURIComponent(options.scene)
    console.log('[login] 扫码进入，scene:', sceneValue.value)
  }
})

const handleWechatLogin = async () => {
  if (!agreedToTerms.value) {
    uni.showToast({
      title: '请先阅读并同意协议',
      icon: 'none',
      duration: 2500
    })
    return
  }

  uni.showLoading({
    title: '正在登录...'
  })

  try {
    const wxLoginResult = await new Promise<any>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      })
    })

    if (!wxLoginResult.code) {
      throw new Error('获取登录凭证失败')
    }

    const userInfo = await UserApi.login({
      code: wxLoginResult.code,
      scene: sceneValue.value || undefined
    })

    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    setTimeout(() => {
      if (userInfo.profile_completed === 0) {
        uni.navigateTo({
          url: '/pages/auth/complete-profile/index'
        })
      } else {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    }, 1000)
  } catch {
    uni.hideLoading()
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none',
      duration: 3000
    })
  }
}

const goToAgreement = () => {
  uni.navigateTo({ url: '/pages/common/user-agreement/index' })
}

const goToPrivacy = () => {
  uni.navigateTo({ url: '/pages/common/privacy-policy/index' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

/* 避免 common 里 page-container 灰底在渐变下露出一条 */
.login-page-root.page-container {
  min-height: 100vh;
  /* 底图未加载时避免纯白刺眼（与全局页灰底一致） */
  background-color: $td-bg-color-page;
  position: relative;
}

/* 全屏底图：与原先 background-size:cover + center top 对齐 */
.login-bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  object-fit: cover;
  object-position: center top;
}

.login-back-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  padding-left: $td-page-margin;
  pointer-events: none;
}

.login-back-hit {
  pointer-events: auto;
  min-height: 88rpx;
  display: flex;
  align-items: center;
}

/**
 * 与 components/tdesign/TdPageHeader.vue 内 .td-page-header__back / __back-icon 保持一致
 *（内页如引荐人列表使用该组件；全局 page-header.scss 的 t-page-header__back-icon 为字符 ‹，形态不同）
 */
.login-td-back {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: $td-text-color-primary;
}

.login-td-back__icon {
  width: 20rpx;
  height: 20rpx;
  border-left: 6rpx solid $td-text-color-primary;
  border-bottom: 6rpx solid $td-text-color-primary;
  transform: rotate(45deg);
  margin-right: 8rpx;
  box-sizing: content-box;
}

.login-body {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  box-sizing: border-box;
}

/**
 * 操作区：叠在底图副标题下方（百分比对齐底图构图），左右留白与山水区错开
 */
.login-actions {
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  width: 100%;
  max-width: 680rpx;
  margin-left: auto;
  margin-right: auto;
  padding: 0 $td-page-margin;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.agree-row {
  display: flex;
  flex-direction: row;
  /* 与协议文案首行垂直居中，避免方框偏高、文字偏上 */
  align-items: center;
  margin-top: 28rpx;
  padding: 0 8rpx;
  gap: 10rpx;
}

/**
 * 小程序原生 checkbox 默认偏大，scale 后与 26rpx 正文接近同一视觉量级；
 * transform-origin 靠左，避免缩放后与右侧文案间距异常。
 */
.agree-checkbox {
  flex-shrink: 0;
  transform: scale(0.72);
  transform-origin: left center;
}

.agree-text-wrap {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  /* 与 checkbox 缩放后的视觉中心对齐，略下移整行文案 */
  padding-top: 2rpx;
  line-height: 1.55;
}

.agree-text {
  font-size: 26rpx;
  color: $td-text-color-secondary;
}

.agree-link {
  font-size: 26rpx;
  color: $td-brand-color;
}

.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-round;
  border: none;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    /* 底图为浅米色时：白底不透明，区别于原先半透明浅蓝 */
    background-color: $td-bg-color-container;

    .t-button__text,
    .t-button__icon {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }

  &--block {
    width: 100%;
  }
}
</style>
