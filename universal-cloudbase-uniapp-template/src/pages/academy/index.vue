<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <TdPageHeader title="商学院" :show-back="false" />

    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else>
      <!-- Hero Banner（从接口读取，整张图片） -->
      <image
        v-if="heroSection && heroSection.content?.image"
        class="hero-banner-img"
        :src="heroSection.content.image"
        mode="widthFix"
      />
      <!-- Hero Banner 无图片时的 fallback -->
      <view v-else-if="heroSection" class="hero-banner">
        <view class="hero-icon">🏛️</view>
        <view class="hero-title">{{ heroSection.title || '商学院' }}</view>
      </view>

      <!-- 页面内容 -->
      <view class="page-content">
        <!-- 快捷入口（从接口读取，每项为图片卡片） -->
        <view v-if="quickAccessSection && quickAccessSection.content?.items?.length" class="quick-access-section">
          <view
            v-for="(item, index) in quickAccessSection.content.items"
            :key="'qa-' + index"
            class="quick-access-card"
            @tap="handleQuickAccess(item.link)"
          >
            <image
              v-if="item.image"
              class="quick-access-img"
              :src="item.image"
              mode="aspectFill"
            />
            <view v-else class="quick-access-body">
              <text class="quick-access-icon">📱</text>
            </view>
          </view>
        </view>

        <!-- 动态板块渲染 -->
        <template v-for="section in contentSections" :key="section.id">

          <!-- 商学院简介 -->
          <template v-if="section.section_type === 'intro'">
            <view class="t-card t-card--bordered section-card">
              <view class="t-card__header">
                <text class="t-card__title">{{ section.icon }} {{ section.title }}</text>
              </view>
              <view class="t-card__body">
                <text
                  v-for="(p, pi) in (section.content?.paragraphs || [])"
                  :key="'intro-' + section.id + '-' + pi"
                  class="intro-text"
                >{{ p }}</text>
              </view>
            </view>
          </template>

          <!-- 核心理念 -->
          <template v-if="section.section_type === 'concepts'">
            <view class="t-section-title t-section-title--simple">{{ section.icon }} {{ section.title }}</view>
            <view class="concepts-list">
              <view
                v-for="(concept, ci) in (section.content?.items || [])"
                :key="'concept-' + section.id + '-' + ci"
                class="concept-card t-card t-card--bordered"
              >
                <view class="t-card__body">
                  <view class="concept-content">
                    <image v-if="concept.image" class="concept-icon-img" :src="concept.image" mode="aspectFill" />
                    <view v-else class="concept-icon" :style="{ background: concept.color || '#667eea' }">
                      <text>{{ concept.icon }}</text>
                    </view>
                    <view class="concept-info">
                      <text class="concept-name">{{ concept.name }}</text>
                      <text class="concept-desc">{{ concept.description }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 讲师团队 -->
          <template v-if="section.section_type === 'teachers'">
            <view class="t-section-title t-section-title--simple">{{ section.icon }} {{ section.title }}</view>
            <view class="t-card t-card--bordered section-card">
              <view class="t-card__body">
                <view
                  v-for="(teacher, ti) in (section.content?.items || [])"
                  :key="'teacher-' + section.id + '-' + ti"
                  class="teacher-item"
                  :class="{ 'teacher-item--last': ti === (section.content?.items || []).length - 1 }"
                >
                  <!-- 真实头像 -->
                  <image
                    v-if="teacher.avatar"
                    class="teacher-avatar-img"
                    :src="teacher.avatar"
                    mode="aspectFill"
                  />
                  <!-- 文字头像 fallback -->
                  <view v-else class="teacher-avatar" :style="{ backgroundColor: teacher.theme || '#0052D9' }">
                    <text class="teacher-avatar-text">{{ teacher.name?.charAt(0) || '' }}</text>
                  </view>
                  <view class="teacher-info">
                    <text class="teacher-name">{{ teacher.name }}</text>
                    <text class="teacher-role">{{ teacher.role }}</text>
                    <text class="teacher-desc">{{ teacher.description }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 发展历程 -->
          <template v-if="section.section_type === 'timeline'">
            <view class="t-section-title t-section-title--simple">{{ section.icon }} {{ section.title }}</view>
            <view class="t-card t-card--bordered section-card">
              <view class="t-card__body">
                <view class="timeline">
                  <view
                    v-for="(item, ii) in (section.content?.items || [])"
                    :key="'timeline-' + section.id + '-' + ii"
                    class="timeline-item"
                  >
                    <view class="timeline-dot" :style="{ background: item.color }"></view>
                    <view class="timeline-content">
                      <text class="timeline-year">{{ item.year }}</text>
                      <text class="timeline-desc">{{ item.description }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 荣誉资质 -->
          <template v-if="section.section_type === 'honors'">
            <view class="t-section-title t-section-title--simple">{{ section.icon }} {{ section.title }}</view>
            <view class="honors-grid">
              <view
                v-for="(honor, hi) in (section.content?.items || [])"
                :key="'honor-' + section.id + '-' + hi"
                class="honor-card t-card t-card--bordered"
              >
                <view class="t-card__body honor-card-body">
                  <image v-if="honor.image" class="honor-image" :src="honor.image" mode="aspectFit" />
                  <text v-else class="honor-icon">{{ honor.icon }}</text>
                  <text class="honor-name">{{ honor.name }}</text>
                </view>
              </view>
            </view>
          </template>

        </template>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi } from '@/api/modules/course';
import { ensureLoggedIn } from '@/utils/auth-state';

/** 快捷入口中允许游客访问的路径前缀（其余跳转前需登录） */
function isGuestAllowedAcademyLink(url: string): boolean {
  const path = (url || '').split('?')[0];
  return (
    path.includes('/pages/academy/cases') ||
    path.includes('/pages/academy/materials') ||
    path.includes('/pages/common/')
  );
}

const loading = ref(true);
const sections = ref<any[]>([]);

const heroSection = computed(() =>
  sections.value.find(s => s.section_type === 'hero') || null
);

const quickAccessSection = computed(() =>
  sections.value.find(s => s.section_type === 'quick_access') || null
);

const contentSections = computed(() =>
  sections.value.filter(s => !['hero', 'quick_access'].includes(s.section_type))
);

const handleQuickAccess = (link: string) => {
  if (!link) return;
  if (!isGuestAllowedAcademyLink(link) && !ensureLoggedIn()) return;
  uni.navigateTo({ url: link });
};

const loadSections = async () => {
  try {
    loading.value = true;
    const res = await CourseApi.getAcademySections();
    sections.value = res?.list || [];
  } catch (e) {
    console.error('加载商学院板块失败:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSections();
});

onShow(() => {
  loadSections();
});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 加载状态
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: $td-text-color-secondary;
}

// Hero Banner（图片模式）
.hero-banner-img {
  width: 100%;
  display: block;
}

// Hero Banner（fallback 无图片时）
.hero-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.hero-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.hero-title {
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

// 页面内容
.page-content {
  padding: $td-page-margin;
}

// 快捷入口
.quick-access-section {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
  align-items: stretch;
}

.quick-access-card {
  flex: 1;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.quick-access-img {
  width: 100%;
  height: 100%;
}

.quick-access-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #00C4FF 0%, #0096D9 100%);
}

.quick-access-icon {
  font-size: 72rpx;
  filter: drop-shadow(0 2rpx 8rpx rgba(0, 0, 0, 0.1));
}

// 卡片
.t-card {
  background-color: $td-bg-color-container;
  border-radius: $td-radius-large;
  overflow: hidden;

  &--bordered {
    border: 2rpx solid $td-border-level-1;
  }

  &__header {
    padding: 32rpx;
    border-bottom: 2rpx solid $td-border-level-1;
  }

  &__title {
    font-size: $td-font-size-m;
    font-weight: $td-font-weight-semibold;
    color: $td-text-color-primary;
  }

  &__body {
    padding: 32rpx;
  }
}

.section-card {
  margin-bottom: 32rpx;
}

// 简介文本
.intro-text {
  display: block;
  line-height: 1.8;
  color: $td-text-color-secondary;
  font-size: $td-font-size-base;
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

// 核心理念列表
.concepts-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.concept-card {
  .t-card__body {
    padding: 24rpx;
  }
}

.concept-content {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.concept-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
}

.concept-icon-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.concept-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.concept-name {
  font-weight: 500;
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  margin-bottom: 12rpx;
}

.concept-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 讲师团队
.teacher-item {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding-bottom: 32rpx;
  border-bottom: 2rpx solid $td-border-level-1;

  &:not(&--last) {
    margin-bottom: 32rpx;
  }

  &--last {
    padding-bottom: 0;
    border-bottom: none;
    margin-bottom: 0;
  }
}

.teacher-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.teacher-avatar-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.teacher-avatar-text {
  font-size: 40rpx;
  font-weight: 600;
  color: white;
}

.teacher-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.teacher-name {
  font-weight: 600;
  font-size: 32rpx;
  color: $td-text-color-primary;
  margin-bottom: 12rpx;
}

.teacher-role {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 16rpx;
}

.teacher-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 时间轴
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding-bottom: 32rpx;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-top: 4rpx;
  flex-shrink: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    width: 2rpx;
    height: 80rpx;
    background-color: $td-border-level-1;
  }

  .timeline-item:last-child &::after {
    display: none;
  }
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.timeline-year {
  font-weight: 500;
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
}

.timeline-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 荣誉资质网格
.honors-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.honor-card-body {
  text-align: center;
  padding: 40rpx 24rpx !important;
}

.honor-icon {
  display: block;
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.honor-image {
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 16rpx;
}

.honor-name {
  display: block;
  font-size: 24rpx;
  color: $td-text-color-secondary;
}
</style>
