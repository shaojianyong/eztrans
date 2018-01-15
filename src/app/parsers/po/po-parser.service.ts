import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';

const gettextParser = (<any>window).require('gettext-parser');

import { ParserService } from '../base/parser.service';


@Injectable()
export class PoParserService extends ParserService {
  po: any;

  parse(data: string): Observable<any> {
    return Observable.create(observer => {
      try {
        this.po = gettextParser.po.parse(data);  // defaultCharset
        for (const msgkey in this.po.translations['']) {
          if (msgkey) {
            observer.next({
              source: this.po.translations[''][msgkey]['msgid'],
              target: this.po.translations[''][msgkey]['msgstr'][0]
            });
            // assert this.po.translations[''][msgkey]['msgstr'].length === 1
            // assert msgkey === this.po.translations[''][msgkey]['msgid']
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
    for (const msgkey in this.po.translations['']) {
      if (msgkey) {
        this.po.translations[''][msgkey]['msgstr'][0] = segments[count];
        ++count;
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
