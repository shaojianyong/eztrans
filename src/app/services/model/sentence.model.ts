import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: number;
  custom: TranslateModel;
  refers: Array<TranslateModel>;
}
