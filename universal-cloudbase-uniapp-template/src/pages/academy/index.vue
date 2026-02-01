<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <TdPageHeader title="商学院" :show-back="false" />

    <!-- Hero Banner -->
    <view class="hero-banner">
      <view class="hero-icon">🏛️</view>
      <view class="hero-title">孙膑道天道文化商学院</view>
      <view class="hero-subtitle">传承国学智慧 · 弘扬天道文化</view>
    </view>

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 商学院简介 -->
      <view class="t-card t-card--bordered section-card">
        <view class="t-card__header">
          <text class="t-card__title">📖 商学院简介</text>
        </view>
        <view class="t-card__body">
          <text class="intro-text">
            孙膑道天道文化商学院，致力于传承和弘扬中华优秀传统文化，特别是兵法文化和天道智慧。我们以孙膑兵法为核心，结合现代商业实践，为学员提供系统的国学教育和商业智慧培训。
          </text>
          <text class="intro-text">
            商学院秉承"修身、齐家、治企、平天下"的教育理念，通过初探班、密训班等多层次课程体系，帮助学员掌握天道智慧，提升人生格局，实现事业腾飞。
          </text>
        </view>
      </view>

      <!-- 核心理念 -->
      <view class="t-section-title t-section-title--simple">💡 核心理念</view>
      <view class="concepts-list">
        <view 
          v-for="(concept, index) in concepts" 
          :key="index"
          class="concept-card t-card t-card--bordered"
        >
          <view class="t-card__body">
            <view class="concept-content">
              <view class="concept-icon" :class="concept.iconClass">
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

      <!-- 讲师团队 -->
      <view class="t-section-title t-section-title--simple">👨‍🏫 讲师团队</view>
      <view class="t-card t-card--bordered section-card">
        <view class="t-card__body">
          <view 
            v-for="(teacher, index) in teachers" 
            :key="index"
            class="teacher-item"
            :class="{ 'teacher-item--last': index === teachers.length - 1 }"
          >
            <view class="teacher-avatar" :class="`teacher-avatar--${teacher.theme}`">
              <text class="teacher-avatar-text">{{ teacher.name.charAt(0) }}</text>
            </view>
            <view class="teacher-info">
              <text class="teacher-name">{{ teacher.name }}</text>
              <text class="teacher-role">{{ teacher.role }}</text>
              <text class="teacher-desc">{{ teacher.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 发展历程 -->
      <view class="t-section-title t-section-title--simple">📅 发展历程</view>
      <view class="t-card t-card--bordered section-card">
        <view class="t-card__body">
          <view class="timeline">
            <view 
              v-for="(item, index) in timeline" 
              :key="index"
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

      <!-- 荣誉资质 -->
      <view class="t-section-title t-section-title--simple">🏆 荣誉资质</view>
      <view class="honors-grid">
        <view 
          v-for="(honor, index) in honors" 
          :key="index"
          class="honor-card t-card t-card--bordered"
        >
          <view class="t-card__body honor-card-body">
            <text class="honor-icon">{{ honor.icon }}</text>
            <text class="honor-name">{{ honor.name }}</text>
          </view>
        </view>
      </view>

      <!-- 联系我们 -->
      <view class="t-card t-card--bordered section-card">
        <view class="t-card__header">
          <text class="t-card__title">📞 联系我们</text>
        </view>
        <view class="t-card__body">
          <view class="contact-list">
            <view 
              v-for="(item, index) in contacts" 
              :key="index"
              class="contact-item"
            >
              <text class="contact-label">{{ item.label }}</text>
              <text class="contact-value" :class="{ 'contact-value--link': item.isLink }">
                {{ item.value }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 核心理念数据
const concepts = ref([
  {
    icon: '☯️',
    iconClass: 'concept-icon--purple',
    name: '天道思维',
    description: '遵循自然规律，顺应天道运行，以天道智慧指导人生和事业'
  },
  {
    icon: '⚔️',
    iconClass: 'concept-icon--pink',
    name: '兵法智慧',
    description: '学习孙膑兵法，掌握战略思维，在商业竞争中运筹帷幄'
  },
  {
    icon: '🌱',
    iconClass: 'concept-icon--orange',
    name: '知行合一',
    description: '理论结合实践，学以致用，在实际生活和工作中践行天道智慧'
  },
  {
    icon: '🤝',
    iconClass: 'concept-icon--aqua',
    name: '传承弘扬',
    description: '传承中华文化，弘扬天道精神，让更多人受益于国学智慧'
  }
]);

// 讲师团队数据
const teachers = ref([
  {
    name: '张教授',
    role: '创始人 · 首席讲师',
    description: '国学大师，孙膑兵法研究专家，从事国学教育30余年，培养学员逾万人',
    theme: 'primary'
  },
  {
    name: '李老师',
    role: '特聘讲师 · 商业导师',
    description: '资深企业家，成功创办多家企业，擅长将天道智慧应用于商业实践',
    theme: 'success'
  },
  {
    name: '王老师',
    role: '特聘讲师 · 心理导师',
    description: '心理学博士，专注于国学智慧与心理健康结合，帮助学员修身养性',
    theme: 'warning'
  }
]);

// 发展历程数据
const timeline = ref([
  {
    year: '2024年',
    description: '推出线上课程体系，建立传播大使制度，学员突破5000人',
    color: '#0052D9'
  },
  {
    year: '2023年',
    description: '开设密训班课程，深度培养核心学员，成功案例不断涌现',
    color: '#00A870'
  },
  {
    year: '2022年',
    description: '正式成立商学院，推出初探班课程，吸引首批学员',
    color: '#D4AF37'
  },
  {
    year: '2021年',
    description: '筹备阶段，组建教研团队，开发课程体系',
    color: '#BBBBBB'
  }
]);

// 荣誉资质数据
const honors = ref([
  { icon: '🏅', name: '优秀国学教育机构' },
  { icon: '⭐', name: '年度最佳课程奖' },
  { icon: '📜', name: '文化传承贡献奖' },
  { icon: '💼', name: '企业培训示范单位' }
]);

// 联系方式数据
const contacts = ref([
  { label: '📧 邮箱', value: 'contact@tiandao.com', isLink: true },
  { label: '📱 电话', value: '400-123-4567', isLink: true },
  { label: '📍 地址', value: '北京市朝阳区国学大道888号', isLink: false },
  { label: '🕐 时间', value: '周一至周五 9:00-18:00', isLink: false }
]);
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// Hero Banner
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

.hero-subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

// 页面内容
.page-content {
  padding: $td-page-margin;
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

// 分节标题
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
  
  &--purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &--pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  &--orange {
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  }
  
  &--aqua {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }
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
  
  &--primary {
    background-color: $td-brand-color;
  }
  
  &--success {
    background-color: $td-success-color;
  }
  
  &--warning {
    background-color: $td-warning-color;
  }
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

.honor-name {
  display: block;
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

// 联系我们
.contact-list {
  display: flex;
  flex-direction: column;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $td-border-level-1;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-child {
    padding-top: 0;
  }
}

.contact-label {
  font-size: $td-font-size-base;
  color: $td-text-color-secondary;
}

.contact-value {
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  
  &--link {
    color: $td-brand-color;
  }
}
</style>

