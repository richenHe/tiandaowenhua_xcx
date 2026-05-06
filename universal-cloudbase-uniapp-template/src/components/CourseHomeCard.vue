<template>
  <!-- 首页课程卡片：数据全部由 props 驱动，便于换文案或复用到其它列表 -->
  <view class="ch-card" @click="emit('click')">
    <view class="ch-media" :class="mediaModifier">
      <image
        v-if="coverSrc"
        class="ch-cover"
        :src="coverSrc"
        mode="aspectFill"
      />
      <text v-else class="ch-emoji">{{ placeholderEmoji }}</text>
    </view>
    <view class="ch-body">
      <view class="ch-main">
        <view class="ch-left">
          <view class="ch-type-row">
            <text class="ch-type">{{ typeLabel }}</text>
            <view
              v-if="badgeText"
              class="t-badge t-badge--standalone t-badge--size-small"
              :class="badgeThemeClass"
            >
              <view class="t-badge__inner">{{ badgeText }}</view>
            </view>
          </view>
          <text class="ch-price">{{ priceText }}</text>
        </view>
        <!-- 公共样式：t-btn-outline-pill；cta 单独冒泡拦截，便于商城「立即兑换」与整卡跳转分离 -->
        <view
          class="t-btn-outline-pill"
          :class="{ 't-btn-outline-pill--disabled': ctaDisabled }"
          @click.stop="onCtaTap"
        >
          <text class="t-btn-outline-pill__text">{{ ctaText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type CourseHomeCardTone = 'pink' | 'blue' | 'purple' | 'orange';

/** 可选角标主题，与全局 t-badge--theme-* 对齐 */
export type CourseHomeCardBadgeTheme = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const props = withDefaults(
  defineProps<{
    /** 封面 HTTPS；空则显示 emoji 占位 */
    coverSrc?: string;
    placeholderEmoji?: string;
    /** 无封面时渐变底色 */
    placeholderTone?: CourseHomeCardTone;
    /** 底部主文案：一般为课程类型名，如「初探班」 */
    typeLabel: string;
    /** 价格展示：如「¥1688」「1688功德分」「免费」 */
    priceText: string;
    /** 右侧胶囊文案（首页「查看详情」、商城「立即兑换」等） */
    ctaText: string;
    /** 为 true 时胶囊呈禁用视觉；点胶囊会触发与整卡相同的 click（如跳转详情） */
    ctaDisabled?: boolean;
    /** 类型行右侧可选徽标，如「热门」 */
    badgeText?: string;
    badgeTheme?: CourseHomeCardBadgeTheme;
  }>(),
  {
    coverSrc: '',
    placeholderEmoji: '📚',
    placeholderTone: 'pink',
    ctaDisabled: false,
    badgeText: '',
    badgeTheme: 'success'
  }
);

const emit = defineEmits<{
  click: [];
  /** 点击右侧胶囊且非禁用时触发（商城用于兑换） */
  'cta-click': [];
}>();

const mediaModifier = computed(() => `ch-media--${props.placeholderTone}`);

const badgeThemeClass = computed(() => `t-badge--theme-${props.badgeTheme}`);

/** 禁用态点胶囊：与点卡面一致走详情；可用态仅走兑换等业务 */
const onCtaTap = () => {
  if (props.ctaDisabled) {
    emit('click');
    return;
  }
  emit('cta-click');
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.ch-card {
  border-radius: $td-index-course-card-radius;
  overflow: hidden;
  border: 2rpx solid $td-border-level-1;
  box-shadow: $td-shadow-1;
  background-color: $td-bg-color-container;
}

.ch-media {
  width: 100%;
  height: 340rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &--pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &--blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &--purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &--orange {
    background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  }
}

.ch-cover {
  width: 100%;
  height: 100%;
  display: block;
}

.ch-emoji {
  font-size: 96rpx;
}

.ch-body {
  padding: 28rpx 32rpx 32rpx;
  background-color: $td-index-course-card-body-bg;
}

.ch-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.ch-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}

.ch-type-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.ch-type {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.ch-price {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-warning-color;
  line-height: 1.2;
}

</style>
