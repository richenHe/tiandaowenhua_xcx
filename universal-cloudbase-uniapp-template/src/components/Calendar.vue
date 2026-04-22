<!--
  农历风格日历（首页「日历」弹窗）
  - 顶栏：关闭在左，公历「YYYY年M月」紧邻其右；底部：课程行（与农历标题同字号）+ 农历标题 + 四柱 + 吉神宜趋
  - 网格第二行仅节气/农历日，不显示排期昵称；课程仅底部「课程：」行
  - 上月补位 + 当月 + 末行补下月初若干天（淡显，与上月补位一致）
-->
<template>
  <view class="lunar-cal">
    <view class="lunar-cal__header">
      <text class="lunar-cal__close" @click.stop="emitClose">✕</text>
      <view class="lunar-cal__header-title">
        <text class="lunar-cal__header-text">{{ headerYearMonth }}</text>
      </view>
    </view>

    <!-- 小程序端不要用 touch*.stop，否则易阻断子区域 tap；滑动与点选共用 touch 坐标判断 -->
    <view
      class="lunar-cal__swipe"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <view class="lunar-cal__body">
        <view class="lunar-cal__weekdays">
          <text
            v-for="(w, wi) in weekdays"
            :key="w"
            class="lunar-cal__weekday"
            :class="{ 'lunar-cal__weekday--rest': wi === 0 || wi === 6 }"
          >{{ w }}</text>
        </view>
        <view class="lunar-cal__grid">
          <view
            v-for="(cell, idx) in cells"
            :key="idx"
            class="lunar-cal__cell"
          >
            <!-- 用 view 承载日期文案 + tap：避免 MP 上点 text 不冒泡导致选中日无效 -->
            <view
              class="lunar-cal__cell-inner"
              :class="cellInnerClass(cell)"
              @tap.stop="onCellTap(cell)"
            >
              <view
                class="lunar-cal__cell-day"
                :class="dayTextClass(cell)"
              >{{ cell.day }}</view>
              <view
                class="lunar-cal__cell-sub"
                :class="subTextClass(cell)"
              >{{ cell.subLine }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="lunar-cal__divider" />

    <view class="lunar-cal__footer">
      <view class="lunar-cal__course-line-wrap">
        <text class="lunar-cal__serif lunar-cal__lunar-main lunar-cal__course-line">
          课程：{{ selectedDayCoursesText }}
        </text>
      </view>
      <view class="lunar-cal__lunar-main-wrap">
        <text class="lunar-cal__serif lunar-cal__lunar-main">{{ selectedLunarTitle }}</text>
      </view>
      <view class="lunar-cal__pillars">
        <view
          class="lunar-cal__pillars-inner"
          :class="{ 'lunar-cal__pillars-inner--triple': pillarBlocks.length === 3 }"
        >
          <view
            v-for="p in pillarBlocks"
            :key="p.label"
            class="lunar-cal__pillar"
            :class="{ 'lunar-cal__pillar--day': p.highlight }"
          >
            <text class="lunar-cal__pillar-label">{{ p.label }}</text>
            <view class="lunar-cal__pillar-gz">
              <text class="lunar-cal__serif lunar-cal__pillar-ch">{{ p.gan }}</text>
              <text class="lunar-cal__serif lunar-cal__pillar-ch">{{ p.zhi }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- getDayJiShen：仅一行「吉神宜趋」，其下所有神名单列、顿号分隔、自动换行，无竖线 -->
      <view class="lunar-cal__ji-meta">
        <text class="lunar-cal__ji-meta-label">吉神宜趋</text>
        <text class="lunar-cal__serif lunar-cal__ji-meta-value">{{ dayJiShenText }}</text>
      </view>
    </view>

    <view class="lunar-cal__handle-wrap" @click="emitClose">
      <view class="lunar-cal__handle" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Solar } from 'lunar-javascript';
import type { CalendarCourseInfo } from '@/api/types/course';

/** 中国标准时间相对 UTC 固定 +8h（无夏令时） */
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 将任意时刻格式化为北京时间的年月日时分秒（公历数字）。
 * 用于：与选中格子的公历年月日比较是否「北京今天」；今天则把此时刻传入八字。
 *
 * 真机部分微信小程序无 `Intl`（会报 `Intl is not defined`），故不用 Intl；对固定东八区用
 * 时刻平移 + `getUTC*` 等效于 Asia/Shanghai。
 */
function getBeijingYmdHms(at: Date = new Date()) {
  const bj = new Date(at.getTime() + BEIJING_OFFSET_MS);
  return {
    y: bj.getUTCFullYear(),
    m: bj.getUTCMonth() + 1,
    d: bj.getUTCDate(),
    h: bj.getUTCHours(),
    mi: bj.getUTCMinutes(),
    s: bj.getUTCSeconds()
  };
}

const props = defineProps<{
  /** 日历排期：日期键 → 课程信息（多日课已由接口按日展开） */
  priceData?: Record<string, CalendarCourseInfo | string>;
}>();

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'close'): void;
  (e: 'monthChange', payload: { year: number; month: number }): void;
}>();

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const today = new Date();
const displayYear = ref(today.getFullYear());
const displayMonth = ref(today.getMonth() + 1);
const selectedDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

/**
 * 选中「北京今天」时，时柱应随真实时间变化；依赖本 ref 触发 computed 周期性重算。
 * 非今天选中日不读该值，避免无意义刷新。
 */
const beijingNowTick = ref(0);
let beijingClockTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  beijingNowTick.value = Date.now();
  beijingClockTimer = setInterval(() => {
    beijingNowTick.value = Date.now();
  }, 30_000);
});

onUnmounted(() => {
  if (beijingClockTimer) clearInterval(beijingClockTimer);
});

/** 防止滑动换月后误触日期格 */
const swipeLock = ref(false);
const touchStartX = ref(0);

const pad2 = (n: number) => String(n).padStart(2, '0');

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function splitGanZhi(gz: string): [string, string] {
  if (!gz || gz.length < 2) return ['', ''];
  return [gz[0], gz[1]];
}

/** 是否为「今天」（设备本地日） */
function isTodayCell(y: number, m: number, d: number) {
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() + 1 === m && t.getDate() === d;
}

function isWeekend(y: number, m: number, d: number) {
  const w = new Date(y, m - 1, d).getDay();
  return w === 0 || w === 6;
}

/** 仅用于底部「课程：」行：按日期键取排期昵称（多课中文逗号拼接） */
function getCalendarCellScheduleText(key: string): string | undefined {
  const raw = props.priceData?.[key];
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s || undefined;
  }
  const list = raw.nicknames?.length ? raw.nicknames : raw.nickname ? [raw.nickname] : [];
  const joined = [...new Set(list.filter(Boolean))].join('，');
  return joined || undefined;
}

/** 格子第二行仅节气/农历日，不展示排期昵称（课程只在底部「课程：」行展示） */
function getSubLine(y: number, m: number, d: number): { text: string; kind: 'jieqi' | 'lunar' } {
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const jq = lunar.getJieQi();
  if (jq) return { text: jq, kind: 'jieqi' };
  return { text: lunar.getDayInChinese(), kind: 'lunar' };
}

/** 顶栏公历年月（与底部农历/四柱分工） */
const headerYearMonth = computed(() => {
  return `${displayYear.value}年${displayMonth.value}月`;
});

type Cell = {
  year: number;
  month: number;
  day: number;
  otherMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isWeekend: boolean;
  subLine: string;
  subKind: 'jieqi' | 'lunar';
};

const cells = computed((): Cell[] => {
  const y = displayYear.value;
  const m = displayMonth.value;
  const firstDow = new Date(y, m - 1, 1).getDay();
  const dim = new Date(y, m, 0).getDate();
  const prevDim = new Date(y, m - 1, 0).getDate();

  let py = y;
  let pm = m - 1;
  if (pm < 1) {
    pm = 12;
    py = y - 1;
  }

  const list: Cell[] = [];

  for (let i = 0; i < firstDow; i++) {
    const day = prevDim - firstDow + i + 1;
    const sub = getSubLine(py, pm, day);
    list.push({
      year: py,
      month: pm,
      day,
      otherMonth: true,
      isSelected: isSameYmd(selectedDate.value, py, pm, day),
      isToday: isTodayCell(py, pm, day),
      isWeekend: isWeekend(py, pm, day),
      subLine: sub.text,
      subKind: sub.kind
    });
  }

  for (let d = 1; d <= dim; d++) {
    const sub = getSubLine(y, m, d);
    list.push({
      year: y,
      month: m,
      day: d,
      otherMonth: false,
      isSelected: isSameYmd(selectedDate.value, y, m, d),
      isToday: isTodayCell(y, m, d),
      isWeekend: isWeekend(y, m, d),
      subLine: sub.text,
      subKind: sub.kind
    });
  }

  // 末行未满一周时，用下月初日期补齐（淡显，避免右下角留白）
  let ny = y;
  let nm = m + 1;
  if (nm > 12) {
    nm = 1;
    ny = y + 1;
  }
  let nextDay = 1;
  while (list.length % 7 !== 0) {
    const sub = getSubLine(ny, nm, nextDay);
    list.push({
      year: ny,
      month: nm,
      day: nextDay,
      otherMonth: true,
      isSelected: isSameYmd(selectedDate.value, ny, nm, nextDay),
      isToday: isTodayCell(ny, nm, nextDay),
      isWeekend: isWeekend(ny, nm, nextDay),
      subLine: sub.text,
      subKind: sub.kind
    });
    nextDay += 1;
  }

  return list;
});

function isSameYmd(dt: Date, y: number, m: number, d: number) {
  return dt.getFullYear() === y && dt.getMonth() + 1 === m && dt.getDate() === d;
}

const selectedLunarTitle = computed(() => {
  const y = selectedDate.value.getFullYear();
  const m = selectedDate.value.getMonth() + 1;
  const d = selectedDate.value.getDate();
  const l = Solar.fromYmd(y, m, d).getLunar();
  return `${l.getMonthInChinese()}月${l.getDayInChinese()}`;
});

const pillarBlocks = computed(() => {
  const y = selectedDate.value.getFullYear();
  const m = selectedDate.value.getMonth() + 1;
  const d = selectedDate.value.getDate();
  const bj = getBeijingYmdHms(new Date(beijingNowTick.value || Date.now()));
  const isBeijingToday = y === bj.y && m === bj.m && d === bj.d;
  const hour = isBeijingToday ? bj.h : 12;
  const minute = isBeijingToday ? bj.mi : 0;
  const second = isBeijingToday ? bj.s : 0;
  const solar = Solar.fromYmdHms(y, m, d, hour, minute, second);
  const ec = solar.getLunar().getEightChar();
  const [yG, yZ] = splitGanZhi(ec.getYear());
  const [mG, mZ] = splitGanZhi(ec.getMonth());
  const [dG, dZ] = splitGanZhi(ec.getDay());
  const [tG, tZ] = splitGanZhi(ec.getTime());
  const base = [
    { label: '年', gan: yG, zhi: yZ, highlight: false },
    { label: '月', gan: mG, zhi: mZ, highlight: false },
    { label: '日', gan: dG, zhi: dZ, highlight: true }
  ];
  if (!isBeijingToday) return base;
  return [...base, { label: '时', gan: tG, zhi: tZ, highlight: false }];
});

/** 选中日课程展示：与格子逻辑一致，无排期则「无」 */
const selectedDayCoursesText = computed(() => {
  const y = selectedDate.value.getFullYear();
  const m = selectedDate.value.getMonth() + 1;
  const d = selectedDate.value.getDate();
  const key = dateKey(y, m, d);
  return getCalendarCellScheduleText(key) ?? '无';
});

/** 选中日吉神宜趋正文：getDayJiShen 用顿号串联，无则 — */
const dayJiShenText = computed(() => {
  const y = selectedDate.value.getFullYear();
  const m = selectedDate.value.getMonth() + 1;
  const d = selectedDate.value.getDate();
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const arr = lunar.getDayJiShen();
  if (!arr?.length) return '—';
  const parts = arr.filter((s): s is string => Boolean(s && String(s).trim()));
  return parts.length ? parts.join('、') : '—';
});

function cellInnerClass(cell: Cell) {
  return {
    'lunar-cal__cell-inner--other': cell.otherMonth,
    'lunar-cal__cell-inner--selected-today': cell.isSelected && cell.isToday,
    'lunar-cal__cell-inner--selected-border': cell.isSelected && !cell.isToday
  };
}

function dayTextClass(cell: Cell) {
  if (cell.isSelected && cell.isToday) {
    return 'lunar-cal__cell-day--on-fill';
  }
  if (cell.isSelected && !cell.isToday) {
    return cell.isWeekend ? 'lunar-cal__cell-day--weekend' : 'lunar-cal__cell-day--workday';
  }
  // 今日未选中：用实色置灰（不用整格 opacity，避免「透明」看不清）
  if (cell.isToday && !cell.isSelected) {
    return cell.otherMonth ? 'lunar-cal__cell-day--faint' : 'lunar-cal__cell-day--today-unselected';
  }
  if (cell.otherMonth) {
    return 'lunar-cal__cell-day--faint';
  }
  return cell.isWeekend ? 'lunar-cal__cell-day--weekend' : 'lunar-cal__cell-day--workday';
}

function subTextClass(cell: Cell) {
  if (cell.isSelected && cell.isToday) {
    return 'lunar-cal__cell-sub--on-fill';
  }
  if (cell.isSelected && !cell.isToday) {
    if (cell.subKind === 'jieqi') {
      return 'lunar-cal__cell-sub--accent';
    }
    return 'lunar-cal__cell-sub--muted';
  }
  if (cell.isToday && !cell.isSelected) {
    return cell.otherMonth ? 'lunar-cal__cell-sub--faint' : 'lunar-cal__cell-sub--today-unselected';
  }
  if (cell.otherMonth) {
    return 'lunar-cal__cell-sub--faint';
  }
  if (cell.subKind === 'jieqi') {
    return 'lunar-cal__cell-sub--accent';
  }
  return 'lunar-cal__cell-sub--muted';
}

function prevMonth() {
  if (displayMonth.value <= 1) {
    displayMonth.value = 12;
    displayYear.value -= 1;
  } else {
    displayMonth.value -= 1;
  }
  emit('monthChange', { year: displayYear.value, month: displayMonth.value });
}

function nextMonth() {
  if (displayMonth.value >= 12) {
    displayMonth.value = 1;
    displayYear.value += 1;
  } else {
    displayMonth.value += 1;
  }
  emit('monthChange', { year: displayYear.value, month: displayMonth.value });
}

function onTouchStart(e: { changedTouches: { clientX: number }[] }) {
  touchStartX.value = e.changedTouches[0]?.clientX ?? 0;
}

function onTouchEnd(e: { changedTouches: { clientX: number }[] }) {
  const x = e.changedTouches[0]?.clientX ?? touchStartX.value;
  const dx = x - touchStartX.value;
  const threshold = 50;
  if (Math.abs(dx) < threshold) return;
  // 判定为滑动手势时短暂加锁，避免紧跟着的 tap 误选日期
  swipeLock.value = true;
  if (dx > 0) {
    prevMonth();
  } else {
    nextMonth();
  }
  setTimeout(() => {
    swipeLock.value = false;
  }, 320);
}

function onCellTap(cell: { year: number; month: number; day: number }) {
  if (swipeLock.value) return;
  selectedDate.value = new Date(cell.year, cell.month - 1, cell.day);
  emit('select', selectedDate.value);
}

function emitClose() {
  emit('close');
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.lunar-cal {
  width: 100%;
  background: $calendar-modal-surface;
  overflow: hidden;
}

/* 与全局 $td-font-family 一致；类名保留供模板显式标注语义 */
.lunar-cal__serif {
  font-family: $td-font-family;
}

/* 网格与顶栏月份继承 page 全局宋体系，不再单独指定无衬线 */

.lunar-cal__header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 52rpx 48rpx 28rpx;
  gap: 28rpx;
}

.lunar-cal__header-title {
  flex: 1;
  min-width: 0;
}

.lunar-cal__header-text {
  font-size: $td-font-size-xl;
  font-weight: $td-font-weight-semibold;
  color: $calendar-modal-on-surface;
  line-height: 1.35;
}

.lunar-cal__close {
  flex-shrink: 0;
  font-size: 36rpx;
  line-height: 1;
  color: rgba($calendar-modal-on-surface, 0.35);
  padding: 12rpx 28rpx 12rpx 0;
}

.lunar-cal__swipe {
  width: 100%;
}

.lunar-cal__body {
  padding: 8rpx 48rpx 28rpx;
}

.lunar-cal__weekdays {
  display: flex;
  margin-bottom: 28rpx;
}

.lunar-cal__weekday {
  flex: 1;
  text-align: center;
  font-size: 20rpx;
  font-weight: $td-font-weight-regular;
  letter-spacing: 0.12em;
  color: rgba($calendar-modal-on-surface, 0.4);
}

.lunar-cal__weekday--rest {
  color: rgba($calendar-modal-primary, 0.72);
  font-weight: $td-font-weight-medium;
}

.lunar-cal__grid {
  display: flex;
  flex-wrap: wrap;
}

.lunar-cal__cell {
  width: 14.28%;
  box-sizing: border-box;
}

.lunar-cal__cell-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12rpx 6rpx 18rpx;
  margin: 0 auto 16rpx;
  width: 94%;
  max-width: 102rpx;
  min-height: 92rpx;
  box-sizing: border-box;
  border-radius: $td-radius-default;
}

/* 仅上月补位：淡化 */
.lunar-cal__cell-inner--other {
  opacity: 0.28;
}

/* 选中且为今日：红底圆角方 + 轻微光晕 */
.lunar-cal__cell-inner--selected-today {
  background: $calendar-modal-primary;
  box-shadow:
    0 0 12rpx 2rpx rgba($calendar-modal-primary, 0.45),
    0 0 28rpx 6rpx rgba($calendar-modal-primary, 0.18);
}

/* 选中非今日：红框白底（参考万年历选中态） */
.lunar-cal__cell-inner--selected-border {
  background: $td-bg-color-container;
  border: 3rpx solid $calendar-modal-primary;
  box-sizing: border-box;
}

.lunar-cal__cell-day {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  font-size: 30rpx;
  font-weight: $td-font-weight-regular;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.lunar-cal__cell-day--workday {
  color: $calendar-modal-on-surface;
}

.lunar-cal__cell-day--weekend {
  color: $calendar-modal-primary;
}

.lunar-cal__cell-day--on-fill {
  color: $td-text-color-anti;
  font-weight: $td-font-weight-medium;
}

/* 今日在当月但未选中：置灰仍清晰可读 */
.lunar-cal__cell-day--today-unselected {
  color: $td-text-color-secondary;
}

.lunar-cal__cell-day--faint {
  color: rgba($calendar-modal-on-surface, 0.4);
}

.lunar-cal__cell-sub {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  margin-top: 8rpx;
  font-size: 17rpx;
  font-weight: $td-font-weight-regular;
  line-height: 1.15;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lunar-cal__cell-sub--muted {
  color: rgba($calendar-modal-on-surface, 0.38);
}

.lunar-cal__cell-sub--today-unselected {
  color: $td-text-color-placeholder;
}

.lunar-cal__cell-sub--accent {
  color: rgba($calendar-modal-primary, 0.75);
}

.lunar-cal__cell-sub--on-fill {
  color: rgba($td-text-color-anti, 0.92);
  font-weight: $td-font-weight-medium;
}

.lunar-cal__cell-sub--faint {
  color: rgba($calendar-modal-on-surface, 0.35);
}

.lunar-cal__divider {
  height: 2rpx;
  width: 100%;
  margin: 8rpx 0 4rpx;
  background: $calendar-modal-surface-highest;
}

.lunar-cal__footer {
  background: $calendar-modal-surface-low;
  padding: 28rpx 48rpx 20rpx;
}

/* 与「正月十七」同字号/字重，允许多课换行 */
.lunar-cal__course-line-wrap {
  text-align: center;
  margin-bottom: 24rpx;
}

.lunar-cal__course-line {
  display: block;
  width: 100%;
  white-space: normal;
  word-break: keep-all;
  line-height: 1.45;
}

.lunar-cal__lunar-main-wrap {
  text-align: center;
  margin-bottom: 24rpx;
}

.lunar-cal__lunar-main {
  font-size: $td-font-size-xl;
  font-weight: $td-font-weight-bold;
  color: $calendar-modal-on-surface;
  letter-spacing: 0.16em;
}

/* 外层仅负责水平居中；等宽由 inner 的 grid + 与四柱同宽的 inner 宽度保证 */
.lunar-cal__pillars {
  display: flex;
  justify-content: center;
  margin-bottom: 24rpx;
}

$pillar-gap: 20rpx;
/* 四柱时与父同宽，四列等分（minmax(0,1fr) 避免内容把某一格撑宽） */
.lunar-cal__pillars-inner {
  display: grid;
  gap: $pillar-gap;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/*
 * 三柱：inner 总宽 = 四柱布局下「三格 + 两缝」，与单格宽 W=(100%-3*gap)/4 代数一致；
 * repeat(3,1fr) 三等分该宽度，避免 flex-basis 与 flex:1 在真机上的亚像素差。
 */
.lunar-cal__pillars-inner--triple {
  width: calc((100% - 3 * #{$pillar-gap}) * 3 / 4 + 2 * #{$pillar-gap});
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* getDayJiShen：单列居中，上微灰标题、下衬线正文（顿号串联、可多行） */
.lunar-cal__ji-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 48rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  width: 100%;
}

.lunar-cal__ji-meta-label {
  font-size: 16rpx;
  font-weight: $td-font-weight-medium;
  color: rgba($calendar-modal-on-surface, 0.3);
  letter-spacing: 0.02em;
  line-height: 1.2;
  margin-bottom: 8rpx;
}

.lunar-cal__ji-meta-value {
  width: 100%;
  font-size: 24rpx;
  font-weight: $td-font-weight-regular;
  color: rgba($calendar-modal-on-surface, 0.6);
  line-height: 1.55;
  text-align: center;
  word-break: keep-all;
}

.lunar-cal__pillar {
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 10rpx;
  border-radius: $td-radius-large;
  background: $td-bg-color-container;
  border: 2rpx solid rgba($calendar-modal-outline-variant, 0.1);
  box-shadow: $td-shadow-1;
}

.lunar-cal__pillar--day {
  border-color: rgba($calendar-modal-primary, 0.2);
  background: rgba($calendar-modal-primary, 0.05);
}

.lunar-cal__pillar-label {
  font-size: 18rpx;
  color: rgba($calendar-modal-on-surface, 0.4);
  margin-bottom: 10rpx;
}

.lunar-cal__pillar--day .lunar-cal__pillar-label {
  color: rgba($calendar-modal-primary, 0.6);
}

.lunar-cal__pillar-gz {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lunar-cal__pillar-ch {
  font-size: 32rpx;
  font-weight: $td-font-weight-bold;
  color: $calendar-modal-on-surface;
  line-height: 1.08;
}

.lunar-cal__pillar--day .lunar-cal__pillar-ch {
  color: $calendar-modal-primary;
}

.lunar-cal__handle-wrap {
  display: flex;
  justify-content: center;
  padding: 16rpx 0 36rpx;
  background: $calendar-modal-surface-low;
}

.lunar-cal__handle {
  width: 80rpx;
  height: 8rpx;
  border-radius: $td-radius-round;
  background: rgba($calendar-modal-on-surface, 0.1);
}
</style>
