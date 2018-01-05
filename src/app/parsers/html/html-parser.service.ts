import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';

const { JSDOM } = (<any>window).require('jsdom');
const jQuery = require('jquery');

import { ParserService } from '../base/parser.service';


@Injectable()
export class HtmlParserService extends ParserService {
  dom: any;
  $: any;

  constructor() {
    super('html');
  }

  parser(file_data: string): Observable<string> {
    return Observable.create(observer => {
      try {
        this.dom = new JSDOM(file_data);
        this.$ = jQuery(this.dom.window);
        for (const p of this.$('p')) {
          if (p && p.textContent && p.textContent.trim()) {
            observer.next(p.textContent);
          }
        }
      } catch (e) {
        observer.error(e);
      }
    });
  }

  update(segments: Array<string>): void {
    let index = 0;
    for (const p of this.$('p')) {
      if (p && p.textContent && p.textContent.trim()) {
        if (segments[index]) {
          p.textContent = segments[index];
        }
        ++index;
      }
    }
  }

  getLastFileData(): string {
    return this.dom.window.document.documentElement.outerHTML;
  }

}
