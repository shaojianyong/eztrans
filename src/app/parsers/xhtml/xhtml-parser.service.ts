import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
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
    return serial.serializeToString(this.xmldoc);
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

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseR(node.childNodes[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any): void {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue.trim()) {
        const newVal = newData.texts[newData.index];
        if (newVal !== null) {
          node.nodeValue = newVal.trim();
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
