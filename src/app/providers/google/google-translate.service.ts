import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateService, TranslateResult } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
import { DocInfoModel } from '../../services/model/doc-info.model';


// 由于translate.google.com被墙，需要手动修改node_modules中的代码，这不符合规矩
// TODO: Fork项目node-google-translate-skidz，发布针对中国大陆的版本
const google_translate = (<any>window).require('node-google-translate-skidz');

@Injectable()
export class GoogleTranslateService extends TranslateService {

  constructor() {
    super('Google');
  }

  translateX(srcText: string, translate: TranslateModel, docInfo: DocInfoModel): Observable<TranslateResult> {
    return Observable.create(observer => {
      try {
        google_translate({
          text: srcText,
          source: docInfo.source_lang,
          target: docInfo.target_lang
        }, (result) => {
            translate.target_text = result.translation;
          translate.trans_grade = 4;
          observer.next({result: 'ok', doc_id: docInfo.id});
        });
      } catch (e) {
        observer.error({result: e, doc_id: docInfo.id});
      }
    });
  }

  /*
  translate(srcText: string, callback: Function): void {
    google_translate({text: srcText, source: this.source_lang, target: this.target_lang}, (result) => {
      // 中文拼音： result.sentences[result.sentences.length - 1].translit
      callback(result.translation);
    });
  }*/
}
