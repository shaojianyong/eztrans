// import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';



// @Injectable()
export interface TranslateService {
  source_lang: string; // = 'en';
  target_lang: string; // = 'zh-cn';

  translate(source_text: string);  // 使用可观察对象
}
