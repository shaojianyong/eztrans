import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: number;
  status: number;
  marked: boolean;
  custom: TranslateModel;
  refers: Array<TranslateModel>;
}
