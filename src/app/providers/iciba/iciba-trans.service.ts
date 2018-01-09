import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TranslateService } from '../base/translate.service';
import { TranslateModel } from '../../services/model/translate.model';
const querystring = (<any>window).require('querystring');


@Injectable()
export class IcibaTransService extends TranslateService {
  constructor(private http: HttpClient) {
    super('iCIBA');
  }

  translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel> {
    const params = {
      f: source_lang,
      t: target_lang,
      w: source_text
    };

    const data = querystring.stringify(params);
    const hdrs = new HttpHeaders({
      'Content-Length': data.length,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    });

    // https://stackoverflow.com/questions/46025144/angular4-http-get-parse-error
    // JSON is the default expected response type. You can try forcing using "text" instead and print the result
    // just to understand what is happening
    // this.http.get('http://www.iciba.com/index.php', {params: hps, responseType: 'text'}).subscribe
    return Observable.create(observer => {
      this.http.post('http://fy.iciba.com/ajax.php?a=fy', data, {headers: hdrs}).subscribe(
        res => {
          const tm = new TranslateModel();
          tm.engine_name = this.getEngineName();
          tm.source_lang = source_lang;
          tm.target_lang = target_lang;
          tm.source_text = source_text;
          if (res['status'] === 1) {
            tm.target_text = res['content']['out'];
            if (tm.target_text.endsWith('<br/>')) {
              tm.target_text = tm.target_text.slice(0, -5);
            }
          } else if (res['status'] === 0) {
            tm.target_text = res['content']['word_mean'].join(' / ');
            tm.trans_state = -1;  // 单词翻译模式，仅供参考
          } else {
            observer.error('iCIBA translate error');
            return;
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
}
