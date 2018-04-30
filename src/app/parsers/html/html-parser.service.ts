import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
import { ParserUtils } from '../base/parser-utils';
import { ParserService } from '../base/parser.service';
import { SentenceModel } from '../../services/model/sentence.model';

const SKIP_ELEMENTS = (<any>window).require('./assets/skip_elements');


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

  update(sentences: Array<SentenceModel>): void {
    const newData = {
      sentences: sentences,
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
        const sentence = new SentenceModel({srcmtu: (<any>node).outerHTML});
        ParserUtils.getHtmlNodeTexts(node, sentence.slices, node.textContent);
        if (ParserUtils.needTranslate(sentence.slices)) {
          observer.next(sentence);
        }
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
        const slices = [];
        ParserUtils.getHtmlNodeTexts(node, slices, node.textContent);
        if (ParserUtils.needTranslate(slices)) {
          (<any>node).outerHTML = newData.sentences[newData.index++].dstmtu;
        }
      } else if (testRes === 2) {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
