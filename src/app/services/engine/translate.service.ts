// import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';


// @Injectable()
export class TranslateService {
  source_lang = 'en';
  target_lang = 'zh';

  setSourceLanguage(language: string) {
    this.source_lang = language;
  }

  setTargetLanguage(language: string) {
    this.target_lang = language;
  }

  //translate(source_text: string);  // 使用可观察对象
}
