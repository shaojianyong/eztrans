import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
const { JSDOM } = (<any>window).require('jsdom');
const { DOMParser, XMLSerializer } = (<any>window).require('xmldom');
import { ParserService } from '../base/parser.service';

const SKIP_ELEMENTS = ['style', 'script', 'pre', 'code', 'noscript'];


function getHtmlNodeTexts(node: any, nodeTexts: Array<string>): void {
  for (let i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      if (childNode.nodeValue.trim()) {
        nodeTexts.push(childNode.nodeValue);
      }
    } else if (childNode.hasChildNodes()) {
      getHtmlNodeTexts(childNode, nodeTexts);
    }
  }
}

// stackoverflow.com/questions/32850812/node-xmldom-how-do-i-change-the-value-of-a-single-xml-field-in-javascript
function setHtmlNodeTexts(node: any, newData: any): void {
  for (let i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      if (childNode.nodeValue.trim()) {
        (<any>childNode).data = newData.texts[newData.index];
        newData.index++;
      }
    } else if (childNode.hasChildNodes()) {
      setHtmlNodeTexts(childNode, newData);
    }
  }
}

function isMiniTranslateUnit(node: any): boolean {
  let hasTextChildNode = false;
  let hasThirdGenChild = false;
  for (let i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      if (childNode.nodeValue.trim()) {
        hasTextChildNode = true;
      }
    } else if (childNode.hasChildNodes()) {
      if (childNode.childNodes.length > 1 || (childNode.childNodes.length
          && childNode.childNodes[0].nodeType !== Node.TEXT_NODE)) {
        hasThirdGenChild = true;
      }
    }
  }
  return (hasTextChildNode && !hasThirdGenChild);
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
    if (!node.hasChildNodes()) {
      return;
    }
    if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      if (isMiniTranslateUnit(node)) {
        const mue = {source: []};
        getHtmlNodeTexts(node, mue.source);
        if (mue.source.length > 1) {
          const serial = new XMLSerializer();
          mue['elhtml'] = serial.serializeToString(node);
        }
        observer.next(mue);
      } else {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseR(node.childNodes[i], observer);
        }
      }
    }
  }

  traverseW(node: Node, newData: any): void {
    if (!node.hasChildNodes()) {
      return;
    }
    if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) === -1) {
      if (isMiniTranslateUnit(node)) {
        setHtmlNodeTexts(node, newData);
      } else {
        for (let i = 0; i < node.childNodes.length; ++i) {
          this.traverseW(node.childNodes[i], newData);
        }
      }
    }
  }

}
