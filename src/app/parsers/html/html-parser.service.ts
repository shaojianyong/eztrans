import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');

import { ParserService } from '../base/parser.service';
import { FunctionUtils } from '../../services/utils/function-utils';

const SKIP_ELEMENTS = ['script', 'pre', 'code'];

@Injectable()
export class HtmlParserService extends ParserService {
  dom: any;

  parse(data: string): Observable<any> {
    return Observable.create(observer => {
      try {
        this.dom = new JSDOM(data);
        this.traverseR(this.dom.window.document.body, observer);
        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    });
  }

  update(segments: Array<string>): void {
    const newData = {
      texts: segments,
      index: 0
    };
    this.traverseW(this.dom.window.document.body, newData);
  }

  getLastData(dataType: string): string {
    return this.dom.window.document.documentElement.outerHTML;
  }


  traverseR(node: Node, observer) {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed && trimmed.length > 1) {
        observer.next({
          source: trimmed,
          target: null
        });
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseR(node.childNodes[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any) {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed && trimmed.length > 1) {
        const newVal = FunctionUtils.htmlEscape(newData.texts[newData.index]);
        if (newVal) {
          if (trimmed === node.nodeValue) {
            node.nodeValue = newVal;
          } else {
            node.nodeValue = node.nodeValue.replace(trimmed, newVal);  // 恢复空白字符
          }
        }
        newData.index++;
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
