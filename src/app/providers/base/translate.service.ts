import {Observable} from 'rxjs/Observable';
import { TranslateModel } from '../../services/model/translate.model';


export class TranslateResult {
  result: string;
  doc_id: string;

  constructor(obj?: any) {
    this.result = obj && obj.result || '';
    this.doc_id = obj && obj.doc_id || '';
  }
}

export abstract class TranslateService {
  constructor(private engine_name: string) {
  }

  getEngineName(): string {
    return this.engine_name;
  }

  abstract translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel>;

  abstract translateX(translate: TranslateModel, doc_id: string): Observable<TranslateResult>;
}
