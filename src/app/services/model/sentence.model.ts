import { TranslateModel } from './translate.model';

// 句段状态
export const SentenceStatus = Object.freeze({
  INITIAL: 0,     // 未翻译
  TRANSLATED: 1,  // 已翻译未确认(预翻译/自翻译)
  CHECKED: 2,     // 已确认(不需要再次翻译)
  NEEDLESS: 3     // 不需要翻译
});

// 句段模型
export class SentenceModel {
  source: string;
  target: number;
  status: number;
  custom: TranslateModel;
  refers: Array<TranslateModel>;

  constructor(obj?: any) {
    this.source = obj && obj.source || '';
    this.target = obj && obj.target || -2;
    this.status = obj && obj.status || 0;
    this.custom = obj && obj.custom || null;
    this.refers = obj && obj.refers || [];
  }
}

// 统计信息
export class StatisticsModel {
  initial: number;
  translated: number;
  checked: number;
  needless: number;

  constructor(obj?: any) {
    this.initial = obj && obj.initial || 0;
    this.translated = obj && obj.translated || 0;
    this.checked = obj && obj.checked || 0;
    this.needless = obj && obj.needless || 0;
  }
}
