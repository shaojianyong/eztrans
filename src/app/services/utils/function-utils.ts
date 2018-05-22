const urlRegex = (<any>window).require('url-regex');
const emailRegex = (<any>window).require('email-regex');
const pathTest = (<any>window).require('is-valid-path');

export class FunctionUtils {
  static ContentType = Object.freeze({
    NONE: 0,
    URL: 1,
    PATH: 2,
    EMAIL: 3,
    TEXT: 10000
  });

  // 0 < translate-needless < 10000
  static getContentType(text: string): number {
    const str = text.trim();
    if (!str) {
      return FunctionUtils.ContentType.NONE;
    }

    if (urlRegex({exact: true, strict: false}).test(str)) {
      return FunctionUtils.ContentType.URL;
    }

    if (emailRegex({exact: true}).test(str)) {
      return FunctionUtils.ContentType.EMAIL;
    }

    if (str.indexOf(' ') === -1
      && (str.indexOf('\\') !== -1 || str.indexOf('/') !== -1 || str.lastIndexOf('.') !== -1)) {
      return FunctionUtils.ContentType.PATH;
    }

    return FunctionUtils.ContentType.TEXT;
  }

  static htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;')  // 十进制
      .replace(/\//g, '&#47;');
  }

  static getExtName(filePath: string): string {
    return /\.([^\.]+$)/.exec(filePath)[1];
  }

  static getFileName(filePath: string): string {
    let res = null;
    const ns = filePath.split(/\/|\\/);
    if (ns.length) {
      res = ns[ns.length - 1];
    }
    return res;
  }

  static getBaseDir(dir: string): string {
    let index = dir.lastIndexOf('/');
    if (index === -1) {
      index = dir.lastIndexOf('\\');
    }
    let res = '.';
    if (index !== -1) {
      res = dir.substr(0, index);
    }
    return res;
  }

  static baiduLangCode(goLangCode: string): string {
    let duLangCode = goLangCode;
    const glc = goLangCode.toLowerCase();

    if (glc === 'zh-cn') {
      duLangCode = 'zh';
    }
    if (glc === 'zh-tw') {
      duLangCode = 'cht';
    }
    return duLangCode;
  }

  static findIntersection(a: string , b: string): {pos: number, len: number} {
    let bestResult = null;
    for (let i = 0; i < a.length - 1; i++) {
      const result = FunctionUtils.findIntersectionFromStart(a.substring(i), b);
      if (result) {
        if (!bestResult) {
          bestResult = result;
        } else {
          if (result.len > bestResult.len) {
            bestResult = result;
          }
        }
      }
      if (bestResult && bestResult.length >= a.length - i) {
        break;
      }
    }
    return bestResult;
  }

  // stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  static sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }

  private static findIntersectionFromStart(a: string , b: string): {pos: number, len: number} {
    for (let i = a.length; i > 0; i--) {
      const d = a.substring(0, i);
      const j = b.indexOf(d);
      if (j >= 0) {
        return ({pos: j, len: i});
      }
    }
    return null;
  }

}
