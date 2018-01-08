/**
 * Translate record model
 */

export class TranslateModel {
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  hz_translit: string;
  engine_name: string;
  trans_state: number;  // 翻译质量等级：-1-劣等；0-正常(默认)；1-优质(人工翻译)

  constructor(obj?: any) {
    this.source_lang = obj && obj.source_lang || 'en';
    this.target_lang = obj && obj.target_lang || 'zh';
    this.source_text = obj && obj.source_text || '';
    this.target_text = obj && obj.target_text || '';
    this.hz_translit = obj && obj.hz_translit || '';
    this.engine_name = obj && obj.engine_name || 'Google';
    this.trans_state = obj && obj.trans_state || 0;
  }
}
