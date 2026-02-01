<template>
  <view :style="{ width: '100%', height: '100vh', background: '#F5F5F5' }">
    <td-page-header title="协议详情" />
    
    <scroll-view 
      scroll-y 
      :style="{ 
        width: '100%',
        height: scrollHeight
      }"
    >
      <view :style="{ padding: '32rpx' }">
        
        <!-- 协议信息卡片 -->
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__header">
            <view class="t-card__header-wrapper">
              <text class="t-card__title">📋 传播大使合作协议</text>
            </view>
          </view>
          <view class="t-card__body">
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">协议编号：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">HT202401001</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">协议版本：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">v1.0</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">大使等级：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">青鸾大使</text>
            </view>
          </view>
        </view>

        <!-- 合同期限 -->
        <view class="t-section-title t-section-title--simple">📆 合同期限</view>
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">合同开始：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">2024-01-15</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">合同结束：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">2025-01-14</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '24rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">剩余天数：</text>
              <text :style="{ color: '#00A870', fontWeight: '600', fontSize: '32rpx' }">365天</text>
            </view>
            
            <view :style="{ height: '2rpx', background: '#F5F5F5', margin: '24rpx 0' }"></view>
            
            <view :style="{ padding: '24rpx', background: '#F5F5F5', borderRadius: '12rpx' }">
              <view :style="{ fontSize: '26rpx', fontWeight: '500', color: '#333', marginBottom: '8rpx' }">合同期说明</view>
              <view :style="{ fontSize: '24rpx', color: '#666', lineHeight: '1.5' }">本协议有效期为1年，到期前30天会收到续签提醒通知</view>
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
                <text :style="{ fontWeight: '600', color: '#333' }">乙方：</text>张三
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

        <!-- 底部留白 -->
        <view :style="{ height: '120rpx' }"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})
</script>

<style scoped lang="scss">
@import '@/styles/tdesign-vars.scss';
// 页面使用 TDesign CSS 类名和 inline style，无需自定义样式
</style>

