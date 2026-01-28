<template>
  <view class="page-container">
    <TdPageHeader title="商学院" :show-back="true" :show-action="true" action-icon="📤" />

    <scroll-view class="scroll-content" scroll-y>
      <!-- Hero Banner -->
      <view class="hero-banner">
        <text class="hero-emoji">🏛️</text>
        <text class="hero-title">孙膑道天道文化商学院</text>
        <text class="hero-subtitle">传承国学智慧 · 弘扬天道文化</text>
      </view>

      <view class="page-content">
        <!-- 商学院简介 -->
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__header">
            <view class="t-card__title">📖 商学院简介</view>
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
        <view class="section-title">💡 核心理念</view>
        <view class="concept-grid">
          <view 
            v-for="(concept, index) in conceptList" 
            :key="index"
            class="t-card t-card--bordered concept-card"
          >
            <view class="t-card__body">
              <view class="concept-item">
                <view class="concept-icon" :style="{ background: concept.gradient }">
                  <text class="concept-emoji">{{ concept.emoji }}</text>
                </view>
                <view class="concept-content">
                  <text class="concept-title">{{ concept.title }}</text>
                  <text class="concept-desc">{{ concept.desc }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 讲师团队 -->
        <view class="section-title">👨‍🏫 讲师团队</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view 
              v-for="(teacher, index) in teacherList" 
              :key="index"
              class="teacher-item"
              :class="{ 'teacher-item--border': index < teacherList.length - 1 }"
            >
              <view class="t-avatar t-avatar--size-xlarge" :class="`t-avatar--theme-${teacher.theme}`">
                <text class="t-avatar__text">{{ teacher.avatar }}</text>
              </view>
              <view class="teacher-info">
                <text class="teacher-name">{{ teacher.name }}</text>
                <text class="teacher-role">{{ teacher.role }}</text>
                <text class="teacher-desc">{{ teacher.desc }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 发展历程 -->
        <view class="section-title">📅 发展历程</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="t-timeline">
              <view 
                v-for="(item, index) in timelineList" 
                :key="index"
                class="t-timeline-item"
              >
                <view class="t-timeline-item__dot" :style="{ background: item.color }"></view>
                <view class="t-timeline-item__content">
                  <text class="timeline-year">{{ item.year }}</text>
                  <text class="timeline-desc">{{ item.desc }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 荣誉资质 -->
        <view class="section-title">🏆 荣誉资质</view>
        <view class="honor-grid">
          <view 
            v-for="(honor, index) in honorList" 
            :key="index"
            class="t-card t-card--bordered honor-card"
          >
            <view class="t-card__body honor-body">
              <text class="honor-emoji">{{ honor.emoji }}</text>
              <text class="honor-text">{{ honor.text }}</text>
            </view>
          </view>
        </view>

        <!-- 联系我们 -->
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__header">
            <view class="t-card__title">📞 联系我们</view>
          </view>
          <view class="t-card__body">
            <view class="t-list">
              <view 
                v-for="(contact, index) in contactList" 
                :key="index"
                class="t-list-item"
              >
                <view class="t-list-item__meta">{{ contact.label }}</view>
                <view 
                  class="t-list-item__content" 
                  :class="{ 'contact-link': contact.isLink }"
                >
                  {{ contact.value }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 核心理念数据
const conceptList = ref([
  {
    emoji: '☯️',
    title: '天道思维',
    desc: '遵循自然规律，顺应天道运行，以天道智慧指导人生和事业',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    emoji: '⚔️',
    title: '兵法智慧',
    desc: '学习孙膑兵法，掌握战略思维，在商业竞争中运筹帷幄',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    emoji: '🌱',
    title: '知行合一',
    desc: '理论结合实践，学以致用，在实际生活和工作中践行天道智慧',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  },
  {
    emoji: '🤝',
    title: '传承弘扬',
    desc: '传承中华文化，弘扬天道精神，让更多人受益于国学智慧',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
]);

// 讲师团队数据
const teacherList = ref([
  {
    avatar: '张',
    name: '张教授',
    role: '创始人 · 首席讲师',
    desc: '国学大师，孙膑兵法研究专家，从事国学教育30余年，培养学员逾万人',
    theme: 'primary'
  },
  {
    avatar: '李',
    name: '李老师',
    role: '特聘讲师 · 商业导师',
    desc: '资深企业家，成功创办多家企业，擅长将天道智慧应用于商业实践',
    theme: 'success'
  },
  {
    avatar: '王',
    name: '王老师',
    role: '特聘讲师 · 心理导师',
    desc: '心理学博士，专注于国学智慧与心理健康结合，帮助学员修身养性',
    theme: 'warning'
  }
]);

// 发展历程数据
const timelineList = ref([
  {
    year: '2024年',
    desc: '推出线上课程体系，建立传播大使制度，学员突破5000人',
    color: '#0052D9'
  },
  {
    year: '2023年',
    desc: '开设密训班课程，深度培养核心学员，成功案例不断涌现',
    color: '#00A870'
  },
  {
    year: '2022年',
    desc: '正式成立商学院，推出初探班课程，吸引首批学员',
    color: '#E37318'
  },
  {
    year: '2021年',
    desc: '筹备阶段，组建教研团队，开发课程体系',
    color: '#BBBBBB'
  }
]);

// 荣誉资质数据
const honorList = ref([
  { emoji: '🏅', text: '优秀国学教育机构' },
  { emoji: '⭐', text: '年度最佳课程奖' },
  { emoji: '📜', text: '文化传承贡献奖' },
  { emoji: '💼', text: '企业培训示范单位' }
]);

// 联系方式数据
const contactList = ref([
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
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  height: 0;
}

// Hero Banner
.hero-banner {
  height: 400rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  text-align: center;
  padding: 48rpx;
}

.hero-emoji {
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
  padding: 32rpx;
  padding-bottom: 120rpx;
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
    font-size: 32rpx;
    font-weight: 600;
    color: $td-text-color-primary;
  }
  
  &__body {
    padding: 32rpx;
  }
}

.mb-l {
  margin-bottom: 48rpx;
}

// 简介文本
.intro-text {
  display: block;
  line-height: 1.8;
  color: $td-text-color-secondary;
  font-size: 28rpx;
  margin-bottom: 32rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

// 章节标题
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 24rpx;
}

// 核心理念
.concept-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.concept-card {
  .t-card__body {
    padding: 24rpx;
  }
}

.concept-item {
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
  flex-shrink: 0;
}

.concept-emoji {
  font-size: 40rpx;
  color: #FFFFFF;
}

.concept-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.concept-title {
  font-weight: 500;
  font-size: 28rpx;
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
  padding: 32rpx 0;
  
  &--border {
    border-bottom: 2rpx solid $td-border-level-1;
  }
  
  &:first-child {
    padding-top: 0;
  }
  
  &:last-child {
    padding-bottom: 0;
  }
}

.t-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &--size-xlarge {
    width: 96rpx;
    height: 96rpx;
  }
  
  &--theme-primary {
    background-color: $td-brand-color;
  }
  
  &--theme-success {
    background-color: $td-success-color;
  }
  
  &--theme-warning {
    background-color: $td-warning-color;
  }
  
  &__text {
    font-size: 40rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
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
.t-timeline {
  display: flex;
  flex-direction: column;
}

.t-timeline-item {
  display: flex;
  gap: 24rpx;
  padding-bottom: 32rpx;
  position: relative;
  
  &:last-child {
    padding-bottom: 0;
    
    &::before {
      display: none;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 12rpx;
    top: 32rpx;
    bottom: 0;
    width: 2rpx;
    background-color: $td-border-level-2;
  }
  
  &__dot {
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4rpx;
    z-index: 1;
  }
  
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.timeline-year {
  font-weight: 500;
  font-size: 28rpx;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
}

.timeline-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 荣誉资质
.honor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.honor-card {
  .t-card__body {
    padding: 0;
  }
}

.honor-body {
  text-align: center;
  padding: 40rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.honor-emoji {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.honor-text {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

// 联系方式列表
.t-list {
  display: flex;
  flex-direction: column;
}

.t-list-item {
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
  
  &__meta {
    font-size: 28rpx;
    color: $td-text-color-secondary;
  }
  
  &__content {
    font-size: 28rpx;
    color: $td-text-color-primary;
    text-align: right;
    
    &.contact-link {
      color: $td-brand-color;
    }
  }
}
</style>

