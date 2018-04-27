import {Observable} from 'rxjs/Observable';
import {SentenceModel} from '../../services/model/sentence.model';

export abstract class ParserService {

  abstract load(data: string): void;

  abstract parse(): Observable<any>;

  abstract update(sentences: Array<SentenceModel>): void;

  abstract getLastData(dataType: string): string;
}
