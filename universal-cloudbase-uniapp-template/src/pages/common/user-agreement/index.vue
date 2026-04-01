<!--
  页面说明：用户服务协议（静态文案页，供登录页等跳转展示）
  路由：无参数。正式上架前建议法务审阅正文。
-->
<template>
  <view class="page-container">
    <td-page-header title="用户服务协议" />

    <scroll-view scroll-y :style="{ height: scrollHeight }">
      <view class="page-content">
        <view class="t-card t-card--shadow">
          <view class="t-card__body">
            <text class="text-secondary break-words" :style="bodyTextStyle">{{ agreementBody }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(
  () => 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
)

const bodyTextStyle = {
  fontSize: '28rpx',
  lineHeight: '1.8',
  whiteSpace: 'pre-wrap' as const
}

/** 通用小程序用户服务协议模板，产品名：天道文化 */
const agreementBody = `更新日期：2025年10月15日
生效日期：2025年10月15日

欢迎您使用天道文化小程序（以下简称「本小程序」）。在使用本小程序提供的服务前，请您仔细阅读本《用户服务协议》（以下简称「本协议」）。您点击同意、实际使用本小程序服务，即视为已阅读并同意接受本协议全部内容。

一、服务说明
1. 本小程序由运营方向您提供课程信息展示、在线购买/预约、商学院内容浏览、商城相关服务及与上述功能相关的技术支持。
2. 部分服务需您完成微信授权登录、绑定手机号或完善资料后方可使用，具体以页面提示为准。

二、账号与使用规范
1. 您应使用合法、真实的微信账号访问本小程序，并妥善保管账号安全。
2. 您不得利用本小程序从事违法违规、侵害他人权益、干扰系统正常运行等行为；否则运营方有权限制或终止向您提供服务。

三、订单、支付与退款
1. 您在本小程序下达的订单、支付及售后规则，以订单页面、活动规则及届时公示为准。
2. 若发生退款，将按微信支付及相关规则原路退回或按公示方式处理。

四、知识产权
1. 本小程序内的文字、图片、音视频、界面设计等内容的知识产权归运营方或权利人所有，未经许可不得擅自复制、传播或用于商业用途。

五、免责声明与责任限制
1. 因不可抗力、网络故障、第三方服务异常等非运营方过错导致的服务中断或数据丢失，运营方将在法律允许范围内承担责任。
2. 本小程序中第三方链接或服务由第三方自行负责，请您审慎判断风险。

六、协议变更与终止
1. 运营方可根据业务需要更新本协议，更新后将在本页面公示；您继续使用服务即视为接受更新后的协议。
2. 您可随时停止使用本小程序；运营方亦有权在合法合规前提下终止或调整服务。

七、联系我们
如您对本协议有疑问，可通过本小程序内公示的客服或反馈渠道与我们联系。

请您在充分理解本协议各条款后再使用本小程序服务。`
</script>

<style lang="scss" scoped>
@import '@/styles/common.scss';
</style>
