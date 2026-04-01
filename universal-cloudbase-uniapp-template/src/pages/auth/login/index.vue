<!--
  页面说明：微信授权登录；须明示勾选协议后方可登录（合规）。
  路由参数：scene（扫码推广，可选）

  【登录页 Logo】
  - 品牌图：`brand-logo.png`（与本页同目录，166×166 px 透明底）。须 **`import` + `:src`**：模板里写死 `/static/...` 会与 payment 等页的静态图共用编译槽位 `_imports_0`，真机常表现为 image src 错位或空白。
-->
<template>
  <!-- 全屏渐变；左上角返回与 TdPageHeader 同款（边框旋转箭头），勿用 global page-header 的 ‹ 字符 -->
  <view class="page-container login-page-root">
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
      <view class="login-container">
        <view class="login-logo">
          <image
            class="login-logo__img"
            :src="loginBrandSrc"
            mode="aspectFit"
          />
        </view>

        <view class="login-title">天道文化课程平台</view>
        <view class="login-subtitle">传承国学智慧 · 弘扬天道文化</view>

        <view class="t-card t-card--bordered login-card">
          <view class="t-card__body">
            <button
              class="t-button t-button--theme-light t-button--variant-base t-button--block t-button--size-large"
              @click="handleWechatLogin"
            >
              <text class="t-button__icon">🔐</text>
              <text class="t-button__text">微信一键登录</text>
            </button>

            <!-- 明示同意：默认不勾选，禁止「登录即代表同意」文案 -->
            <view class="agree-row" @tap="toggleAgree">
              <checkbox
                :checked="agreedToTerms"
                class="agree-checkbox"
                color="#0052D9"
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
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { UserApi } from '@/api'
import loginBrandAsset from './brand-logo.png'

/** 同目录 import，避免与 common/assets 静态槽位冲突导致登录 logo 不显示 */
const loginBrandSrc = loginBrandAsset as string

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
 * 扫推广码进入时，微信会将 scene 参数注入 onLoad query（URL 编码）。
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
      throw new Error('获取微信登录凭证失败')
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
  background: transparent;
  position: relative;
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
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 32rpx 80rpx;
  width: 100%;
  box-sizing: border-box;
}

/** 登录 Logo：166×166 设计稿单位（750 宽下 166rpx），透明底、无圆形裁切与衬底 */
.login-logo {
  width: 166rpx;
  height: 166rpx;
  margin-bottom: 48rpx;
  flex-shrink: 0;
  display: block;
  background: transparent;
}

.login-logo__img {
  width: 100%;
  height: 100%;
  display: block;
}

.login-title {
  font-size: 48rpx;
  font-weight: 600;
  color: white;
  margin-bottom: 16rpx;
  text-align: center;
}

.login-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 48rpx;
  text-align: center;
}

.login-card {
  width: 100%;
  max-width: 680rpx;
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
  border-radius: $td-radius-default;
  border: none;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

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
