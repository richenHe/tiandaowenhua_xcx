<template>
  <view class="t-avatar" :class="avatarClass" :style="avatarStyle" @click="handleClick">
    <image v-if="src" :src="src" mode="aspectFill" class="t-avatar__image" />
    <view v-else-if="icon" class="t-avatar__icon">
      <text>{{ icon }}</text>
    </view>
    <view v-else class="t-avatar__text">
      {{ displayText }}
    </view>
    
    <!-- 状态徽章 -->
    <view v-if="status" class="t-avatar__status" :class="`t-avatar__status--${status}`"></view>
    
    <!-- 数字/文字徽标 -->
    <view v-else-if="badge" class="t-avatar__badge">
      <slot name="badge">
        <view class="t-avatar__badge-dot" v-if="badge === true"></view>
        <view class="t-avatar__badge-text" v-else>{{ badge }}</view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | number
type AvatarShape = 'circle' | 'round' | 'square'
type AvatarTheme = 'default' | 'primary' | 'success' | 'warning' | 'error'
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

interface Props {
  /** 图片地址 */
  src?: string
  /** 文字（取首字显示） */
  text?: string
  /** 图标 */
  icon?: string
  /** 尺寸 */
  size?: AvatarSize
  /** 形状 */
  shape?: AvatarShape
  /** 徽标 */
  badge?: boolean | string | number
  /** 背景色 */
  bgColor?: string
  /** 是否显示边框 */
  bordered?: boolean
  /** 主题 */
  theme?: AvatarTheme
  /** 状态 */
  status?: AvatarStatus
  /** 是否可点击 */
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  text: '',
  icon: '',
  size: 'medium',
  shape: 'circle',
  badge: false,
  bgColor: '',
  bordered: false,
  theme: 'default',
  status: undefined,
  clickable: false
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

const handleClick = (e: Event) => {
  if (props.clickable) {
    emit('click', e)
  }
}

const avatarClass = computed(() => {
  const classes: Record<string, boolean> = {
    [`t-avatar--shape-${props.shape}`]: true,
    [`t-avatar--theme-${props.theme}`]: props.theme !== 'default',
    't-avatar--bordered': props.bordered,
    't-avatar--clickable': props.clickable
  }
  
  if (typeof props.size === 'string') {
    classes[`t-avatar--size-${props.size}`] = true
  }
  
  return classes
})

const avatarStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (typeof props.size === 'number') {
    style.width = props.size + 'rpx'
    style.height = props.size + 'rpx'
    style.fontSize = (props.size / 2) + 'rpx'
  }
  
  if (props.bgColor) {
    style.backgroundColor = props.bgColor
  }
  
  return style
})

const displayText = computed(() => {
  if (props.text) {
    return props.text.charAt(0).toUpperCase()
  }
  return ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  background-color: $td-bg-color-container-active;
  color: $td-text-color-secondary;
  font-size: $td-font-size-m;
  font-weight: $td-font-weight-medium;
  overflow: hidden;
  vertical-align: middle;
  border-radius: 50%;
  flex-shrink: 0;
}

.t-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.t-avatar__icon {
  font-size: 40rpx;
}

.t-avatar__text {
  font-size: inherit;
  text-transform: uppercase;
}

// 尺寸
.t-avatar--size-small {
  width: 56rpx;
  height: 56rpx;
  font-size: $td-font-size-s;
  
  .t-avatar__icon {
    font-size: 28rpx;
  }
}

.t-avatar--size-medium {
  width: 80rpx;
  height: 80rpx;
  font-size: $td-font-size-m;
  
  .t-avatar__icon {
    font-size: 40rpx;
  }
}

.t-avatar--size-large {
  width: 128rpx;
  height: 128rpx;
  font-size: $td-font-size-xl;
  
  .t-avatar__icon {
    font-size: 64rpx;
  }
}

.t-avatar--size-extra-large {
  width: 160rpx;
  height: 160rpx;
  font-size: $td-font-size-xxl;
  
  .t-avatar__icon {
    font-size: 80rpx;
  }
}

// 形状
.t-avatar--shape-circle {
  border-radius: 50%;
}

.t-avatar--shape-round {
  border-radius: $td-radius-default;
}

.t-avatar--shape-square {
  border-radius: 0;
}

// 边框
.t-avatar--bordered {
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 0 0 2rpx rgba(0, 0, 0, 0.1);
}

// 徽标
.t-avatar__badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(30%, -30%);
}

.t-avatar__badge-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: $td-error-color;
  border-radius: 50%;
  border: 4rpx solid #FFFFFF;
}

.t-avatar__badge-text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 12rpx;
  background-color: $td-error-color;
  color: #FFFFFF;
  font-size: $td-font-size-xs;
  border-radius: 32rpx;
  border: 4rpx solid #FFFFFF;
}

// 主题
.t-avatar--theme-primary {
  background: linear-gradient(135deg, $td-brand-color, #266FE8);
  color: #FFFFFF;
}

.t-avatar--theme-success {
  background: linear-gradient(135deg, $td-success-color, #00C178);
  color: #FFFFFF;
}

.t-avatar--theme-warning {
  background: linear-gradient(135deg, $td-warning-color, #E8C547);
  color: #FFFFFF;
}

.t-avatar--theme-error {
  background: linear-gradient(135deg, $td-error-color, #F16B6F);
  color: #FFFFFF;
}

// 状态徽章
.t-avatar__status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24rpx;
  height: 24rpx;
  border: 4rpx solid #FFFFFF;
  border-radius: 50%;
  background-color: $td-border-level-2;
}

.t-avatar__status--online {
  background-color: $td-success-color;
}

.t-avatar__status--offline {
  background-color: $td-border-level-2;
}

.t-avatar__status--busy {
  background-color: $td-error-color;
}

.t-avatar__status--away {
  background-color: $td-warning-color;
}

// 可点击
.t-avatar--clickable {
  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

// 额外尺寸
.t-avatar--size-xlarge {
  width: 128rpx;
  height: 128rpx;
  font-size: $td-font-size-l;
  
  .t-avatar__icon {
    font-size: 64rpx;
  }
}

.t-avatar--size-xxlarge {
  width: 160rpx;
  height: 160rpx;
  font-size: $td-font-size-xl;
  
  .t-avatar__icon {
    font-size: 80rpx;
  }
}
</style>

