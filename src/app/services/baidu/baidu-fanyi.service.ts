import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const querystring = (<any>window).require('querystring');

@Injectable()
export class BaiduFanyiService {
  source_lang = 'en';
  target_lang = 'zh';

  constructor(private http: HttpClient) { }

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
    this.http.post('http://fanyi.baidu.com/v2transapi', data).subscribe();
  }
}
