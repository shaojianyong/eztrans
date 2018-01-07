import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const { Converter }  = (<any>window).require('showdown');
const TurndownService = (<any>window).require('turndown');
import { HtmlParserService } from '../html/html-parser.service';


@Injectable()
export class MarkdownParserService extends HtmlParserService {

  constructor() {
    super();
    this.setDataType('markdown');
  }

  parse(data: string): Observable<string> {
    const htmlText = (new Converter()).makeHtml(data);
    return super.parse(htmlText);
  }

  update(segments: Array<string>): void {
    super.update(segments);
  }

  getLastData(): string {
    const htmlText = super.getLastData();
    return (new TurndownService()).turndown(htmlText);
  }

}
