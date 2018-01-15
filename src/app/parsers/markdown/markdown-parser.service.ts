import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const { Converter }  = (<any>window).require('showdown');
const TurndownService = (<any>window).require('turndown');
import { HtmlParserService } from '../html/html-parser.service';


@Injectable()
export class MarkdownParserService extends HtmlParserService {

  parse(data: string): Observable<any> {
    const htmlText = (new Converter()).makeHtml(data);
    return super.parse(htmlText);
  }

  update(segments: Array<string>): void {
    super.update(segments);
  }

  getLastData(dataType: string): string {
    let res = null;
    const htmlText = super.getLastData(dataType);
    if (dataType === 'html') {
      res = htmlText;
    } else if (dataType === 'md') {
      res = (new TurndownService()).turndown(htmlText);
    }
    return res;
  }

}
