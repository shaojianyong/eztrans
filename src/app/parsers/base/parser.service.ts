import {Observable} from 'rxjs/Observable';

export abstract class ParserService {

  abstract parse(data: string): Observable<any>;

  abstract update(segments: Array<string>): void;

  abstract getLastData(dataType: string): string;
}
