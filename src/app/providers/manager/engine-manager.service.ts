import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TranslateModel } from '../../services/model/translate.model';
import { TranslateService } from '../base/translate.service';
import { GoogleTranslateService } from '../google/google-translate.service';
import { BaiduFanyiService } from '../baidu/baidu-fanyi.service';
import { BaiduVipfyService } from '../baidu/baidu-vipfy.service';
import { IcibaTransService } from '../iciba/iciba-trans.service';

export class TransResult {
  trans: TranslateModel;
  docId: string;

  constructor(obj?: any) {
    this.trans = obj && obj.trans || null;
    this.docId = obj && obj.docId || null;
  }
}


@Injectable()
export class EngineManagerService {
  source_lang = 'auto';
  target_lang = 'zh';
  engine_list: Array<TranslateService>;

  constructor(
    private google: GoogleTranslateService,
    private baidu: BaiduFanyiService,
    private baiduvip: BaiduVipfyService,
    private iciba: IcibaTransService
    ) {
    this.engine_list = [google, iciba];  // google, baidu, baiduvip, iciba
  }

  setSourceLanguage(language: string): void {
    this.source_lang = language;
  }

  setTargetLanguage(language: string): void {
    this.target_lang = language;
  }

  getSourceLanguage(): string {
    return this.source_lang;
  }

  getTargetLanguage(): string {
    return this.target_lang;
  }

  getEnabledEngineCount(): number {
    return this.engine_list.length;
  }

  translate(engine: TranslateService, source_text: string, doc_id = ''): Observable<TransResult> {
    return Observable.create(observer => {
      engine.translate(source_text, this.source_lang, this.target_lang).subscribe(
        res => observer.next(new TransResult({trans: res, docId: doc_id})),
        err => observer.error(new TransResult({trans: err, docId: doc_id}))
      );
    });
  }
}
