// 应用数据
export class AppdataModel {
  default_src_lang: string;  // 默认原文语言
  default_tgt_lang: string;  // 默认目标语言

  constructor(obj?: any) {
    this.default_src_lang = obj && obj.default_src_lang || 'auto';
    this.default_tgt_lang = obj && obj.default_tgt_lang || 'zh-cn';
  }
}
