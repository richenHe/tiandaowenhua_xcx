/**
 * 统一定时工具类
 *
 * 提供两个组合式函数：
 *   - useMidnightRefresh：每日 0 点自动触发回调（用于刷新需按日期判断状态的数据）
 *   - useCountdownTimer ：秒级倒计时，到 0 时执行回调（用于待支付订单超时）
 *
 * 两者均在 onUnmounted 时自动清理定时器，无需手动管理。
 */
import { onUnmounted } from 'vue';

// ──────────────────────────────────────────────────────────────
// useMidnightRefresh
// ──────────────────────────────────────────────────────────────

/**
 * 计算距下一个 0 点（本地时间）的毫秒数
 */
function msToMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // 下一个 0 点
  return next.getTime() - now.getTime();
}

/**
 * 每日 0 点触发回调
 *
 * @param callback 0 点时执行的函数（通常用于重新加载状态数据）
 *
 * @example
 * import { useMidnightRefresh } from '@/utils/timer'
 *
 * onMounted(() => {
 *   useMidnightRefresh(() => {
 *     loadScheduleList(); // 重新拉取排期，获取最新状态
 *   });
 * });
 */
export function useMidnightRefresh(callback: () => void): void {
  let timer: number | ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    const delay = msToMidnight();
    timer = setTimeout(() => {
      callback();
      // 执行后再安排下一天的 0 点
      schedule();
    }, delay);
  };

  schedule();

  onUnmounted(() => {
    if (timer !== null) {
      clearTimeout(timer as number);
      timer = null;
    }
  });
}

// ──────────────────────────────────────────────────────────────
// useCountdownTimer
// ──────────────────────────────────────────────────────────────

/**
 * 秒级倒计时
 *
 * @param getSeconds  返回当前剩余秒数的函数（响应式 ref.value 或普通数值函数均可）
 * @param setSeconds  更新剩余秒数的函数
 * @param onExpire    倒计时结束时（秒数 ≤ 0）调用的回调
 * @returns           { start, stop } 手动控制定时器的方法
 *
 * @example
 * import { ref } from 'vue'
 * import { useCountdownTimer } from '@/utils/timer'
 *
 * const countdown = ref(0)
 *
 * const { start, stop } = useCountdownTimer(
 *   () => countdown.value,
 *   (v) => { countdown.value = v },
 *   () => { uni.navigateBack() }
 * )
 *
 * // 计算剩余秒数后启动
 * countdown.value = remaining
 * start()
 */
export function useCountdownTimer(
  getSeconds: () => number,
  setSeconds: (v: number) => void,
  onExpire: () => void
): { start: () => void; stop: () => void } {
  let timer: number | ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer as number);
      timer = null;
    }
  };

  const start = () => {
    // 先停掉旧的
    stop();
    timer = setInterval(() => {
      const current = getSeconds();
      const next = current - 1;
      setSeconds(next);
      if (next <= 0) {
        stop();
        onExpire();
      }
    }, 1000) as unknown as number;
  };

  onUnmounted(stop);

  return { start, stop };
}
