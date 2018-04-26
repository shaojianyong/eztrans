import { TranslateModel } from './translate.model';

export const SentenceStatus = Object.freeze({
  INITIAL: 'initial',  // 初始状态
  IN_PROC: 'in_proc',  // 翻译中
  SUCCESS: 'success',  // 成功(不代表所有引擎都返回了结果)
  WARNING: 'warning',  // 告警
  FAILURE: 'failure'   // 失败
});

export class SliceOrder {
  beg: number;
  end: number;
  ord: number;
}

export class VersionModel {
  engine: string;  // 翻译引擎
  target: TranslateModel;  // 译本，整体翻译结果
  slices: Array<TranslateModel>;  // 分片翻译结果，译本切分依据
  orders: Array<SliceOrder>;

  constructor(obj?: any) {
    this.engine = obj && obj.engine || 'Google';
    this.target = obj && obj.target || null;
    this.slices = obj && obj.slices || [];
    this.orders = obj && obj.orders || [];
  }
}

// 分片节点
export class SliceNode {
  orgText: string;  // 原文文本
  tagName: string;  // TextNode所在的element标签
  plcHldr: string;  // placeholder

  constructor(obj?: any) {
    this.orgText = obj && obj.orgText || '';
    this.tagName = obj && obj.tagName || '';
    this.plcHldr = obj && obj.plcHldr || '';
  }
}

// 句段模型
export class SentenceModel {
  source: Array<SliceNode>;
  target: number;
  ignore: boolean;  // 跳过，不需要翻译
  marked: boolean;  // 翻译完成标记
  custom: Array<string>;  // 自定义翻译
  refers: Array<VersionModel>;
  srcmtu: string;  // 源始最小翻译单元，输入文本和HTML模板
  dstmtu: string;  // 目的最小翻译单元，输出文本和HTML模板

  constructor(obj?: any) {
    this.source = obj && obj.source || [];
    this.target = obj && obj.target || -2;
    this.ignore = obj && obj.ignore || false;
    this.marked = obj && obj.marked || false;
    this.custom = obj && obj.custom || [];
    this.refers = obj && obj.refers || [];
    this.srcmtu = obj && obj.srcmtu || '';
    this.dstmtu = obj && obj.dstmtu || '';
  }
}
