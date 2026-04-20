/**
 * lunar-javascript 无官方类型声明，供 TypeScript 校验 import
 */
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number
    ): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getDayInChinese(): string;
    getMonthInChinese(): string;
    /** 非节气日可能为空字符串 */
    getJieQi(): string;
    getEightChar(): EightChar;
    /** 吉神宜趋（天喜、天医、天赦等） */
    getDayJiShen(): string[];
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
  }
}
