import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: number;
  status: number;  // 0-正常 1-隐藏(不在列表中显示) 2-跳过不译(保留原文) 3-隐藏，跳过不翻译
  marked: boolean;
  custom: TranslateModel;
  refers: Array<TranslateModel>;
}
