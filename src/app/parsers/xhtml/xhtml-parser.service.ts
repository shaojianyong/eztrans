import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
const { DOMParser, XMLSerializer } = (<any>window).require('xmldom');
import { ParserUtils } from '../base/parser-utils';
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
    if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
      && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      const testRes = ParserUtils.testMiniTranslateUnit(node);
      if (testRes === 1) {
        const mue = {source: []};
        const txtags = [];
        ParserUtils.getHtmlNodeTexts(node, mue.source, txtags);
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
      const testRes = ParserUtils.testMiniTranslateUnit(node);
      if (testRes === 1) {
        ParserUtils.setHtmlNodeTexts(node, newData, true);
      } else if (testRes === 2) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
