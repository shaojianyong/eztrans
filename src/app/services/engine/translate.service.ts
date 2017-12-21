import {Observable} from 'rxjs/Observable';
import { TranslateModel } from './translate.model';


export abstract class TranslateService {
  source_lang = 'en';
  target_lang = 'zh';

  setSourceLanguage(language: string) {
    this.source_lang = language;
  }

  setTargetLanguage(language: string) {
    this.target_lang = language;
  }

  abstract translate(source_text: string): Observable<TranslateModel>;
}
