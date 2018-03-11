import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ParserService} from '../base/parser.service';
import {FunctionUtils} from '../../services/utils/function-utils';

@Injectable()
export class TextParserService extends ParserService {
  lines: Array<string>;
  lfeed: string;

  load(data: string): void {
    if (data.indexOf('\r\n') === -1) {
      this.lfeed = '\n';
    } else {
      this.lfeed = '\r\n';
    }

    this.lines = data.split(/\n|\r\n/g);
  }

  parse(): Observable<any> {
    return Observable.create(observer => {
      try {
        for (let line of this.lines) {
          line = line.trim();
          if (line) {
            observer.next({
              source: line,
              target: null
            });
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
    for (let index = 0; index < this.lines.length; ++index) {
      if (this.lines[index].trim()) {
        if (segments[count] && segments[count].trim()) {
          this.lines[index] = segments[count];
        }
        ++count;
      }
    }
  }

  getLastData(dataType: string): string {
    let res = '';
    if (dataType === 'txt') {
      res = this.lines.join(this.lfeed);
    } else if (dataType === 'html') {
      const head = `<html><head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
	        <title>President Donald J. Trump will Protect American</title>
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
        </head>`;
      let body = '<body>';
      for (const line of this.lines) {
        if (line.trim()) {
          body += `<p>${FunctionUtils.htmlEscape(line)}</p>`;
        }
      }
      res = head + body + '</body></html>';
    }
    return res;
  }

}
