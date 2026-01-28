<template>
  <view class="page-container">
    <TdPageHeader title="完善个人资料" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 提示信息 -->
        <view class="alert-box">
          <view class="alert-icon">ℹ️</view>
          <text class="alert-text">请完善资料后使用小程序</text>
        </view>

        <!-- 表单 -->
        <view class="form-card">
          <!-- 真实姓名 -->
          <view class="form-item">
            <view class="form-label">
              <text class="required-mark">*</text>
              <text>真实姓名</text>
            </view>
            <input
              class="form-input"
              type="text"
              placeholder="请输入真实姓名"
              v-model="formData.realName"
            />
          </view>

          <!-- 手机号 -->
          <view class="form-item">
            <view class="form-label">
              <text class="required-mark">*</text>
              <text>手机号</text>
            </view>
            <input
              class="form-input"
              type="tel"
              placeholder="请输入手机号"
              v-model="formData.phone"
            />
          </view>

          <!-- 性别 -->
          <view class="form-item">
            <view class="form-label">性别</view>
            <view class="radio-group">
              <view
                v-for="item in genderOptions"
                :key="item.value"
                class="radio-item"
                @click="formData.gender = item.value"
              >
                <view class="radio-icon" :class="{ 'radio-icon--checked': formData.gender === item.value }">
                  <view v-if="formData.gender === item.value" class="radio-dot"></view>
                </view>
                <text class="radio-label">{{ item.label }}</text>
              </view>
            </view>
          </view>

          <!-- 出生八字 -->
          <view class="form-item">
            <view class="form-label">出生八字 (选填)</view>
            <view class="birthdate-grid">
              <input
                v-for="(item, index) in birthdateFields"
                :key="index"
                class="form-input form-input--center"
                type="text"
                :placeholder="item.placeholder"
                v-model="formData.birthdate[item.key]"
              />
            </view>
          </view>

          <!-- 从事行业 -->
          <view class="form-item">
            <view class="form-label">从事行业 (选填)</view>
            <picker
              mode="selector"
              :range="industryOptions"
              :value="industryIndex"
              @change="onIndustryChange"
            >
              <view class="picker-box">
                <text class="picker-text" :class="{ 'picker-text--placeholder': !formData.industry }">
                  {{ formData.industry || '请选择' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <!-- 所在地区 -->
          <view class="form-item">
            <view class="form-label">所在地区 (选填)</view>
            <picker
              mode="region"
              :value="regionValue"
              @change="onRegionChange"
            >
              <view class="picker-box">
                <text class="picker-text" :class="{ 'picker-text--placeholder': !formData.region }">
                  {{ formData.region || '请选择' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <button class="submit-btn" @click="handleSubmit">提交</button>
      <button class="skip-btn" @click="handleSkip">暂不填写，先预览</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 表单数据
const formData = ref({
  realName: '',
  phone: '',
  gender: 'male',
  birthdate: {
    year: '',
    month: '',
    day: '',
    hour: '',
  },
  industry: '',
  region: '',
});

// 性别选项
const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
];

// 出生八字字段
const birthdateFields = [
  { key: 'year', placeholder: '年' },
  { key: 'month', placeholder: '月' },
  { key: 'day', placeholder: '日' },
  { key: 'hour', placeholder: '时' },
];

// 行业选项（全面的行业分类）
const industryOptions = [
  '互联网/电子商务',
  '计算机软件',
  '计算机硬件',
  'IT服务/系统集成',
  '通信/电信运营',
  '网络游戏',
  '金融/投资/证券',
  '银行',
  '保险',
  '基金/证券/期货',
  '信托/担保/拍卖',
  '教育/培训',
  '学术/科研',
  '专业服务/咨询',
  '会计/审计',
  '法律',
  '广告/会展/公关',
  '市场推广/会展',
  '影视/媒体/艺术',
  '文字媒体/出版',
  '印刷/包装/造纸',
  '房地产开发',
  '建筑/建材/工程',
  '家居/室内设计',
  '物业管理/商业中心',
  '汽车/摩托车',
  '零配件',
  '租赁/商务服务',
  '中介服务',
  '检测/认证',
  '外包服务',
  '贸易/进出口',
  '批发/零售',
  '快速消费品',
  '耐用消费品',
  '服装/纺织/皮革',
  '家具/家电',
  '奢侈品/收藏品',
  '办公用品及设备',
  '医疗/护理/卫生',
  '医疗设备/器械',
  '制药/生物工程',
  '美容/保健',
  '酒店/餐饮',
  '旅游/度假',
  '娱乐/休闲/体育',
  '航空/航天研究',
  '交通/运输/物流',
  '仓储',
  '能源/矿产/采掘',
  '石油/石化/化工',
  '电气/电力/水利',
  '新能源',
  '原材料和加工',
  '政府/公共事业',
  '非盈利机构',
  '环保',
  '农/林/牧/渔',
  '多元化业务集团',
  '其他行业',
];
const industryIndex = ref(0);

// 地区选择
const regionValue = ref(['广东省', '深圳市', '南山区']);

/**
 * 行业选择变更
 */
const onIndustryChange = (e: any) => {
  industryIndex.value = e.detail.value;
  formData.value.industry = industryOptions[e.detail.value];
};

/**
 * 地区选择变更
 */
const onRegionChange = (e: any) => {
  regionValue.value = e.detail.value;
  formData.value.region = e.detail.value.join(' ');
};

/**
 * 提交表单
 */
const handleSubmit = () => {
  // 验证必填项
  if (!formData.value.realName) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none',
    });
    return;
  }

  if (!formData.value.phone) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    });
    return;
  }

  // 验证手机号格式
  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(formData.value.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    });
    return;
  }

  console.log('提交表单', formData.value);

  // 模拟提交成功，跳转到首页
  uni.showToast({
    title: '提交成功',
    icon: 'success',
  });

  setTimeout(() => {
    uni.switchTab({
      url: '/pages/index/index',
    });
  }, 1500);
};

/**
 * 跳过填写
 */
const handleSkip = () => {
  uni.switchTab({
    url: '/pages/index/index',
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

.scroll-area {
  height: calc(100vh - 88rpx - 176rpx); // 减去header(88rpx)和底部按钮(176rpx)
  overflow-y: auto;
}

.page-content {
  padding: 32rpx;
  padding-bottom: 300rpx; // 大幅增加底部留白，与其他页面保持一致
}

// 提示框
.alert-box {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 32rpx;
  background-color: rgba($td-brand-color, 0.1);
  border: 2rpx solid rgba($td-brand-color, 0.2);
  border-radius: $td-radius-default;
}

.alert-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.alert-text {
  flex: 1;
  font-size: 28rpx;
  color: $td-text-color-primary;
}

// 表单卡片
.form-card {
  background: white;
  border-radius: $td-radius-default;
  padding: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.required-mark {
  color: $td-error-color;
  margin-right: 8rpx;
}

// 输入框
.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: $td-text-color-primary;
  background-color: $td-bg-color-container;
  border: 2rpx solid $td-border-level-2;
  border-radius: $td-radius-default;
  box-sizing: border-box;

  &--center {
    text-align: center;
  }
}

// 单选框
.radio-group {
  display: flex;
  gap: 48rpx;
}

.radio-item {
  display: flex;
  align-items: center;
}

.radio-icon {
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid $td-border-level-2;
  border-radius: 50%;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &--checked {
    border-color: $td-brand-color;
  }
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  background-color: $td-brand-color;
  border-radius: 50%;
}

.radio-label {
  font-size: 28rpx;
  color: $td-text-color-primary;
}

// 出生八字网格
.birthdate-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

// 选择器
.picker-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background-color: $td-bg-color-container;
  border: 2rpx solid $td-border-level-2;
  border-radius: $td-radius-default;
}

.picker-text {
  flex: 1;
  font-size: 28rpx;
  color: $td-text-color-primary;

  &--placeholder {
    color: $td-text-color-placeholder;
  }
}

.picker-arrow {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  margin-left: 16rpx;
}

// 固定底部
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background-color: $td-brand-color;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: $td-radius-default;
  border: none;
  margin-bottom: 16rpx;
}

.skip-btn {
  width: 100%;
  height: 88rpx;
  background-color: transparent;
  color: $td-text-color-secondary;
  font-size: 28rpx;
  border-radius: $td-radius-default;
  border: none;
}
</style>

