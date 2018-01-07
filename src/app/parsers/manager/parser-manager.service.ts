import { Injectable } from '@angular/core';
import { ParserService } from '../base/parser.service';
import { HtmlParserService } from '../html/html-parser.service';
import { TextParserService } from '../text/text-parser.service';
import { MarkdownParserService } from '../markdown/markdown-parser.service';

@Injectable()
export class ParserManagerService {
  parsers: Object;

  constructor(
    private html_parser: HtmlParserService,
    private text_parser: TextParserService,
    private md_parser: MarkdownParserService
    ) {
    this.parsers = {
      html: html_parser,
      htm: html_parser,
      txt: text_parser,
      md: md_parser
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
