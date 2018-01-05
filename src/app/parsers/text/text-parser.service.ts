import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ParserService} from '../base/parser.service';


@Injectable()
export class TextParserService extends ParserService {
  lines: Array<string>;

  constructor() {
    super('text');
  }

  parser(data: string): Observable<string> {
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
    let index = 0;
    for (let line of this.lines) {
      if (line.trim() && segments[index]) {
        line = segments[index];
      }
      ++index;
    }
  }

  getLastData(): string {
    return this.lines.join('\n');
  }

}
