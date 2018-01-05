import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ParserService } from '../base/parser.service';
import { HtmlParserService } from './html/html-parser.service';

@Injectable()
export class ParserManagerService {
  parsers: Object;

  constructor(
    private html_parser: HtmlParserService,
    ) {
    this.parsers = {
      html: html_parser
    };
  }

  getParser(filename): ParserService {
    return this.parsers[];
  }
}
