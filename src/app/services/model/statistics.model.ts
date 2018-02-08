// 统计信息
export class StatisticsModel {
  initial: number;  // 未翻译
  transed: number;  // 已翻译未确认
  checked: number;  // 已确认(不需要再次翻译)
  skipped: number;  // 不需要翻译
  directs: number;  // 直接引用预翻译的数量
  revised: number;  // 用户自行翻译的数量(修订和飞行中翻译)

  constructor(obj?: any) {
    this.initial = obj && obj.initial || 0;
    this.transed = obj && obj.transed || 0;
    this.checked = obj && obj.checked || 0;
    this.skipped = obj && obj.skipped || 0;
    this.directs = obj && obj.directs || 0;
    this.revised = obj && obj.revised || 0;
  }

  getTotal(): number {
    return (this.initial + this.transed + this.checked + this.skipped);
  }

  getCompletionRate(): number {
    let res = 0;
    const total = this.getTotal();
    if (total) {
      res = ((this.checked + this.skipped) * 100) / total;
    }
    return Math.floor(res);
  }
}
