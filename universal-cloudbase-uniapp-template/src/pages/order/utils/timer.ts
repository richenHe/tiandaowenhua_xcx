/**
 * 订单分包内定时工具（仅待支付页等使用）
 *
 * 放在分包内可避免主包打入 utils/timer，满足微信「仅分包使用的 JS 勿放主包」的体积与质检要求。
 * 提供：
 *   - useMidnightRefresh：每日 0 点自动触发回调
 *   - useCountdownTimer：秒级倒计时，到 0 时执行回调
 */
import { onUnmounted } from 'vue';

function msToMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/**
 * 每日 0 点触发回调（onUnmounted 时清理）
 */
export function useMidnightRefresh(callback: () => void): void {
  let timer: number | ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    const delay = msToMidnight();
    timer = setTimeout(() => {
      callback();
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

/**
 * 秒级倒计时（onUnmounted 时 stop）
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
