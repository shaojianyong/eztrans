import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: number;
  ignore: boolean;  // 跳过
  status: number;   // 0-初始状态 1-发起请求 2-返回响应 3-翻译完成 4-告警 5-错误
  marked: boolean;
  custom: TranslateModel;
  refers: Array<TranslateModel>;

  constructor(obj?: any) {
    this.source = obj && obj.source || '';
    this.target = obj && obj.target || -2;
    this.ignore = obj && obj.ignore || false;
    this.status = obj && obj.status || 0;
    this.marked = obj && obj.marked || false;
    this.custom = obj && obj.custom || null;
    this.refers = obj && obj.refers || [];
  }
}
