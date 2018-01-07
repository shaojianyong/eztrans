import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');

import { ParserService } from '../base/parser.service';


@Injectable()
export class HtmlParserService extends ParserService {
  dom: any;

  constructor() {
    super('html');
  }

  parse(data: string): Observable<string> {
    return Observable.create(observer => {
      try {
        this.dom = new JSDOM(data);
        for (const p of this.dom.window.document.querySelectorAll('p')) {
          if (p && p.textContent && p.textContent.trim()) {
            observer.next(p.textContent);
          }
        }
        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    });
  }

  update(segments: Array<string>): void {
    let index = 0;
    for (const p of this.dom.window.document.querySelectorAll('p')) {
      if (p && p.textContent && p.textContent.trim()) {
        if (segments[index]) {
          p.textContent = segments[index];  // TODO: HTML escape
        }
        ++index;
      }
    }
  }

  getLastData(): string {
    return this.dom.window.document.documentElement.outerHTML;
  }

}
