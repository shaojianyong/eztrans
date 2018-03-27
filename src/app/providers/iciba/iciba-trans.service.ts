import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TranslateService, TranslateResult } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
import { DocInfoModel } from '../../services/model/doc-info.model';
const querystring = (<any>window).require('querystring');


@Injectable()
export class IcibaTransService extends TranslateService {
  constructor(private http: HttpClient) {
    super('iCIBA');
  }

  // https://stackoverflow.com/questions/46025144/angular4-http-get-parse-error
  // JSON is the default expected response type. You can try forcing using "text" instead and print the result
  // just to understand what is happening
  // this.http.get('http://www.iciba.com/index.php', {params: hps, responseType: 'text'}).subscribe
  translateX(srcText: string, translate: TranslateModel, docInfo: DocInfoModel): Observable<TranslateResult> {
    const params = {
      f: docInfo.source_lang,
      t: docInfo.target_lang,
      w: srcText
    };

    const data = querystring.stringify(params);
    const hdrs = new HttpHeaders({
      'Content-Length': data.length,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    });

    return Observable.create(observer => {
      this.http.post('http://fy.iciba.com/ajax.php?a=fy', data, {headers: hdrs}).subscribe(
        res => {
          if (res['status'] === 1) {
            translate.target_text = res['content']['out'];
            if (translate.target_text.endsWith('<br/>')) {
              translate.target_text = translate.target_text.slice(0, -5);
              translate.trans_grade = 3;
            }
          } else if (res['status'] === 0) {
            translate.target_text = res['content']['word_mean'].join(' / ');
            translate.trans_grade = 1;  // 单词翻译模式，仅供参考
          } else {
            observer.error('iCIBA translate error');
            return;
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
