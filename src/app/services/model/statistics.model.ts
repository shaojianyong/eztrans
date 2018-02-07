// 统计信息
export class StatisticsModel {
  initial: number;  // 未翻译
  transed: number;  // 已翻译未确认(预翻译/自翻译)
  checked: number;  // 已确认(不需要再次翻译)
  skipped: number;  // 不需要翻译
  directs: number;  // 直接引用的数量
  revised: number;  // 用户自翻译数量(修订)

  constructor(obj?: any) {
    this.initial = obj && obj.initial || 0;
    this.transed = obj && obj.transed || 0;
    this.checked = obj && obj.checked || 0;
    this.skipped = obj && obj.skipped || 0;
    this.directs = obj && obj.directs || 0;
    this.revised = obj && obj.revised || 0;
  }
}
