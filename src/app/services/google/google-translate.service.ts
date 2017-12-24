import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateService } from '../engine/translate.service';
import { TranslateModel } from '../model/translate.model';

// 由于translate.google.com被墙，需要手动修改node_modules中的代码，这不符合规矩
// TODO: Fork项目node-google-translate-skidz，发布针对中国大陆的版本
const google_translate = (<any>window).require('node-google-translate-skidz');

@Injectable()
export class GoogleTranslateService extends TranslateService {

  constructor() {
    super('Google');
  }

  translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel> {
    if (source_lang === 'zh') {
      source_lang = 'zh-cn';
    }

    if (target_lang === 'zh') {
      target_lang = 'zh-cn';
    }

    return Observable.create(observer => {
      try {
        google_translate({text: source_text, source: source_lang, target: target_lang}, (result) => {
          const tm = new TranslateModel();
          tm.engine_name = this.getEngineName();
          tm.source_lang = source_lang;
          tm.target_lang = target_lang;
          tm.source_text = source_text;
          tm.target_text = result.translation;
          if (tm.target_lang in ['zh-cn', 'zh-tw']) {
            tm.hz_translit = result.sentences[result.sentences.length - 1].translit;  // 中文拼音
          }
          observer.next(tm);
        });
      } catch (e) {
        observer.error(e);
      }
    });
  }

  /*
  translate(source_text: string, callback: Function): void {
    google_translate({text: source_text, source: this.source_lang, target: this.target_lang}, (result) => {
      // 中文拼音： result.sentences[result.sentences.length - 1].translit
      callback(result.translation);
    });
  }*/
}
