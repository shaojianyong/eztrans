import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
import { ParserUtils } from '../base/parser-utils';
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
    if ((node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE)
      && SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      const testRes = ParserUtils.testMiniTranslateUnit(node);
      if (testRes === 1) {
        const mue = {source: []};
        const txtags = [];
        ParserUtils.getHtmlNodeTexts(node, mue.source, txtags);
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
      const testRes = ParserUtils.testMiniTranslateUnit(node);
      if (testRes === 1) {
        ParserUtils.setHtmlNodeTexts(node, newData);
      } else if (testRes === 2) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
