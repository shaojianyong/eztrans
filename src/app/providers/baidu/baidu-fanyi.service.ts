import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TranslateService} from '../base/translate.service';
import {TranslateModel} from '../../services/model/translate.model';

const querystring = (<any>window).require('querystring');


@Injectable()
export class BaiduFanyiService extends TranslateService {
  constructor(private http: HttpClient) {
    super('Baidu');
  }

  translate(source_text: string, source_lang: string, target_lang: string): Observable<TranslateModel> {
    const params = {
      from: source_lang,
      to: target_lang,
      query: source_text,
      simple_means_flag: 3,
      sign: '54706.276099',
      token: '26dbe50b8c71437e9bf5d1c5372dcd59'
    };

    const data = querystring.stringify(params);
    const head = new HttpHeaders({
      'Host': 'fanyi.baidu.com',
      'Connection': 'keep-alive',
      'Content-Length': data.length,
      'Accept': '*/*',
      'Origin': 'http://fanyi.baidu.com',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': 'http://fanyi.baidu.com/',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,zh;q=0.8,zh-CN;q=0.7'
    });

    return Observable.create(observer => {
      this.http.post('http://fanyi.baidu.com/v2transapi', data, {headers: head}).subscribe(
        res => {
          if (res['trans_result']['status'] === 0) {
            const tm = new TranslateModel();
            tm.engine_name = this.getEngineName();
            tm.source_lang = source_lang;
            tm.target_lang = target_lang;
            tm.source_text = source_text;
            tm.target_text = res['trans_result']['data'][0]['dst'];
            observer.next(tm);
          } else {
            observer.error(res['trans_result']);
          }
        },
        err => {
          observer.error(err);
        },
        () => {
          observer.complete();
        });
    });
  }

  /*
  translate(source_text: string, callback: Function): void {
    const params = {
      from: this.source_lang,
      to: this.target_lang,
      query: source_text
    };

    const data = querystring.stringify(params);
    const head = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      'Content-Length': data.length
    });
    this.http.post('http://fanyi.baidu.com/v2transapi', data, {headers: head}).subscribe(res => {
        if (res['trans_result']['status'] === 0) {
          callback(res['trans_result']['data'][0]['dst']);
        } else {
          callback(res['trans_result']);
        }
      },
      err => {
        callback(err);
      },
      () => {
        // console.log('The POST observable is now completed');
      });
  }*/
}
