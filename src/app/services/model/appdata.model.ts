export class AppdataModel {
  source_lang: string;
  target_lang: string;
  current_doc: string;  // 当前文档序号
  recent_docs: Array<string>;  // 最近翻译文档
}
