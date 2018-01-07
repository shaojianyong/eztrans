import {Observable} from 'rxjs/Observable';

export abstract class ParserService {
  constructor(private data_type: string) {
  }

  getDataType(): string {
    return this.data_type;
  }

  abstract parse(data: string): Observable<string>;

  abstract update(segments: Array<string>): void;

  abstract getLastData(): string;
}
