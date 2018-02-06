// 翻译状态
export const TranslateState = Object.freeze({
  INITIAL: 0,    // 初始状态
  REQUESTED: 1,  // 发起请求
  RECEIVED: 2,   // 收到响应
  SUCCESS: 3,    // 翻译成功
  FAILED: 4      // 翻译失败
});

// 翻译质量等级
export const TranslateGrade = Object.freeze({
  LOW: -1,  // 劣等
  MID: 0,   // 正常(或没有判定)
  HIGH: 1   // 优质翻译(人翻/机翻)
});

// 翻译模型
export class TranslateModel {
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  hz_translit: string;
  engine_name: string;
  trans_state: number;
  trans_grade: number;

  constructor(obj?: any) {
    this.source_lang = obj && obj.source_lang || 'en';
    this.target_lang = obj && obj.target_lang || 'zh';
    this.source_text = obj && obj.source_text || '';
    this.target_text = obj && obj.target_text || '';
    this.hz_translit = obj && obj.hz_translit || '';
    this.engine_name = obj && obj.engine_name || 'Google';
    this.trans_state = obj && obj.trans_state || 0;
    this.trans_grade = obj && obj.trans_grade || 0;
  }
}
