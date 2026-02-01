<template>
  <view class="page">
    <td-page-header title="签署协议" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 协议信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <view class="card-title">📋 传播大使合作协议</view>
            <view class="status-badge warning">待签署</view>
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="info-label">协议版本：</text>
              <text class="info-value">v1.0</text>
            </view>
            <view class="info-row">
              <text class="info-label">合同期限：</text>
              <text class="info-value">1年</text>
            </view>
            <view class="info-row">
              <text class="info-label">大使等级：</text>
              <text class="info-value">青鸾大使</text>
            </view>
          </view>
        </view>

        <!-- 协议内容 -->
        <view class="t-section-title t-section-title--simple">📄 协议内容</view>
        
        <view class="contract-card">
          <scroll-view class="contract-content" scroll-y>
            <view class="contract-text">
              
              <view class="contract-title">天道文化传播大使合作协议</view>
              
              <view class="contract-section">
                <text class="section-label">甲方：</text>孙膑道天道文化
              </view>
              <view class="contract-section">
                <text class="section-label">乙方：</text>{用户姓名}
              </view>
              
              <view class="contract-article">
                <view class="article-title">第一条 协议目的</view>
                <view class="article-content">
                  为了更好地传播天道文化，弘扬国学智慧，甲乙双方本着平等互利、共同发展的原则，达成本协议。
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第二条 大使权利与义务</view>
                <view class="article-subtitle">乙方权利：</view>
                <view class="article-content">
                  1. 推荐学员购买课程可获得功德分和积分奖励<br/>
                  2. 享受大使专属培训和学习资料<br/>
                  3. 参与商学院组织的各类活动<br/>
                  4. 使用天道文化品牌进行推广
                </view>
                
                <view class="article-subtitle">乙方义务：</view>
                <view class="article-content">
                  1. 认真学习和理解天道文化理念<br/>
                  2. 积极推广天道文化课程<br/>
                  3. 维护天道文化品牌形象<br/>
                  4. 不得进行虚假宣传和误导性推广
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第三条 功德分和积分规则</view>
                <view class="article-subtitle">青鸾大使：</view>
                <view class="article-content">
                  1. 成为时获得1688冻结积分<br/>
                  2. 第1次推荐初探班解冻1688积分<br/>
                  3. 第2次起推荐获得功德分（30%初探班，20%其他）<br/>
                  4. 功德分可兑换课程、复训、咨询服务等
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第四条 推广行为规范</view>
                <view class="article-content">
                  1. 不得进行虚假宣传<br/>
                  2. 不得误导消费者<br/>
                  3. 不得损害品牌形象<br/>
                  4. 不得违反法律法规
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第五条 合同期限</view>
                <view class="article-content">
                  本协议自签署之日起生效，有效期为1年。到期前30天，双方可协商续约。
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第六条 违约责任</view>
                <view class="article-content">
                  如乙方违反本协议约定，甲方有权取消其大使资格，并冻结未提现的积分。
                </view>
              </view>
              
              <view class="contract-article">
                <view class="article-title">第七条 争议解决</view>
                <view class="article-content">
                  因本协议引起的争议，双方应友好协商解决。协商不成的，可向甲方所在地人民法院提起诉讼。
                </view>
              </view>
              
              <view class="contract-footer">
                本协议一式两份，甲乙双方各执一份，具有同等法律效力。
              </view>
              
            </view>
          </scroll-view>
        </view>

        <!-- 签署确认 -->
        <view class="confirm-card">
          <view class="checkbox-wrapper" @tap="toggleAgree">
            <view :class="['checkbox', { checked: agreed }]">
              <text v-if="agreed">✓</text>
            </view>
            <text class="checkbox-label">我已仔细阅读并完全理解上述协议内容，自愿签署本协议</text>
          </view>

          <view class="form-item">
            <view class="form-label required">手机号后四位确认</view>
            <input 
              class="form-input" 
              v-model="phoneLastFour" 
              type="number" 
              maxlength="4" 
              placeholder="请输入手机号后四位" 
            />
            <view class="form-tips">用于验证身份，确保签署安全</view>
          </view>
        </view>

        <!-- 签署说明 -->
        <view class="alert-box info">
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-message">
              • 签署后协议立即生效，合同期1年<br/>
              • 签署记录将保存在"我的协议"中<br/>
              • 可随时查看和下载协议PDF文件
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部签署按钮 -->
    <view class="fixed-bottom">
      <button class="submit-btn" @tap="handleSign">确认签署协议</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const agreed = ref(false)
const phoneLastFour = ref('')

const toggleAgree = () => {
  agreed.value = !agreed.value
}

const handleSign = () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  if (!phoneLastFour.value || phoneLastFour.value.length !== 4) {
    uni.showToast({ title: '请输入手机号后四位', icon: 'none' })
    return
  }

  uni.showToast({
    title: '签署成功',
    icon: 'success',
    duration: 2000
  })
  
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/ambassador/contract-detail/index'
    })
  }, 2000)
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
}

.scroll-area {
  width: 100%;
}

.page-content {
  padding: 32rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 48rpx;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #F5F5F5;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  
  &.warning {
    background: #FFF4E5;
    color: #E37318;
  }
}

.card-body {
  padding: 32rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  color: #999;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.contract-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.contract-content {
  max-height: 600rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
}

.contract-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666;
}

.contract-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 24rpx;
}

.contract-section {
  margin-bottom: 24rpx;
}

.section-label {
  font-weight: 500;
  color: #333;
}

.contract-article {
  margin-bottom: 32rpx;
}

.article-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.article-subtitle {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  margin: 16rpx 0 8rpx;
}

.article-content {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

.contract-footer {
  font-size: 24rpx;
  color: #999;
  font-style: italic;
  text-align: center;
  margin-top: 48rpx;
}

.confirm-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  
  &.checked {
    background: #0052D9;
    border-color: #0052D9;
    color: #fff;
    font-size: 24rpx;
  }
}

.checkbox-label {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  line-height: 1.5;
}

.form-item {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  
  &.required::before {
    content: '*';
    color: #E34D59;
    margin-right: 8rpx;
  }
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 2rpx solid #E5E5E5;
}

.form-tips {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.info {
    background: #E6F4FF;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #E6F4FF;
  color: #0052D9;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  
  &::after {
    border: none;
  }
}
</style>

