import { TranslateModel } from './translate.model';

// 语句翻译状态
export const SentenceStatus = Object.freeze({
  INITIAL: 'initial',  // 初始状态
  IN_PROC: 'in_proc',  // 翻译中
  SUCCESS: 'success',  // 成功(不代表所有引擎都返回了结果)
  WARNING: 'warning',  // 告警
  FAILURE: 'failure'   // 失败
});

// 目标分片
export class TargetSlice {
  tgt: TranslateModel;
  beg: number;
  end: number;
  ord: number;

  constructor(obj?: any) {
    this.tgt = obj && obj.tgt || null;
    this.beg = obj && obj.beg || -1;
    this.end = obj && obj.end || -1;
    this.ord = obj && obj.ord || -1;
  }
}

// 不同引擎的翻译版本
export class VersionModel {
  engine: string;  // 翻译引擎
  target: TranslateModel;  // 译本，整体翻译结果
  slices: Array<TargetSlice>;  // 分片翻译结果，译本切分依据

  constructor(obj?: any) {
    this.engine = obj && obj.engine || 'Google';
    this.target = obj && obj.target || null;
    this.slices = obj && obj.slices || [];
  }
}

// 分片节点。对于包含多个分片的语句，如果有些分片不需要翻译(例如，链接)，在整体送给翻译引擎时，
// 这些分片的文本由特殊符号代替，这些符号就是占位符。占位符的选取有两个要求：
// 1) 占位符不会被引擎翻译（占位符原样返回，才能正确还原）。
// 2) 占位符不能出现在原文中（即，不能与原文冲突）。
export class SourceSlice {
  orgText: string;  // 原文文本
  tagName: string;  // TextNode所在的element标签
  plcHldr: string;  // placeholder不需要翻译分片的占位符
  nodeIdx: number;  // 节点索引

  constructor(obj?: any) {
    this.orgText = obj && obj.orgText || '';
    this.tagName = obj && obj.tagName || '';
    this.plcHldr = obj && obj.plcHldr || '';
    this.nodeIdx = obj && obj.nodeIdx || -1;
  }
}

// 句段模型
export class SentenceModel {
  slices: Array<SourceSlice>;
  target: number;
  ignore: boolean;  // 跳过，不需要翻译
  marked: boolean;  // 翻译完成标记
  custom: Array<string>;  // 自定义翻译
  refers: Array<VersionModel>;
  srcmtu: string;  // 源始最小翻译单元，输入文本和HTML模板
  dstmtu: string;  // 目的最小翻译单元，输出文本和HTML模板

  constructor(obj?: any) {
    this.slices = obj && obj.slices || [];
    this.target = obj && obj.target || -2;
    this.ignore = obj && obj.ignore || false;
    this.marked = obj && obj.marked || false;
    this.custom = obj && obj.custom || [];
    this.refers = obj && obj.refers || [];
    this.srcmtu = obj && obj.srcmtu || '';
    this.dstmtu = obj && obj.dstmtu || '';
  }
}
