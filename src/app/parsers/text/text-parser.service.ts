import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ParserService} from '../base/parser.service';


@Injectable()
export class TextParserService extends ParserService {
  lines: Array<string>;

  constructor() {
    super('text');
  }

  parse(data: string): Observable<string> {
    return Observable.create(observer => {
      try {
        this.lines = data.split(/\n|\r\n/g);
        for (let line of this.lines) {
          line = line.trim();
          if (line) {
            observer.next(line);
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

  getLastData(): string {
    return this.lines.join('\r\n');  // TODO: \n for linux，根据平台选择换行符
  }

}
