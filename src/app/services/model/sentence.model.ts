import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: string;
  custom: TranslateModel;
  refers: Array<TranslateModel>;
}
