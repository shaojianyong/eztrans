export class StatisticsModel {
  skipped: number;  // 跳过的
  undealt: number;  // 未翻译的
  directs: number;  // 直接引用的
  revised: number;  // 修订的

  constructor(obj?: any) {
    this.skipped = obj && obj.skipped || 0;
    this.undealt = obj && obj.undealt || 0;
    this.directs = obj && obj.directs || 0;
    this.revised = obj && obj.revised || 0;
  }
}
