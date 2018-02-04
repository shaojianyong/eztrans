import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

const gettextParser = (<any>window).require('gettext-parser');

import {ParserService} from '../base/parser.service';


@Injectable()
export class PoParserService extends ParserService {
  po: any;

  load(data: string): void {
    this.po = gettextParser.po.parse(data);  // defaultCharset
  }

  parse(): Observable<any> {
    return Observable.create(observer => {
      try {
        for (const group in this.po.translations) {
          if (this.po.translations.hasOwnProperty(group)) {
            for (const msgKey in this.po.translations[group]) {
              if (this.po.translations[group].hasOwnProperty(msgKey) && msgKey) {
                observer.next({
                  source: this.po.translations[group][msgKey]['msgid'],
                  target: this.po.translations[group][msgKey]['msgstr'][0]
                });
              }
            }
          }
        }
        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    });
  }

  update(segments: Array<string>): void {
    let count = 0;
    for (const group in this.po.translations) {
      if (this.po.translations.hasOwnProperty(group)) {
        for (const msgKey in this.po.translations[group]) {
          if (this.po.translations[group].hasOwnProperty(msgKey) && msgKey) {
            this.po.translations[group][msgKey]['msgstr'][0] = segments[count];
            ++count;
          }
        }
      }
    }
  }

  getLastData(dataType: string): string {
    let res = null;
    if (dataType === 'po') {
      res = gettextParser.po.compile(this.po);
    } else if (dataType === 'mo') {
      res = gettextParser.mo.compile(this.po);
    }
    return res;
  }

}
