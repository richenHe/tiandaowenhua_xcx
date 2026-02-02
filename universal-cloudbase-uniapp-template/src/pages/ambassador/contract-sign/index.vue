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
        
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view 
              :style="{ 
                maxHeight: '800rpx',
                background: '#F5F5F5',
                borderRadius: '12rpx',
                overflow: 'hidden'
              }"
            >
              <scroll-view 
                scroll-y 
                :style="{ 
                  height: '800rpx',
                  padding: '24rpx',
                  fontSize: '26rpx',
                  lineHeight: '1.8',
                  color: '#666',
                  boxSizing: 'border-box'
                }"
              >
              
              <view :style="{ color: '#333', fontSize: '32rpx', marginBottom: '24rpx', textAlign: 'center', fontWeight: '600' }">天道文化传播大使合作协议</view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <text :style="{ fontWeight: '600', color: '#333' }">甲方：</text>孙膑道天道文化
              </view>
              <view :style="{ marginBottom: '32rpx' }">
                <text :style="{ fontWeight: '600', color: '#333' }">乙方：</text>{用户姓名}
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第一条 协议目的</view>
                <view :style="{ marginBottom: '24rpx' }">
                  为了更好地传播天道文化，弘扬国学智慧，甲乙双方本着平等互利、共同发展的原则，达成本协议。
                </view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第二条 大使权利与义务</view>
                <view :style="{ marginBottom: '16rpx', fontWeight: '600', color: '#333' }">乙方权利：</view>
                <view :style="{ marginBottom: '8rpx' }">1. 推荐学员购买课程可获得功德分和积分奖励</view>
                <view :style="{ marginBottom: '8rpx' }">2. 享受大使专属培训和学习资料</view>
                <view :style="{ marginBottom: '8rpx' }">3. 参与商学院组织的各类活动</view>
                <view :style="{ marginBottom: '24rpx' }">4. 使用天道文化品牌进行推广</view>
                
                <view :style="{ marginBottom: '16rpx', fontWeight: '600', color: '#333' }">乙方义务：</view>
                <view :style="{ marginBottom: '8rpx' }">1. 认真学习和理解天道文化理念</view>
                <view :style="{ marginBottom: '8rpx' }">2. 积极推广天道文化课程</view>
                <view :style="{ marginBottom: '8rpx' }">3. 维护天道文化品牌形象</view>
                <view :style="{ marginBottom: '24rpx' }">4. 不得进行虚假宣传和误导性推广</view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第三条 功德分和积分规则</view>
                <view :style="{ marginBottom: '16rpx', fontWeight: '600', color: '#333' }">青鸾大使：</view>
                <view :style="{ marginBottom: '8rpx' }">1. 成为时获得1688冻结积分</view>
                <view :style="{ marginBottom: '8rpx' }">2. 第1次推荐初探班解冻1688积分</view>
                <view :style="{ marginBottom: '8rpx' }">3. 第2次起推荐获得功德分（30%初探班，20%其他）</view>
                <view :style="{ marginBottom: '24rpx' }">4. 功德分可兑换课程、复训、咨询服务等</view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第四条 推广行为规范</view>
                <view :style="{ marginBottom: '8rpx' }">1. 不得进行虚假宣传</view>
                <view :style="{ marginBottom: '8rpx' }">2. 不得误导消费者</view>
                <view :style="{ marginBottom: '8rpx' }">3. 不得损害品牌形象</view>
                <view :style="{ marginBottom: '24rpx' }">4. 不得违反法律法规</view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第五条 合同期限</view>
                <view :style="{ marginBottom: '24rpx' }">
                  本协议自签署之日起生效，有效期为1年。到期前30天，双方可协商续约。
                </view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第六条 违约责任</view>
                <view :style="{ marginBottom: '24rpx' }">
                  如乙方违反本协议约定，甲方有权取消其大使资格，并冻结未提现的积分。
                </view>
              </view>
              
              <view :style="{ marginBottom: '24rpx' }">
                <view :style="{ color: '#333', margin: '32rpx 0 16rpx', fontSize: '28rpx', fontWeight: '600' }">第七条 争议解决</view>
                <view :style="{ marginBottom: '24rpx' }">
                  因本协议引起的争议，双方应友好协商解决。协商不成的，可向甲方所在地人民法院提起诉讼。
                </view>
              </view>
              
              <view :style="{ marginTop: '48rpx', fontStyle: 'italic', textAlign: 'center' }">
                本协议一式两份，甲乙双方各执一份，具有同等法律效力。
              </view>
              
              </scroll-view>
            </view>
          </view>
        </view>

        <!-- 签署确认 -->
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view 
              @tap="toggleAgree"
              :style="{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16rpx',
                padding: '16rpx',
                background: '#F5F5F5',
                borderRadius: '12rpx',
                marginBottom: '32rpx',
                boxSizing: 'border-box'
              }"
            >
              <view :class="['checkbox', { checked: agreed }]">
                <text v-if="agreed">✓</text>
              </view>
              <text :style="{ fontSize: '26rpx', color: '#333', flex: '1', lineHeight: '1.5' }">
                我已仔细阅读并完全理解上述协议内容，自愿签署本协议
              </text>
            </view>

            <view>
              <view :style="{ fontSize: '28rpx', color: '#333', marginBottom: '16rpx' }">
                <text :style="{ color: '#E34D59', marginRight: '8rpx' }">*</text>手机号后四位确认
              </view>
              <input 
                v-model="phoneLastFour" 
                type="number" 
                maxlength="4" 
                placeholder="请输入手机号后四位"
                :style="{ 
                  width: '100%',
                  height: '88rpx',
                  background: '#F5F5F5',
                  borderRadius: '12rpx',
                  padding: '0 24rpx',
                  fontSize: '28rpx',
                  border: '2rpx solid #E5E5E5',
                  boxSizing: 'border-box'
                }"
              />
              <view :style="{ fontSize: '24rpx', color: '#999', marginTop: '8rpx' }">
                用于验证身份，确保签署安全
              </view>
            </view>
          </view>
        </view>

        <!-- 签署说明 -->
        <view 
          :style="{ 
            borderRadius: '16rpx',
            padding: '24rpx',
            marginBottom: '48rpx',
            display: 'flex',
            gap: '16rpx',
            background: '#E6F4FF',
            boxSizing: 'border-box'
          }"
        >
          <view :style="{ fontSize: '32rpx', flexShrink: '0' }">ℹ️</view>
          <view :style="{ flex: '1' }">
            <view :style="{ fontSize: '24rpx', color: '#666', lineHeight: '1.6' }">
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
      <view @tap="handleSign">
        <button class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large">
          <span class="t-button__text">✍️ 确认签署协议</span>
        </button>
      </view>
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

</style>

