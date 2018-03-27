import {Observable} from 'rxjs/Observable';
import { TranslateModel } from '../../services/model/translate.model';
import { DocInfoModel } from '../../services/model/doc-info.model';


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

  abstract translateX(translate: TranslateModel, docInfo: DocInfoModel): Observable<TranslateResult>;
}
