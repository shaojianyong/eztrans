import { Injectable } from '@angular/core';
import { ParserService } from '../base/parser.service';
import { HtmlParserService } from '../html/html-parser.service';
import { TextParserService } from '../text/text-parser.service';

@Injectable()
export class ParserManagerService {
  parsers: Object;

  constructor(
    private html_parser: HtmlParserService,
    private text_parser: TextParserService
    ) {
    this.parsers = {
      html: html_parser,
      txt: text_parser
    };
  }

  getParser(data_type: string): ParserService {
    let parser: ParserService;
    if (data_type in this.parsers) {
      parser = this.parsers[data_type];
    } else {
      parser = this.text_parser;
    }
    return parser;
  }

}
