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

  getExportInfo(dataType: string): any {
    let dlgTitle = '';
    let xFilters = [];

    switch (dataType) {
      case 'html':
        dlgTitle = 'Export HTML file';
        xFilters = [{name: `HTML File (*.${dataType})`, extensions: [dataType]}];
        break;
      case 'txt':
        dlgTitle = 'Export Text file';
        xFilters = [{name: `Text File (*.${dataType})`, extensions: [dataType]}];
        break;
      case 'md':
        dlgTitle = 'Export HTML or Markdown file';
        xFilters = [
          {name: `HTML File (*.html)`, extensions: ['html']},
          {name: `Markdown File (*.${dataType})`, extensions: [dataType]}
          ];
        break;
      default:
        console.log('Export info not found');  // TODO: 抛出异常
        break;
    }
    return {
      title: dlgTitle,
      filters: xFilters
    };
  }

}
