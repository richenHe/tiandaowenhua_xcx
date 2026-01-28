<template>
  <view class="t-cell" :class="cellClass" @click="handleClick">
    <!-- 左侧图标 -->
    <view v-if="leftIcon || $slots.leftIcon" class="t-cell__left-icon">
      <slot name="leftIcon">
        <text>{{ leftIcon }}</text>
      </slot>
    </view>
    
    <!-- 头像 -->
    <view v-if="avatar || $slots.avatar" class="t-cell__avatar">
      <slot name="avatar">
        <image v-if="avatar" :src="avatar" mode="aspectFill" class="t-cell__avatar-image" />
      </slot>
    </view>
    
    <!-- 内容区 -->
    <view class="t-cell__content">
      <view class="t-cell__title">
        <slot name="title">{{ title }}</slot>
      </view>
      <view v-if="description || $slots.description" class="t-cell__description">
        <slot name="description">{{ description }}</slot>
      </view>
    </view>
    
    <!-- 右侧内容 -->
    <view v-if="note || $slots.note" class="t-cell__note">
      <slot name="note">{{ note }}</slot>
    </view>
    
    <!-- 右侧图标 -->
    <view v-if="arrow || rightIcon || $slots.rightIcon" class="t-cell__right-icon">
      <slot name="rightIcon">
        <text v-if="arrow">›</text>
        <text v-else>{{ rightIcon }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type CellAlign = 'top' | 'middle' | 'bottom'
type CellSize = 'small' | 'medium' | 'large'

interface Props {
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 右侧说明文字 */
  note?: string
  /** 左侧图标 */
  leftIcon?: string
  /** 右侧图标 */
  rightIcon?: string
  /** 头像 */
  avatar?: string
  /** 是否显示箭头 */
  arrow?: boolean
  /** 是否显示边框 */
  bordered?: boolean
  /** 是否可点击 */
  clickable?: boolean
  /** 跳转链接 */
  url?: string
  /** 是否必填 */
  required?: boolean
  /** 对齐方式 */
  align?: CellAlign
  /** 尺寸 */
  size?: CellSize
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  note: '',
  leftIcon: '',
  rightIcon: '',
  avatar: '',
  arrow: false,
  bordered: true,
  clickable: false,
  url: '',
  required: false,
  align: 'middle',
  size: 'medium'
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

const cellClass = computed(() => ({
  't-cell--bordered': props.bordered,
  't-cell--clickable': props.clickable || props.arrow || props.url,
  't-cell--required': props.required,
  [`t-cell--${props.align}`]: true,
  [`t-cell--size-${props.size}`]: true
}))

const handleClick = (e: Event) => {
  emit('click', e)
  
  if (props.url) {
    if (props.url.startsWith('/pages/')) {
      uni.navigateTo({ url: props.url })
    } else {
      uni.switchTab({ url: props.url })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-cell {
  display: flex;
  align-items: center;
  padding: $td-comp-paddingTB-l $td-page-margin;
  background-color: $td-bg-color-container;
  transition: background-color $td-transition-duration-base;
}

.t-cell--bordered {
  border-bottom: 2rpx solid $td-border-level-1;
}

.t-cell--clickable {
  cursor: pointer;
  
  &:active {
    background-color: $td-bg-color-container-active;
  }
}

.t-cell--top {
  align-items: flex-start;
  
  .t-cell__left-icon {
    margin-top: 4rpx;
  }
}

.t-cell--middle {
  align-items: center;
}

.t-cell--size-small {
  padding: $td-comp-paddingTB-m $td-page-margin;
  
  .t-cell__title {
    font-size: $td-font-size-s;
  }
}

.t-cell--size-large {
  padding: $td-comp-paddingTB-xl $td-page-margin;
  
  .t-cell__title {
    font-size: $td-font-size-m;
  }
}

.t-cell--required .t-cell__title::before {
  content: '*';
  margin-right: 8rpx;
  color: $td-error-color;
}

.t-cell__left-icon {
  flex-shrink: 0;
  margin-right: 24rpx;
  font-size: 40rpx;
  color: $td-text-color-secondary;
}

.t-cell__avatar {
  flex-shrink: 0;
  margin-right: 24rpx;
}

.t-cell__avatar-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: $td-radius-default;
}

.t-cell__content {
  flex: 1;
  min-width: 0;
}

.t-cell__title {
  font-size: $td-font-size-base;
  font-weight: $td-font-weight-medium;
  color: $td-text-color-primary;
  line-height: $td-line-height-base;
}

.t-cell__description {
  margin-top: 8rpx;
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
  line-height: $td-line-height-base;
}

.t-cell__note {
  flex-shrink: 0;
  margin-left: 24rpx;
  font-size: $td-font-size-base;
  color: $td-text-color-secondary;
  text-align: right;
}

.t-cell__right-icon {
  flex-shrink: 0;
  margin-left: 8rpx;
  font-size: 32rpx;
  color: $td-text-color-placeholder;
}
</style>

