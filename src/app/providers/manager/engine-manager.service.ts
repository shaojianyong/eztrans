import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { TranslateModel } from '../../services/model/translate.model';
import { TranslateService } from '../base/translate.service';
import { GoogleTranslateService } from '../google/google-translate.service';
import { BaiduFanyiService } from '../baidu/baidu-fanyi.service';
import { BaiduVipfyService} from '../baidu/baidu-vipfy.service';

@Injectable()
export class EngineManagerService {
  source_lang = 'auto';
  target_lang = 'zh';
  engine_list: Array<TranslateService>;

  constructor(
    private google: GoogleTranslateService,
    private baidu: BaiduFanyiService,
    private baiduvip: BaiduVipfyService
    ) {
    this.engine_list = [baiduvip];  // google, baidu
  }

  setSourceLanguage(language: string): void {
    this.source_lang = language;
  }

  setTargetLanguage(language: string): void {
    this.target_lang = language;
  }

  // engine_filter: all, google, -google
  translate(source_text: string, engine_filter = 'all'): Observable<TranslateModel> {
    return Observable.create(observer => {
      for (const ts of this.engine_list) {
        if ((engine_filter === 'all' || engine_filter === ts.getEngineName()) ||
          (engine_filter[0] === '-' && engine_filter.slice(1) !== ts.getEngineName())) {
          ts.translate(source_text, this.source_lang, this.target_lang).subscribe(
            res => observer.next(res),
            err => observer.error(err)
          );
        }
      }
    });
  }
}
