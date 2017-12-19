
export class Translate {
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  engine_name: string;

  constructor(obj?: any) {
    this.source_lang = obj && obj.source_lang || 'en';
    this.target_lang = obj && obj.target_lang || 'zh';
    this.source_text = obj && obj.source_text || '';
    this.target_text = obj && obj.target_text || '';
    this.engine_name = obj && obj.engine_name || 'Google';
  }
}
