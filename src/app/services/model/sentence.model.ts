import { TranslateModel } from './translate.model';

export const SentenceStatus = Object.freeze({
  INITIAL: 'initial',  // 初始状态
  IN_PROC: 'in_proc',  // 翻译中
  SUCCESS: 'success',  // 成功(不代表所有引擎都返回了结果)
  WARNING: 'warning',  // 告警
  FAILURE: 'failure'   // 失败
});

// 句段模型
export class SentenceModel {
  source: string;
  target: number;
  ignore: boolean;  // 跳过，不需要翻译
  marked: boolean;  // 翻译完成标记
  custom: TranslateModel;
  refers: Array<TranslateModel>;  // TODO: 把数组改成对象，引擎名称作为key，翻译结果作为value，同时可纳入custom

  constructor(obj?: any) {
    this.source = obj && obj.source || '';
    this.target = obj && obj.target || -2;
    this.ignore = obj && obj.ignore || false;
    this.marked = obj && obj.marked || false;
    this.custom = obj && obj.custom || null;
    this.refers = obj && obj.refers || [];
  }
}
