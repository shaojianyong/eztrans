import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
const { DOMParser, XMLSerializer } = (<any>window).require('xmldom');
import { ParserService } from '../base/parser.service';

const SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];


function getHtmlNodeTexts(node: Node, nodeTexts: Array<string>, nodeTags: Array<string>): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim()) {
      nodeTexts.push(node.nodeValue);
      nodeTags.push(node.parentNode.nodeName.toLowerCase());
    }
    return;
  }

  for (let i = 0; i < node.childNodes.length; ++i) {
    getHtmlNodeTexts(node.childNodes[i], nodeTexts, nodeTags);
  }
}

// stackoverflow.com/questions/32850812/node-xmldom-how-do-i-change-the-value-of-a-single-xml-field-in-javascript
export function setHtmlNodeTexts(node: Node, newData: any): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim()) {
      const newVal = newData.texts[newData.index];
      if (newVal && newVal.trim()) {
        (<any>node).data = newVal;
      }
      newData.index++;
    }
    return;
  }

  for (let i = 0; i < node.childNodes.length; ++i) {
    setHtmlNodeTexts(node.childNodes[i], newData);
  }
}

function testMiniTranslateUnit(node: Node): number {
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
export class XhtmlParserService extends ParserService {
  xmldoc: any;

  load(data: string): void {
    const parser = new DOMParser();
    this.xmldoc = parser.parseFromString(data, 'application/xhtml+xml');
  }

  parse(): Observable<any> {
    return Observable.create(observer => {
      try {
        this.traverseR(this.xmldoc, observer);
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
    this.traverseW(this.xmldoc, newData);
  }

  getLastData(dataType: string): string {
    let res = null;
    if (dataType === 'xhtml') {
      const headNode = this.xmldoc.getElementsByTagName('head')[0];
      if (headNode) {
        const baseNode = headNode.getElementsByTagName('base')[0];
        if (baseNode) {
          headNode.removeChild(baseNode);
        }
      }
    }
    const serial = new XMLSerializer();
    res = serial.serializeToString(this.xmldoc);
    if (dataType === 'html') {
      const dom = new JSDOM(res);
      res = dom.window.document.documentElement.outerHTML;
    }
    return res;
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
          const serial = new XMLSerializer();
          mue['txtags'] = txtags;
          mue['elhtml'] = serial.serializeToString(node);
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
