import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
const { DOMParser, XMLSerializer } = (<any>window).require('xmldom');
import { ParserService } from '../base/parser.service';

const SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];

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
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed) {
        observer.next({
          source: trimmed
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

  // stackoverflow.com/questions/32850812/node-xmldom-how-do-i-change-the-value-of-a-single-xml-field-in-javascript
  traverseW(node: Node, newData: any): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();
      if (trimmed) {
        const newVal = newData.texts[newData.index];
        if (newVal !== null) {
          (<any>node).data = node.nodeValue.replace(trimmed, newVal.trim());  // 保留首尾空白字符
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