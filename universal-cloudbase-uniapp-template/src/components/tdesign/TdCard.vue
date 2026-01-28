<template>
  <view class="t-card" :class="cardClass" @click="handleClick">
    <!-- 封面图 -->
    <view v-if="cover || $slots.cover" class="t-card__cover">
      <slot name="cover">
        <image v-if="cover" :src="cover" mode="aspectFill" class="t-card__cover-image" />
      </slot>
    </view>
    
    <!-- 头部 -->
    <view v-if="title || subtitle || $slots.header || $slots.actions" class="t-card__header" :class="{ 't-card__header--no-border': !bordered }">
      <view class="t-card__header-wrapper">
        <view class="t-card__header-content">
          <slot name="header">
            <view v-if="title" class="t-card__title">{{ title }}</view>
            <view v-if="subtitle" class="t-card__subtitle">{{ subtitle }}</view>
          </slot>
        </view>
        <view v-if="$slots.actions" class="t-card__actions">
          <slot name="actions"></slot>
        </view>
      </view>
      <view v-if="description" class="t-card__description">{{ description }}</view>
    </view>
    
    <!-- 主体内容 -->
    <view class="t-card__body" :class="{ 't-card__body--no-padding': noPadding }">
      <slot></slot>
    </view>
    
    <!-- 底部 -->
    <view v-if="$slots.footer" class="t-card__footer" :class="{ 't-card__footer--no-border': !bordered }">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** 描述 */
  description?: string
  /** 封面图 */
  cover?: string
  /** 是否显示边框 */
  bordered?: boolean
  /** 是否显示阴影 */
  shadow?: boolean | 'always' | 'hover'
  /** 是否紧凑模式 */
  compact?: boolean
  /** 内容区是否无内边距 */
  noPadding?: boolean
  /** 主题 */
  theme?: 'default' | 'accent-border' | 'accent-border-success' | 'accent-border-warning' | 'accent-border-error'
  /** 是否可点击 */
  clickable?: boolean
  /** 是否悬浮效果 */
  hoverable?: boolean
  /** 是否选中 */
  selected?: boolean
  /** 是否水平布局 */
  horizontal?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  description: '',
  cover: '',
  bordered: true,
  shadow: false,
  compact: false,
  noPadding: false,
  theme: 'default',
  clickable: false,
  hoverable: false,
  selected: false,
  horizontal: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

const cardClass = computed(() => ({
  't-card--bordered': props.bordered,
  't-card--shadow': props.shadow === true,
  't-card--shadow-always': props.shadow === 'always',
  't-card--shadow-hover': props.shadow === 'hover',
  't-card--compact': props.compact,
  't-card--accent-border': props.theme === 'accent-border',
  't-card--accent-border-success': props.theme === 'accent-border-success',
  't-card--accent-border-warning': props.theme === 'accent-border-warning',
  't-card--accent-border-error': props.theme === 'accent-border-error',
  't-card--clickable': props.clickable,
  't-card--hoverable': props.hoverable,
  't-card--selected': props.selected,
  't-card--horizontal': props.horizontal,
  't-card--disabled': props.disabled
}))

const handleClick = (e: Event) => {
  if (props.clickable) {
    emit('click', e)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: $td-bg-color-container;
  border-radius: $td-radius-default;
  overflow: hidden;
  transition: box-shadow $td-transition-duration-base $td-transition-timing-function;
}

.t-card--bordered {
  border: 2rpx solid $td-border-level-1;
}

.t-card--shadow {
  box-shadow: $td-shadow-1;
}

.t-card--shadow-always {
  box-shadow: $td-shadow-2;
}

.t-card--clickable {
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
  }
}

.t-card__cover {
  width: 100%;
}

.t-card__cover-image {
  width: 100%;
  height: 320rpx;
  display: block;
}

.t-card__header {
  padding: $td-comp-paddingTB-xl $td-comp-paddingLR-m;
  border-bottom: 2rpx solid $td-border-level-1;
}

.t-card__header--no-border {
  border-bottom: none;
}

.t-card__header-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.t-card__header-content {
  flex: 1;
  min-width: 0;
}

.t-card__title {
  font-size: $td-font-size-m;
  font-weight: $td-font-weight-semibold;
  color: $td-text-color-primary;
  line-height: $td-line-height-small;
}

.t-card__subtitle {
  margin-top: 8rpx;
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
  line-height: $td-line-height-base;
}

.t-card__description {
  margin-top: 16rpx;
  font-size: $td-font-size-base;
  color: $td-text-color-secondary;
  line-height: $td-line-height-base;
}

.t-card__actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
  margin-left: 24rpx;
}

.t-card__body {
  flex: 1;
  padding: $td-comp-paddingTB-xl $td-comp-paddingLR-m;
}

.t-card__body--no-padding {
  padding: 0;
}

.t-card__footer {
  padding: $td-comp-paddingTB-l $td-comp-paddingLR-m;
  border-top: 2rpx solid $td-border-level-1;
}

.t-card__footer--no-border {
  border-top: none;
}

.t-card--compact .t-card__header {
  padding: $td-comp-paddingTB-l $td-comp-paddingLR-s;
}

.t-card--compact .t-card__body {
  padding: $td-comp-paddingTB-l $td-comp-paddingLR-s;
}

.t-card--compact .t-card__footer {
  padding: $td-comp-paddingTB-m $td-comp-paddingLR-s;
}

// 强调边框
.t-card--accent-border {
  border-left: 6rpx solid $td-brand-color;
}

.t-card--accent-border-success {
  border-left: 6rpx solid $td-success-color;
}

.t-card--accent-border-warning {
  border-left: 6rpx solid $td-warning-color;
}

.t-card--accent-border-error {
  border-left: 6rpx solid $td-error-color;
}

// 悬浮效果（小程序用 active 代替）
.t-card--hoverable {
  &:active {
    box-shadow: $td-shadow-2;
    transform: translateY(-2rpx);
  }
}

// 选中状态
.t-card--selected {
  border-color: $td-brand-color;
  background-color: #F3F6FF;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    border-width: 32rpx;
    border-style: solid;
    border-color: $td-brand-color $td-brand-color transparent transparent;
  }
  
  &::after {
    content: '✓';
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    color: #FFFFFF;
    font-size: 20rpx;
    font-weight: 700;
  }
}

// 水平布局
.t-card--horizontal {
  flex-direction: row;
  
  .t-card__cover {
    width: 240rpx;
    height: 100%;
    flex-shrink: 0;
  }
  
  .t-card__cover-image {
    height: 100%;
  }
  
  .t-card__body {
    flex: 1;
  }
}

// 禁用状态
.t-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

// 悬浮阴影
.t-card--shadow-hover {
  &:active {
    box-shadow: $td-shadow-2;
  }
}

.t-card + .t-card {
  margin-top: $td-card-spacing;
}
</style>

