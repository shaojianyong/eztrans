import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: number;
  ignore: boolean;  // 跳过
  hidden: boolean;  // 隐藏
  status: number;   // 0-初始状态 1-发起请求 2-返回响应 3-翻译完成 4-告警 5-错误
  marked: boolean;
  custom: TranslateModel;
  refers: Array<TranslateModel>;
}
