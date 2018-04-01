import { TranslateModel } from './translate.model';

export const SentenceStatus = Object.freeze({
  INITIAL: 'initial',  // 初始状态
  IN_PROC: 'in_proc',  // 翻译中
  SUCCESS: 'success',  // 成功(不代表所有引擎都返回了结果)
  WARNING: 'warning',  // 告警
  FAILURE: 'failure'   // 失败
});

export class VersionModel {
  engine: string;  // 翻译引擎
  target: TranslateModel;  // 译本，整体翻译结果
  slices: Array<TranslateModel>;  // 分片翻译结果，译本切分依据
  divides: Array<number>;  // 译本切分，长度为N+1：0,...target.target_text.length

  constructor(obj?: any) {
    this.engine = obj && obj.engine || 'Google';
    this.target = obj && obj.target || null;
    this.slices = obj && obj.slices || [];
    this.divides = obj && obj.divides || [];
  }
}

// 句段模型
export class SentenceModel {
  source: Array<string>;
  target: number;
  ignore: boolean;  // 跳过，不需要翻译
  marked: boolean;  // 翻译完成标记
  custom: Array<string>;  // 自定义翻译
  refers: Array<VersionModel>;
  inhtml: string;

  constructor(obj?: any) {
    this.source = obj && obj.source || [];
    this.target = obj && obj.target || -2;
    this.ignore = obj && obj.ignore || false;
    this.marked = obj && obj.marked || false;
    this.custom = obj && obj.custom || [];
    this.refers = obj && obj.refers || [];
    this.inhtml = obj && obj.inhtml || '';
  }
}
