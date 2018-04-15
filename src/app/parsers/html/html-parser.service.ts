import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
import { ParserService } from '../base/parser.service';

const SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];


function getHtmlNodeTexts(node: any, nodeTexts: Array<string>, nodeTags: Array<string>): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim()) {
      nodeTexts.push(node.nodeValue);
      nodeTags.push(node.parentElement.tagName.toLowerCase());
    }
    return;
  }

  for (let i = 0; i < node.childNodes.length; ++i) {
    getHtmlNodeTexts(node.childNodes[i], nodeTexts, nodeTags);
  }
}

export function setHtmlNodeTexts(node: any, newData: any): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim()) {
      const newVal = newData.texts[newData.index];
      if (newVal && newVal.trim()) {
        node.nodeValue = newVal;
      }
      newData.index++;
    }
    return;
  }

  for (let i = 0; i < node.childNodes.length; ++i) {
    setHtmlNodeTexts(node.childNodes[i], newData);
  }
}

function testMiniTranslateUnit(node: any): number {
  if (node.nodeType !== Node.DOCUMENT_NODE && !(node.textContent && node.textContent.trim())) {
    return 0;  // non translate-unit, no text node, no translate need
  }
  let hasTextChildNode = false;
  for (let i = 0; i < node.childNodes.length; ++i) {
    if (node.childNodes[i].nodeType === Node.TEXT_NODE && node.childNodes[i].nodeValue.trim()) {
      hasTextChildNode = true;
      break;
    }
  }
  return hasTextChildNode ? 1 : 2;  // 1-mini translate-unit 2-non-mini translate-unit
}


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
    if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
      && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      const testRes = testMiniTranslateUnit(node);
      if (testRes === 1) {
        const mue = {source: []};
        const txtags = [];
        getHtmlNodeTexts(node, mue.source, txtags);
        if (mue.source.length > 1) {
          mue['txtags'] = txtags;
          mue['elhtml'] = (<any>node).outerHTML;
        }
        observer.next(mue);
      } else if (testRes === 2) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseR(node.childNodes[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any): void {
    if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
      && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      const testRes = testMiniTranslateUnit(node);
      if (testRes === 1) {
        setHtmlNodeTexts(node, newData);
      } else if (testRes === 2) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
