// 应用数据，TODO: 有些混乱，需要区分哪些是配置，哪些是应用数据
export class AppdataModel {
  default_src_lang: string;  // 默认原文语言
  default_tgt_lang: string;  // 默认目标语言
  last_open_doc_id: string;  // 最近打开文档的ID
  show_engine_icon: boolean;  // 在翻译列表中展示引擎图标

  constructor(obj?: any) {
    this.default_src_lang = obj && obj.default_src_lang || 'auto';
    this.default_tgt_lang = obj && obj.default_tgt_lang || 'zh-cn';
    this.last_open_doc_id = obj && obj.last_open_doc_id || '';
    this.show_engine_icon = obj && obj.show_engine_icon || false;
  }
}
