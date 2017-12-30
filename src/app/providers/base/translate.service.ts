import {Observable} from 'rxjs/Observable';
import { TranslateModel } from '../../services/model/translate.model';


export abstract class TranslateService {
  constructor(private engine_name: string) {
  }

  getEngineName(): string {
    return this.engine_name;
  }

  abstract translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel>;
}
