<template>
  <view class="calendar-container">
    <!-- 头部：当前年月 -->
    <view class="calendar-header">
      <view class="current-month">
        <text class="year-month">{{ currentYear }} 年 {{ currentMonth }} 月</text>
      </view>
    </view>

    <!-- 星期标题 -->
    <view class="weekdays">
      <view class="weekday" v-for="day in weekdays" :key="day">
        <text>{{ day }}</text>
      </view>
    </view>

    <!-- 日期网格 -->
    <view class="calendar-grid">
      <view 
        class="date-cell" 
        v-for="(date, index) in calendarDates" 
        :key="index"
        @click="selectDate(date)"
      >
        <view 
          class="date-wrapper"
          :class="{
            'is-empty': date.isEmpty,
            'is-today': date.isToday,
            'is-selected': date.isSelected
          }"
        >
          <text class="date-number" v-if="!date.isEmpty">{{ date.day }}</text>
          <text class="date-price" v-if="date.price && !date.isEmpty">
            {{ date.price }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  priceData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['select'])

// 当前显示的年月（固定为当月）
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

// 选中的日期
const selectedDate = ref(null)

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 获取某月的天数
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate()
}

// 获取某月第一天是星期几
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay()
}

// 判断是否是今天
const isToday = (year, month, day) => {
  const today = new Date()
  return (
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    day === today.getDate()
  )
}

// 判断是否是选中日期
const isSelectedDate = (year, month, day) => {
  if (!selectedDate.value) return false
  return (
    year === selectedDate.value.getFullYear() &&
    month === selectedDate.value.getMonth() + 1 &&
    day === selectedDate.value.getDate()
  )
}

// 生成日历数据（只显示当月）
const calendarDates = computed(() => {
  const dates = []
  const year = currentYear.value
  const month = currentMonth.value
  
  // 当月天数
  const daysInMonth = getDaysInMonth(year, month)
  // 当月第一天是星期几
  const firstDay = getFirstDayOfMonth(year, month)
  
  // 前面的空白格子
  for (let i = 0; i < firstDay; i++) {
    dates.push({
      year,
      month,
      day: 0,
      date: null,
      isEmpty: true,
      isToday: false,
      isSelected: false
    })
  }
  
  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const price = props.priceData[dateStr]
    
    dates.push({
      year,
      month,
      day,
      date: new Date(year, month - 1, day),
      isEmpty: false,
      isToday: isToday(year, month, day),
      isSelected: isSelectedDate(year, month, day),
      price
    })
  }
  
  return dates
})

// 选择日期
const selectDate = (date) => {
  if (date.isEmpty || !date.date) return
  
  selectedDate.value = date.date
  emit('select', date.date)
}
</script>

<style lang="scss" scoped>
.calendar-container {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: #f5f5f5;
  
  .current-month {
    text-align: center;
    
    .year-month {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }
}

.weekdays {
  display: flex;
  padding: 24rpx 0;
  background: #fafafa;
  
  .weekday {
    flex: 1;
    text-align: center;
    font-size: 28rpx;
    color: #999;
  }
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx;
  
  .date-cell {
    width: 14.28%; // 7列
    padding: 8rpx;
    box-sizing: border-box;
    
    .date-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 12rpx 0;
      border-radius: 12rpx;
      min-height: 96rpx;
      transition: all 0.3s;
      
      .date-number {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
        margin-top: 8rpx;
        margin-bottom: 4rpx;
        height: 44rpx;
        line-height: 44rpx;
      }
      
      .date-price {
        font-size: 22rpx;
        color: #999;
        text-align: center;
        font-weight: 400;
        height: 28rpx;
        line-height: 28rpx;
      }
      
      // 空白格子
      &.is-empty {
        opacity: 0;
        pointer-events: none;
      }
      
      // 今天
      &.is-today {
        .date-number {
          color: #0052d9;
          font-weight: 600;
        }
      }
      
      // 选中状态
      &.is-selected {
        background: #0052d9;
        
        .date-number,
        .date-price {
          color: #fff;
        }
      }
    }
  }
}
</style>

