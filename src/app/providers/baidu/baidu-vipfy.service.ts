import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { TranslateService, TranslateResult } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
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

  translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel> {
    const tm_now = Date.now().toString();
    const params = {
      from: source_lang,
      to: target_lang,
      q: source_text,
      appid: APPID,
      salt: tm_now,
      sign: md5(`${APPID}${source_text}${tm_now}${KEY}`)
    };

    const data = querystring.stringify(params);
    const head = new HttpHeaders({
      'Content-Length': data.length,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    });

    return Observable.create(observer => {
      this.http.post('http://api.fanyi.baidu.com/api/trans/vip/translate', data, {headers: head}).subscribe(
        res => {
          const tm = new TranslateModel();
          tm.engine_name = this.getEngineName();
          tm.source_lang = source_lang;
          tm.target_lang = target_lang;
          tm.source_text = source_text;
          tm.target_text = '';
          for (const sentence of res['trans_result']) {
            tm.target_text += sentence['dst'];
          }
          observer.next(tm);
        },
        err => {
          observer.error(err);
        },
        () => {
          observer.complete();
        });
    });
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

  translateX(translate: TranslateModel, doc_id: string): Observable<TranslateResult> {
    const tm_now = Date.now().toString();
    const params = {
      from: this.duLangCode(translate.source_lang),
      to: this.duLangCode(translate.target_lang),
      q: translate.source_text,
      appid: APPID,
      salt: tm_now,
      sign: md5(`${APPID}${translate.source_text}${tm_now}${KEY}`)
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
          observer.next({result: 'ok', doc_id: doc_id});
        },
        err => {
          observer.error({result: err, doc_id: doc_id});
        },
        () => {
          observer.complete();
        });
    });
  }

}
