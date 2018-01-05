import {Observable} from 'rxjs/Observable';

export abstract class ParserService {
  constructor(private file_type: string) {
  }

  getFileType(): string {
    return this.file_type;
  }

  abstract parser(file_data: string): Observable<string>;

  abstract update(segments: Array<string>): void;

  abstract getLastFileData(): string;
}
