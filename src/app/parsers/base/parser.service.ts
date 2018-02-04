import {Observable} from 'rxjs/Observable';

export abstract class ParserService {

  abstract load(data: string): void;

  abstract parse(): Observable<any>;

  abstract update(segments: Array<string>): void;

  abstract getLastData(dataType: string): string;
}
