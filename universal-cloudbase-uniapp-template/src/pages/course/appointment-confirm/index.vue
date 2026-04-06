<template>
  <view class="page-container">
    <TdPageHeader title="预约确认" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📚 课程信息</view>
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="info-title">{{ courseInfo.courseName }}</view>
            <view class="info-details">
              <view class="info-item">📅 {{ scheduleDateRangeText }}</view>
              <view v-if="scheduleTimeRangeText" class="info-item">🕐 {{ scheduleTimeRangeText }}</view>
              <view class="info-item">📍 {{ courseInfo.location }}</view>
            </view>
          </view>
        </view>

        <!-- 复训费提示（attend_count >= 1 且非沙龙时显示） -->
        <view v-if="needRetrainFee && !hasRetrainCredit" class="retrain-card">
          <view class="retrain-title">💰 复训费用</view>
          <view class="retrain-price">¥{{ courseInfo.retrainPrice }}</view>
          <view class="retrain-notice">上过一次课后，课程有效期内每次上课需缴纳复训费，取消预约后复训费将保留至下期使用</view>
        </view>

        <!-- 复训资格抵扣提示 -->
        <view v-if="needRetrainFee && hasRetrainCredit" class="retrain-card retrain-card--credit">
          <view class="retrain-title">✅ 复训资格</view>
          <view class="retrain-notice">您有保留的复训资格，本次无需支付复训费</view>
        </view>

        <!-- 温馨提示 -->
        <view class="tips-card tips-card--warning">
          <view class="tips-title">⚠️ 温馨提示</view>
          <view class="tips-content">
            <view class="tips-item">预约成功后可在上课前取消预约（具体取消截止日期以排期设置为准）。</view>
            <view v-if="needRetrainFee" class="tips-item">复训用户取消预约后，复训费将保留至下次同课程预约使用。</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部按钮 -->
    <view class="fixed-bottom">
      <button
        class="t-button t-button--variant-base t-button--block t-button--size-large"
        :class="alreadyBooked ? 't-button--theme-default' : 't-button--theme-light'"
        :disabled="alreadyBooked"
        @click="handleSubmit"
      >
        <span class="t-button__text">{{ buttonText }}</span>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi, UserApi } from '@/api';

const COURSE_REMINDER_TMPL_ID = 'SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc'

/**
 * 显示预约确认弹窗并创建预约（订阅授权完成后调用）
 * 从 handleSubmit 中抽离，避免 async 函数影响微信手势上下文判断
 */
const showConfirmAndBook = () => {
  uni.showModal({
    title: '预约确认',
    content: '预约成功后无法取消，确认要预约吗？',
    confirmText: '确认预约',
    cancelText: '再想想',
    success: async (res) => {
      if (res.confirm) {
        isSubmitted.value = true;
        try {
          await CourseApi.createAppointment({
            class_record_id: courseInfo.value.classRecordId
          });
          uni.showToast({ title: '预约成功', icon: 'success', duration: 2000 });
          setTimeout(() => { uni.navigateBack(); }, 2000);
        } catch (error: any) {
          isSubmitted.value = false;
          const msg = error?.message || '预约失败，请稍后重试';
          uni.showModal({ title: '提示', content: msg, showCancel: false });
        }
      }
    },
  });
};

const courseInfo = ref({
  classRecordId: 0,
  courseId: 0,
  courseType: 0,
  courseName: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  userAttendCount: 0,
  retrainPrice: 0,
  userCourseId: 0,
});

/** 开课日～结课日；单日课只显示一天 */
const scheduleDateRangeText = computed(() => {
  const start = courseInfo.value.startDate;
  const end = courseInfo.value.endDate || start;
  if (!start) return '';
  if (end && end !== start) return `${start} 至 ${end}`;
  return start;
});

/** 当天上课开始～结束时刻 */
const scheduleTimeRangeText = computed(() => {
  const st = courseInfo.value.startTime;
  const et = courseInfo.value.endTime;
  if (!st && !et) return '';
  if (st && et) return `${st} - ${et}`;
  return st || et || '';
});

const loading = ref(true);

// 是否需要支付复训费（非沙龙 + attend_count >= 1）
const needRetrainFee = computed(() => {
  return courseInfo.value.courseType !== 4
    && courseInfo.value.userAttendCount >= 1
    && courseInfo.value.retrainPrice > 0;
});

const isSubmitted = ref(false)

// 是否已预约该排期
const alreadyBooked = ref(false)

// 是否拥有可抵用的复训资格
const hasRetrainCredit = ref(false)

const buttonText = computed(() => {
  if (alreadyBooked.value) return '您已预约该排期';
  if (needRetrainFee.value && hasRetrainCredit.value) {
    return '立即预约（使用保留复训资格）';
  }
  if (needRetrainFee.value) {
    return `立即预约并支付复训费 ¥${courseInfo.value.retrainPrice}`;
  }
  return '立即预约';
});

/**
 * 按当前 courseId + classRecordId 拉取排期列表，填充展示字段与复训价（复训费以排期为准）
 */
const loadScheduleRow = async () => {
  const cid = courseInfo.value.courseId;
  const crid = courseInfo.value.classRecordId;
  if (!cid || !crid) return;
  try {
    const result = await CourseApi.getClassRecords({
      course_id: cid,
      page: 1,
      page_size: 100
    });
    // 接口 JSON 常见 number/string 混用，严格 === 会导致匹配不到当前排期 → retrainPrice 恒为 0 → 无法进入支付预约流程
    const record = (result?.list || []).find((item: any) => Number(item.id) === Number(crid));
    if (record) {
      courseInfo.value.courseName = record.course_name || courseInfo.value.courseName;
      if (record.class_date) {
        courseInfo.value.startDate = record.class_date;
      }
      // class_end_date 为空时表示单日课，展示上用开课日作为结束日（日期行只显示一天）
      const endFromApi = record.class_end_date || record.class_date;
      if (endFromApi) {
        courseInfo.value.endDate = endFromApi;
      }
      if (record.start_time) {
        courseInfo.value.startTime = record.start_time;
      }
      if (record.end_time != null && String(record.end_time).trim() !== '') {
        courseInfo.value.endTime = String(record.end_time).trim();
      }
      courseInfo.value.location = record.location || courseInfo.value.location;
      courseInfo.value.retrainPrice = parseFloat(String(record.retrain_price)) || 0;
    }
  } catch (error) {
    console.error('加载排期详情失败:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

/**
 * 通过 getMyCourses 获取用户在指定课程的 attend_count、user_course id
 * 沙龙课程（type=4）不需要查询
 */
const loadUserCourseInfo = async (courseId: number) => {
  if (courseInfo.value.courseType === 4) return;
  try {
    const result = await UserApi.getMyCourses({ page: 1, page_size: 100 });
    const list = result?.list || result || [];
    const matched = list.find((item: any) => Number(item.course_id) === Number(courseId));
    if (matched) {
      courseInfo.value.userAttendCount = matched.attend_count || 0;
      courseInfo.value.userCourseId = matched.id;
    }
  } catch (error) {
    console.error('加载用户课程信息失败:', error);
  }
};


/**
 * 检查课程合同状态
 * - needSign=true：未签合同 → 展示"请先签约"
 * - auditPending=true：已签但审核中 → 禁用预约按钮
 * - 沙龙课程（courseType=4）无需合同检查
 */
/**
 * 检查当前排期是否已有有效预约（status !== 3 即非已取消）
 * 避免用户重复进入订单页才报错
 */
const checkAlreadyBooked = async (classRecordId: number) => {
  try {
    const result = await CourseApi.getMyAppointments({ page: 1, page_size: 100 });
    const list = result?.list || [];
    alreadyBooked.value = list.some(
      (item: any) => Number(item.class_record_id) === Number(classRecordId) && item.status !== 3
    );
  } catch (error) {
    console.error('检查预约状态失败:', error);
  }
};

const loadRetrainCreditStatus = async (courseId: number) => {
  try {
    const result = await CourseApi.checkRetrainCredit({ courseId });
    hasRetrainCredit.value = result?.has_credit === true;
  } catch (error) {
    console.error('检查复训资格失败:', error);
    hasRetrainCredit.value = false;
  }
};

/**
 * 预约按钮点击处理
 * 必须是非 async 函数：微信真机要求 requestSubscribeMessage 在用户 tap 的同步调用栈内触发，
 * async 函数会破坏该上下文导致真机不弹订阅弹窗（开发者工具检测更宽松因此不受影响）
 */
const handleSubmit = () => {
  if (isSubmitted.value || alreadyBooked.value) return;

  if (needRetrainFee.value && hasRetrainCredit.value) {
    // 有复训资格，直接预约无需支付
    // #ifdef MP-WEIXIN
    uni.requestSubscribeMessage({
      tmplIds: [COURSE_REMINDER_TMPL_ID],
      success: (res) => { console.log('[订阅授权-复训资格预约] success:', JSON.stringify(res)); },
      fail: (err) => { console.log('[订阅授权-复训资格预约] fail:', JSON.stringify(err)); },
      complete: () => { showConfirmAndBook(); }
    });
    // #endif
    // #ifndef MP-WEIXIN
    showConfirmAndBook();
    // #endif
  } else if (needRetrainFee.value) {
    // 需要支付复训费，跳转订单页
    uni.showModal({
      title: '预约确认',
      content: `确认要预约并支付复训费 ¥${courseInfo.value.retrainPrice} 吗？取消预约后复训费将保留至下期使用。`,
      confirmText: '确认预约',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          isSubmitted.value = true;
          const q = [
            `courseId=${courseInfo.value.courseId}`,
            `classRecordId=${courseInfo.value.classRecordId}`,
            `userCourseId=${courseInfo.value.userCourseId}`,
            `isRetrain=1`
          ].join('&');
          uni.redirectTo({
            url: `/pages/order/confirm/index?${q}`,
          });
        }
      },
    });
  } else {
    // 非复训费场景：在 tap 同步上下文中直接调用 requestSubscribeMessage，complete 后弹确认框
    // #ifdef MP-WEIXIN
    uni.requestSubscribeMessage({
      tmplIds: [COURSE_REMINDER_TMPL_ID],
      success: (res) => { console.log('[订阅授权-预约] success:', JSON.stringify(res)); },
      fail: (err) => { console.log('[订阅授权-预约] fail:', JSON.stringify(err)); },
      complete: (res) => {
        console.log('[订阅授权-预约] complete:', JSON.stringify(res));
        showConfirmAndBook();
      }
    });
    // #endif
    // #ifndef MP-WEIXIN
    showConfirmAndBook();
    // #endif
  }
};

onLoad(async (options: any) => {
  if (options?.classRecordId) {
    courseInfo.value.classRecordId = Number(options.classRecordId);
  }
  if (options?.courseId) {
    courseInfo.value.courseId = Number(options.courseId);
  }
  if (options?.courseType) {
    courseInfo.value.courseType = Number(options.courseType);
  }

  // 优先使用 URL 直传的展示数据
  if (options?.courseName) {
    courseInfo.value.courseName = decodeURIComponent(options.courseName);
  }
  if (options?.classDate) {
    courseInfo.value.startDate = decodeURIComponent(options.classDate);
  }
  if (options?.classEndDate) {
    courseInfo.value.endDate = decodeURIComponent(options.classEndDate);
  }
  if (options?.classTime) {
    courseInfo.value.startTime = decodeURIComponent(options.classTime);
  }
  if (options?.endTime) {
    courseInfo.value.endTime = decodeURIComponent(options.endTime);
  }
  if (options?.location) {
    courseInfo.value.location = decodeURIComponent(options.location);
  }

  // 加载用户课程信息、排期（含复训价）、已预约状态、复训资格
  if (courseInfo.value.courseId) {
    uni.showLoading({ title: '加载中...' });
    const tasks: Promise<void>[] = [
      loadUserCourseInfo(courseInfo.value.courseId),
      checkAlreadyBooked(courseInfo.value.classRecordId),
      loadRetrainCreditStatus(courseInfo.value.courseId),
    ];
    if (courseInfo.value.classRecordId) {
      tasks.push(loadScheduleRow());
    }
    await Promise.all(tasks);
    uni.hideLoading();
  }
  loading.value = false;

});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height) - 160rpx - env(safe-area-inset-bottom));
}

.page-content {
  padding: 32rpx;
}

// 信息标题和详情样式
.info-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;

  &.price-item {
    margin-top: 8rpx;
    padding-top: 16rpx;
    border-top: 2rpx solid $td-border-level-1;
    color: $td-error-color;
    font-weight: 600;
  }
}

// 复训费提示卡片
.retrain-card {
  margin-top: 32rpx;
  background-color: #FFF3F0;
  border-radius: var(--td-radius-default);
  padding: 32rpx;

  &--credit {
    background-color: #E6F7FF;
  }
}

.retrain-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-error-color;
  margin-bottom: 12rpx;
}

.retrain-price {
  font-size: 48rpx;
  font-weight: 700;
  color: $td-error-color;
  margin-bottom: 16rpx;
}

.retrain-notice {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 温馨提示样式
.tips-card {
  margin-top: 32rpx;
  background-color: $td-warning-color-light;
  border-radius: var(--td-radius-default);
  padding: 32rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-warning-color;
  margin-bottom: 16rpx;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 固定底部按钮
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--td-radius-default);
  border: none;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }

  &--block {
    width: 100%;
  }
}
</style>
