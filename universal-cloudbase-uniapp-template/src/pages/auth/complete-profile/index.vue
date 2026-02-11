<template>
  <view class="page-container">
    <TdPageHeader title="完善个人资料" :showBack="true" />

    <scroll-view scroll-y class="scroll-area scroll-area--with-header-footer" style="height: calc(100vh - 88rpx - 136rpx);">
      <view class="page-content page-content--with-bg" style="padding-bottom: 480rpx;">
        <!-- 提示信息 -->
        <view class="t-alert t-alert--theme-info mb-l">
          <view class="t-alert__content">
            <text>请完善资料后使用小程序</text>
          </view>
        </view>

        <!-- 表单 -->
        <view class="t-form t-form--label-top">
          <!-- 微信头像 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>微信头像</text>
            </view>
            <view class="t-form-item__control" style="display: flex; justify-content: center; margin-top: 16rpx;">
              <button 
                class="t-avatar-picker"
                open-type="chooseAvatar" 
                @chooseavatar="onChooseAvatar"
              >
                <image 
                  v-if="formData.avatarUrl" 
                  :src="formData.avatarUrl" 
                  mode="aspectFill"
                  style="width: 100%; height: 100%;"
                />
                <text v-else style="font-size: 72rpx; color: #DCDCDC; font-weight: 300;">+</text>
              </button>
            </view>
          </view>

          <!-- 微信昵称 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>微信昵称</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input
                    class="t-input__inner"
                    type="text"
                    placeholder="请输入昵称"
                    v-model="formData.nickName"
                  />
                </view>
              </view>
            </view>
          </view>

          <!-- 真实姓名 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text>真实姓名</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input class="t-input__inner" type="text" placeholder="请输入真实姓名" v-model="formData.realName" />
                </view>
              </view>
            </view>
          </view>

          <!-- 手机号 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text>手机号</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input class="t-input__inner" type="tel" placeholder="请输入手机号" v-model="formData.phone" />
                </view>
              </view>
            </view>
          </view>

          <!-- 性别 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>性别</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-radio-group">
                <label
                  v-for="item in genderOptions"
                  :key="item.value"
                  class="t-radio"
                  @click="formData.gender = item.value"
                >
                  <view 
                    class="t-radio__input"
                    :class="{ 't-radio__input--checked': formData.gender === item.value }"
                  ></view>
                  <text class="t-radio__label">{{ item.label }}</text>
                </label>
              </view>
            </view>
          </view>

          <!-- 出生八字 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>出生八字 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <view class="grid grid-cols-4 gap-s">
                <view
                  v-for="(item, index) in birthdateFields"
                  :key="index"
                  class="t-input__wrap"
                >
                  <view class="t-input t-align-center">
                    <input class="t-input__inner" type="text" :placeholder="item.placeholder" v-model="(formData.birthdate as any)[item.key]" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 从事行业 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>从事行业 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <picker
                mode="selector"
                :range="industryOptions"
                :value="industryIndex"
                @change="onIndustryChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text 
                      :class="formData.industry ? 't-select__value' : 't-select__placeholder'"
                    >
                      {{ formData.industry || '请选择' }}
                    </text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
            </view>
          </view>

          <!-- 所在地区 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>所在地区 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <picker
                mode="region"
                :value="regionValue"
                @change="onRegionChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text 
                      :class="formData.region ? 't-select__value' : 't-select__placeholder'"
                    >
                      {{ formData.region || '请选择' }}
                    </text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <button class="t-button t-button--theme-primary t-button--variant-base t-button--size-large t-button--block mb-s" @click="handleSubmit">
        <text class="t-button__text">提交</text>
      </button>
      <button class="t-button t-button--theme-default t-button--variant-text t-button--size-large t-button--block" @click="handleSkip">
        <text class="t-button__text">暂不填写，先预览</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { UserApi } from '@/api';

// 表单数据
const formData = ref({
  avatarUrl: '', // 微信头像
  nickName: '', // 微信昵称
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
 * 选择头像
 */
const onChooseAvatar = (e: any) => {
  formData.value.avatarUrl = e.detail.avatarUrl;
};

/**
 * 显示昵称输入（聚焦隐藏的 input）
 */
const showNicknameInput = () => {
  // 通过 uni.showModal 提供与头像选择类似的交互体验
  uni.showModal({
    title: '设置昵称',
    editable: true,
    placeholderText: '请输入昵称',
    content: formData.value.nickName || '',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm && res.content) {
        formData.value.nickName = res.content.trim();
      }
    }
  });
};

/**
 * 昵称输入完成
 */
const onNicknameBlur = (e: any) => {
  if (e.detail.value) {
    formData.value.nickName = e.detail.value.trim();
  }
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
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

  try {
    // 调用API更新资料
    await UserApi.updateProfile({
      realName: formData.value.realName,
      phone: formData.value.phone,
      city: formData.value.region || '',
      avatar: formData.value.avatarUrl || '',
      nickname: formData.value.nickName || '',
      gender: formData.value.gender === 'male' ? '男' : '女',
      industry: formData.value.industry || '',
      birthday: formData.value.birthdate.year ?
        `${formData.value.birthdate.year}-${formData.value.birthdate.month}-${formData.value.birthdate.day}-${formData.value.birthdate.hour}` : ''
    });

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    });

    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index',
      });
    }, 1500);

  } catch (error: any) {
    console.error('❌ 保存用户资料失败:', error);
  }
};

/**
 * 跳过填写（仍然保存头像和昵称）
 */
const handleSkip = async () => {
  // 直接跳转到首页，不保存任何数据
  uni.switchTab({
    url: '/pages/index/index',
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

// 按钮的伪元素边框重置（微信小程序 button 特有）
button::after {
  border: none;
}

// 页面内容区域背景（半透明白色 + 毛玻璃）
.page-content--with-bg {
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

// 头像选择器（独立组件样式）
.t-avatar-picker {
  padding: 0;
  margin: 0;
  border: none;
  background: #FFFFFF;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
</style>

