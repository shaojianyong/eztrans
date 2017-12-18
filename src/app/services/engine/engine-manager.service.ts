import { Injectable } from '@angular/core';
// 由于translate.google.com被墙，需要手动修改node_modules中的代码，这不符合规矩
// TODO: Fork项目node-google-translate-skidz，发布针对中国大陆的版本
const google_translate = (<any>window).require('node-google-translate-skidz');

@Injectable()
export class GoogleTranslateService {
  source_lang = 'en';
  target_lang = 'zh-cn';

  constructor() { }

  setSourceLanguage(language: string) {
    this.source_lang = language;
  }

  setTargetLanguage(language: string) {
    this.target_lang = language;
  }

  translate(source_text: string, callback: Function): void {
    google_translate({text: source_text, source: this.source_lang, target: this.target_lang}, (result) => {
      console.log(result);
      callback(result.translation);
    });
  }
}
