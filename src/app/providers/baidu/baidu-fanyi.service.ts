import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TranslateService, TranslateResult} from '../base/translate.service';
import {TranslateModel} from '../../services/model/translate.model';
import {FunctionUtils} from '../../services/utils/function-utils';

const querystring = (<any>window).require('querystring');

// jianshu.com/p/38a65d8d3e80
function a(r,o){for(var t=0;t<o.length-2;t+=3){var a=o.charAt(t+2);a=a>="a"?a.charCodeAt(0)-87:Number(a),a="+"===o.charAt(t+1)?r>>>a:r<<a,r="+"===o.charAt(t)?r+a&4294967295:r^a}return r}var C=null;var hash=function(r,_gtk){var o=r.length;o>30&&(r=""+r.substr(0,10)+r.substr(Math.floor(o/2)-5,10)+r.substr(-10,10));var t=void 0,t=null!==C?C:(C=_gtk||"")||"";for(var e=t.split("."),h=Number(e[0])||0,i=Number(e[1])||0,d=[],f=0,g=0;g<r.length;g++){var m=r.charCodeAt(g);128>m?d[f++]=m:(2048>m?d[f++]=m>>6|192:(55296===(64512&m)&&g+1<r.length&&56320===(64512&r.charCodeAt(g+1))?(m=65536+((1023&m)<<10)+(1023&r.charCodeAt(++g)),d[f++]=m>>18|240,d[f++]=m>>12&63|128):d[f++]=m>>12|224,d[f++]=m>>6&63|128),d[f++]=63&m|128)}for(var S=h,u="+-a^+6",l="+-3^+b+-f",s=0;s<d.length;s++)S+=d[s],S=a(S,u);return S=a(S,l),S^=i,0>S&&(S=(2147483647&S)+2147483648),S%=1e6,S.toString()+"."+(S^h)}


@Injectable()
export class BaiduFanyiService extends TranslateService {
  constructor(private http: HttpClient) {
    super('Baidu');
  }

  translateX(translate: TranslateModel, doc_id: string): Observable<TranslateResult> {
    return Observable.create(observer => {
      let gtk = '';
      let token = '';
      $.get('http://fanyi.baidu.com/', data => {
        const lines = data.split(/\n|\r\n/g);
        for (const line of lines) {
          const bgw = `token: '`;
          const pos = line.indexOf(bgw);
          const end = line.indexOf(`',`, pos);
          if (pos !== -1 && end !== -1) {
            token = line.substring(pos + bgw.length, end);
            break;
          }
        }

        for (const line of lines) {
          const bgw = `window.gtk = '`;
          const pos = line.indexOf(bgw);
          const end = line.indexOf(`';`, pos);
          if (pos !== -1 && end !== -1) {
            gtk = line.substring(pos + bgw.length, end);
            break;
          }
        }

        if (token && gtk) {
          const params = {
            from: FunctionUtils.baiduLangCode(translate.source_lang),
            to: FunctionUtils.baiduLangCode(translate.target_lang),
            query: translate.source_text,
            simple_means_flag: 3,
            sign: hash(translate.source_text, gtk),
            token: token
          };

          const qstr = querystring.stringify(params);
          const head = new HttpHeaders({
            'Content-Length': qstr.length,
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept-Language': 'en-US,en;q=0.9,zh;q=0.8,zh-CN;q=0.7'
          });

          this.http.post('http://fanyi.baidu.com/v2transapi', qstr, {headers: head}).subscribe(
            res => {
              if (res['trans_result']['status'] === 0) {
                translate.target_text = res['trans_result']['data'][0]['dst'];
                observer.next({result: 'ok', doc_id: doc_id});
              } else {
                observer.error({result: res['trans_result'], doc_id: doc_id});
              }
            },
            err => {
              observer.error({result: err, doc_id: doc_id});
            },
            () => {
              observer.complete();
            });
        } else {
          observer.error({result: 'Get token failed', doc_id: doc_id});
        }
      });
    });
  }

}
