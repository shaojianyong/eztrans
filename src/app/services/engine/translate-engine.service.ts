// import { Injectable } from '@angular/core';

// @Injectable()
export interface TranslateEngineService {
  source_lang: string; // = 'en';
  target_lang: string; // = 'zh-cn';

  translate(source_text: string, callback: Function);  // 使用可观察对象
}
