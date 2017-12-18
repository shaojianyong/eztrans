import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

const querystring = (<any>window).require('querystring');

@Injectable()
export class BaiduFanyiService {
  source_lang = 'en';
  target_lang = 'zh';

  constructor(private http: HttpClient) {
  }

  setSourceLanguage(language: string) {
    this.source_lang = language;
  }

  setTargetLanguage(language: string) {
    this.target_lang = language;
  }

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
  }
}
