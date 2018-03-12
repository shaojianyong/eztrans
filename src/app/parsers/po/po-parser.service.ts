import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

const gettextParser = (<any>window).require('gettext-parser');
import {FunctionUtils} from '../../services/utils/function-utils';
import {ParserService} from '../base/parser.service';


@Injectable()
export class PoParserService extends ParserService {
  po: any;

  load(data: string): void {
    this.po = gettextParser.po.parse(data);  // defaultCharset
  }

  parse(): Observable<any> {
    return Observable.create(observer => {
      try {
        for (const group in this.po.translations) {
          if (this.po.translations.hasOwnProperty(group)) {
            for (const msgKey in this.po.translations[group]) {
              if (this.po.translations[group].hasOwnProperty(msgKey) && msgKey) {
                observer.next({
                  source: this.po.translations[group][msgKey]['msgid'],
                  target: this.po.translations[group][msgKey]['msgstr'][0]
                });
              }
            }
          }
        }
        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    });
  }

  update(segments: Array<string>): void {
    let count = 0;
    for (const group in this.po.translations) {
      if (this.po.translations.hasOwnProperty(group)) {
        for (const msgKey in this.po.translations[group]) {
          if (this.po.translations[group].hasOwnProperty(msgKey) && msgKey) {
            this.po.translations[group][msgKey]['msgstr'][0] = segments[count];
            ++count;
          }
        }
      }
    }
  }

  getLastData(dataType: string): string {
    let res = null;
    if (dataType === 'po') {
      res = gettextParser.po.compile(this.po);
    } else if (dataType === 'mo') {
      res = gettextParser.mo.compile(this.po);
    } else if (dataType === 'html') {
      const head = `<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body {
      font-family: Microsoft YaHei;
      font-size: 0.85em;
      margin: 20px;
    }
    p {
      text-align: justify;
      text-justify: distribute-all-lines;
      text-align-last: left;
      line-height: 1.4285;
    }
  </style>
</head>
`;
      let body = '<body>\r\n';

      /*
      for (const line of this.lines) {
        if (line.trim()) {
          body += `  <p>${FunctionUtils.htmlEscape(line)}</p>\r\n`;
        }
      }
      */
      for (const group in this.po.translations) {
        if (this.po.translations.hasOwnProperty(group)) {
          for (const msgKey in this.po.translations[group]) {
            if (this.po.translations[group].hasOwnProperty(msgKey) && msgKey) {
              body += `  <p>${FunctionUtils.htmlEscape(this.po.translations[group][msgKey]['msgid'])}<br>
${FunctionUtils.htmlEscape(this.po.translations[group][msgKey]['msgstr'][0])}</p>\r\n`;
            }
          }
        }
      }
      res = head + body + '</body>\r\n</html>\r\n';
    }
    return res;
  }

}
