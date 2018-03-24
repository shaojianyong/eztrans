import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
import { ParserService } from '../base/parser.service';

const SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];

@Injectable()
export class HtmlParserService extends ParserService {
  dom: any;

  load(data: string): void {
    this.dom = new JSDOM(data);
  }

  parse(): Observable<any> {
    return Observable.create(observer => {
      try {
        this.traverseR(this.dom.window.document, observer);
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
    this.traverseW(this.dom.window.document, newData);
  }

  getLastData(dataType: string): string {
    return this.dom.window.document.documentElement.outerHTML;
  }


  traverseR(node: Node, observer): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed) {
        observer.next({
          source: trimmed,
          target: null
        });
      }
    }

    if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseR(node.childNodes[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed) {
        const newVal = newData.texts[newData.index];
        if (newVal !== null) {
          if (trimmed === node.nodeValue) {
            node.nodeValue = newVal;
          } else {
            node.nodeValue.replace(trimmed, newVal);  // 保留首尾空白字符
          }
        }
        newData.index++;
      }
    }

    if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
