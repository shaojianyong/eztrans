import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { TranslateService, TranslateResult } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
import { DocInfoModel } from '../../services/model/doc-info.model';
const querystring = (<any>window).require('querystring');
const md5 = (<any>window).require('md5');


// 使用依赖注入，注入以下参数：
const APPID = '2015063000000001';
const KEY = '12345678';

@Injectable()
export class BaiduVipfyService extends TranslateService {
  constructor(private http: HttpClient) {
    super('BaiduVIP');
  }

  duLangCode(goLangCode: string): string {
    let res = goLangCode;
    if (goLangCode === 'zh-cn') {
      res = 'zh';
    }
    if (goLangCode === 'zh-tw') {
      res = 'cht';
    }
    return res;
  }

  translateX(srcText: string, translate: TranslateModel, docInfo: DocInfoModel): Observable<TranslateResult> {
    const tm_now = Date.now().toString();
    const params = {
      from: this.duLangCode(docInfo.source_lang),
      to: this.duLangCode(docInfo.target_lang),
      q: srcText,
      appid: APPID,
      salt: tm_now,
      sign: md5(`${APPID}${srcText}${tm_now}${KEY}`)
    };

    const data = querystring.stringify(params);
    const head = new HttpHeaders({
      'Content-Length': data.length,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    });

    return Observable.create(observer => {
      this.http.post('http://api.fanyi.baidu.com/api/trans/vip/translate', data, {headers: head}).subscribe(
        res => {
          translate.target_text = '';
          for (const sentence of res['trans_result']) {
            translate.target_text += sentence['dst'];
          }
          observer.next({result: 'ok', doc_id: docInfo.id});
        },
        err => {
          observer.error({result: err, doc_id: docInfo.id});
        },
        () => {
          observer.complete();
        });
    });
  }

}
