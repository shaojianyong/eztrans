import { TranslateModel } from './translate.model';

export class SentenceModel {
  source: string;
  target: string;
  refers: Array<TranslateModel>;
}
