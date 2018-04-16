const { JSDOM } = (<any>window).require('jsdom');
import { VersionModel, SentenceModel } from './sentence.model';
import { ParserUtils } from '../../parsers/base/parser-utils';

export class AppUtils {
  static getReferTexts(sentence: SentenceModel, refer: VersionModel): Array<string> {
    const res = [];
    if (refer.divides.length === refer.slices.length + 1) {
      for (let i = 0; i < refer.slices.length; ++i) {
        res.push(refer.target.target_text.substring(refer.divides[i], refer.divides[i + 1]));
      }
    } else {
      for (const slice of refer.slices) {
        res.push(slice.target_text);
      }
    }

    for (let i = 0; i < sentence.source.length; ++i) {
      if (sentence.ntsphs[i]) {
        if (res[i] !== sentence.ntsphs[i]) {
          throw new Error(`The placeholder be translated: ${sentence.ntsphs[i]} -> ${res[i]}!`);
        }
        res[i] = sentence.source[i];
      }
    }
    return res;
  }

  static getTargetTexts(sentence: SentenceModel): Array<string> {
    if (sentence.target === -1) {
      return sentence.custom;
    }

    let res = null;
    const refer = sentence.refers[sentence.target];
    if (sentence.source.length === 1) {
      res = [refer.target.target_text];
    } else {
      res = AppUtils.getReferTexts(sentence, refer);
    }
    return res;
  }

  static getNewHtml(sentence: SentenceModel, newTexts: Array<string>): string {
    if (newTexts.length === 1) {
      return newTexts[0];
    }

    const frag = JSDOM.fragment(sentence.elhtml);
    const newData = {
      texts: newTexts,
      index: 0
    };
    ParserUtils.setHtmlNodeTexts(frag.firstChild, newData);
    return frag.firstChild.innerHTML;
  }

  static getReferHtml(sentence: SentenceModel, refer: VersionModel): string {
    const tgtTexts = AppUtils.getReferTexts(sentence, refer);
    return AppUtils.getNewHtml(sentence, tgtTexts);
  }

  static getCustomHtml(sentence: SentenceModel): string {
    return AppUtils.getNewHtml(sentence, sentence.custom);
  }

  static getTargetHtml(sentence: SentenceModel): string {
    const tgtTexts = AppUtils.getTargetTexts(sentence);
    return AppUtils.getNewHtml(sentence, tgtTexts);
  }

}
