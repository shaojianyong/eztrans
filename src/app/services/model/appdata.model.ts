// 应用数据
export class AppdataModel {
  default_src_lang: string;  // 默认原文语言
  default_tgt_lang: string;  // 默认目标语言
  last_open_doc_id: string;  // 最近打开文档的ID

  constructor(obj?: any) {
    this.default_src_lang = obj && obj.default_src_lang || 'auto';
    this.default_tgt_lang = obj && obj.default_tgt_lang || 'zh-cn';
    this.last_open_doc_id = obj && obj.last_open_doc_id || '';
  }
}
