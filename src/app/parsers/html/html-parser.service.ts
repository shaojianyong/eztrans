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

  // 匹配最小翻译单元模式
  matchMiniUnitPattern(node: any): boolean {
    let hasTextChildNode = false;
    let hasThirdGenChild = false;
    for (let i = 0; i < node.childNodes.length; ++i) {
      const childNode = node.childNodes[i];
      if (childNode.nodeType === Node.TEXT_NODE) {
        if (childNode.nodeValue.trim()) {
          hasTextChildNode = true;
        }
      } else {
        if (childNode.childNodes.length > 1 || (childNode.childNodes.length
            && childNode.childNodes[0].nodeType !== Node.TEXT_NODE)) {
          hasThirdGenChild = true;
        }
      }
    }
    return (hasTextChildNode && !hasThirdGenChild);
  }

  traverseR(node: Node, observer): void {
    if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        if (this.matchMiniUnitPattern(node)) {
          observer.next({
            source: node.textContent,
            target: null
          });
        } else {
          for (let i = 0; i < node.childNodes.length; ++i) {
            this.traverseR(node.childNodes[i], observer);
          }
        }
      }
    }
  }

  traverseW(node: Node, newData: any): void {
    /*if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed) {
        const newVal = newData.texts[newData.index];
        if (newVal !== null) {
          node.nodeValue = node.nodeValue.replace(trimmed, newVal.trim());  // 保留首尾空白字符
        }
        newData.index++;
      }
    }*/

    /*if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        if (this.hasTextChildNode(node)) {
          node.textContent = newData.texts[newData.index];
          newData.index++;
        } else {
          for (let i = 0; i < node.childNodes.length; ++i) {
            this.traverseW(node.childNodes[i], newData);
          }
        }
      }
    }*/
  }

}
