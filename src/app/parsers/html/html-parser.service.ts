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

  getLastData(): string {
    return this.dom.window.document.documentElement.outerHTML;
  }


  traverseR(node: Node, observer) {
    if (node.nodeType === Node.TEXT_NODE) {
      const str = node.nodeValue.trim();
      if (str && str.length > 1) {  // TODO: 进一步三选需要翻译的情况
        observer.next(str);
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const nodeList = node.childNodes;
      for (let i = 0; i < nodeList.length; ++i) {
        if (node.nodeName.toLowerCase() !== 'script') {
          this.traverseR(nodeList[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any) {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed && trimmed.length > 1) {  // TODO: 进一步三选需要翻译的情况
        const newVal = newData.texts[newData.index];
        if (newVal) {
          if (trimmed === node.nodeValue) {
            node.nodeValue = newVal;
          } else {
            node.nodeValue.replace(trimmed, newVal);  // 恢复空白字符
          }
        }
        newData.index++;
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const nodeList = node.childNodes;
      for (let i = 0; i < nodeList.length; ++i) {
        if (node.nodeName.toLowerCase() !== 'script') {
          this.traverseW(nodeList[i], newData);
        }
      }
    }
  }

}
