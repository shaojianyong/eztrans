import { Injectable } from '@angular/core';
import { TranslateModel } from '../../services/model/translate.model';
import { TranslateService } from '../base/translate.service';
import { GoogleTranslateService } from '../google/google-translate.service';
import { BaiduFanyiService } from '../baidu/baidu-fanyi.service';
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
  engine_list: Array<TranslateService>;

  constructor(
    private google: GoogleTranslateService,
    private baidu: BaiduFanyiService,
    private iciba: IcibaTransService
    ) {
    this.engine_list = [google, baidu];
  }

  getEngine(name: string) {
    let res = null;
    for (const en of this.engine_list) {
      if (en.getEngineName() === name) {
        res = en;
        break;
      }
    }
    return res;
  }

  getEnabledEngineCount(): number {
    return this.engine_list.length;
  }
}
