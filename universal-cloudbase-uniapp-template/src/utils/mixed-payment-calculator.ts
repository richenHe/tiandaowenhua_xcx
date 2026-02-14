/**
 * 混合支付计算器
 * 用于计算功德分和现金积分的混合支付方案
 */

export interface PaymentPlan {
  canPay: boolean
  meritPointsUsed: number
  cashPointsUsed: number
  totalCost: number
  errorMessage?: string
}

export interface UserPoints {
  meritPoints: number
  cashPointsAvailable: number
}

/**
 * 计算混合支付方案
 * @param totalCost 总成本
 * @param userPoints 用户积分信息
 * @param useCashPointsIfNotEnough 是否允许使用现金积分补充
 * @returns 支付方案
 */
export function calculateMixedPayment(
  totalCost: number,
  userPoints: UserPoints,
  useCashPointsIfNotEnough: boolean = true
): PaymentPlan {
  const { meritPoints, cashPointsAvailable } = userPoints

  // 功德分足够
  if (meritPoints >= totalCost) {
    return {
      canPay: true,
      meritPointsUsed: totalCost,
      cashPointsUsed: 0,
      totalCost
    }
  }

  // 功德分不足，需要现金积分补充
  if (useCashPointsIfNotEnough) {
    const meritPointsUsed = meritPoints
    const cashPointsNeeded = totalCost - meritPoints

    // 现金积分也不足
    if (cashPointsAvailable < cashPointsNeeded) {
      return {
        canPay: false,
        meritPointsUsed: 0,
        cashPointsUsed: 0,
        totalCost,
        errorMessage: `现金积分不足，还需${(cashPointsNeeded - cashPointsAvailable).toFixed(2)}积分`
      }
    }

    // 可以用现金积分补充
    return {
      canPay: true,
      meritPointsUsed,
      cashPointsUsed: cashPointsNeeded,
      totalCost
    }
  }

  // 不允许使用现金积分
  return {
    canPay: false,
    meritPointsUsed: 0,
    cashPointsUsed: 0,
    totalCost,
    errorMessage: `功德分不足，还需${(totalCost - meritPoints).toFixed(2)}功德分`
  }
}

/**
 * 格式化支付方案为可读文本
 * @param plan 支付方案
 * @returns 格式化后的文本
 */
export function formatPaymentPlan(plan: PaymentPlan): string {
  if (!plan.canPay) {
    return plan.errorMessage || '支付失败'
  }

  const parts: string[] = []
  
  if (plan.meritPointsUsed > 0) {
    parts.push(`功德分：${plan.meritPointsUsed.toFixed(2)}`)
  }
  
  if (plan.cashPointsUsed > 0) {
    parts.push(`现金积分：${plan.cashPointsUsed.toFixed(2)}（可提现）`)
  }

  return parts.join('\n')
}




















