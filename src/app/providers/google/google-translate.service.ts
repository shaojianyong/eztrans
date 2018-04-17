import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateService, TranslateResult } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
import { DocInfoModel } from '../../services/model/doc-info.model';


// 由于translate.google.com被墙，需要手动修改node_modules中的代码，这不符合规矩
// TODO: Fork项目node-google-translate-skidz，发布针对中国大陆的版本
const google_translate = (<any>window).require('google-translate-api');

@Injectable()
export class GoogleTranslateService extends TranslateService {

  constructor() {
    super('Google');
  }

  translateX(srcText: string, translate: TranslateModel, docInfo: DocInfoModel): Observable<TranslateResult> {
    return Observable.create(observer => {
      google_translate(srcText, {from: docInfo.source_lang, to: docInfo.target_lang}).then(res => {
        translate.target_text = res.text;
        translate.trans_grade = 4;
        observer.next({result: 'ok', doc_id: docInfo.id});
      }).catch(err => {
        observer.error({result: err, doc_id: docInfo.id});
      });
    });
  }
}
