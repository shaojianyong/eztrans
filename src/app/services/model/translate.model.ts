// 翻译状态
// https://stackoverflow.com/questions/44447847/enums-in-javascript-with-es6
export const TranslateState = Object.freeze({
  INITIAL: 'initial',      // 初始状态
  REQUESTED: 'requested',  // 发起请求
  RECEIVED: 'received',    // 收到响应
  SUCCESS: 'success',  // 翻译成功
  FAILURE: 'failure'   // 翻译失败
});

// 翻译模型
export class TranslateModel {
  target_text: string;
  engine_name: string;
  trans_state: string;
  trans_grade: number;  // 翻译打分(翻译质量等级，5星制)：-1-劣等；0-正常(默认)；1-优质(人工翻译)

  constructor(obj?: any) {
    this.target_text = obj && obj.target_text || '';
    this.engine_name = obj && obj.engine_name || 'Google';
    this.trans_state = obj && obj.trans_state || TranslateState.INITIAL;
    this.trans_grade = obj && obj.trans_grade || 3;  // 默认3星
  }
}
