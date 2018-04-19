const urlRegex = (<any>window).require('url-regex');
const emailRegex = (<any>window).require('email-regex');


export class FunctionUtils {
  static ContentType = Object.freeze({
    NONE: 0,
    URL: 1,
    EMAIL: 2,
    TEXT: 10000
  });

  // 0 < translate-needless < 10000
  static getContentType(str: string): number {
    const trimmed = str.trim();
    if (!trimmed) {
      return FunctionUtils.ContentType.NONE;
    }

    let res = FunctionUtils.ContentType.TEXT;
    if (urlRegex({exact: true, strict: false}).test(trimmed)) {
      res = FunctionUtils.ContentType.URL;
    } else if (emailRegex({exact: true}).test(trimmed)) {
      res = FunctionUtils.ContentType.EMAIL;
    }

    return res;
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

  static pruneSecondStr(str1: string, str2: string): string {
    let fr = 0;
    let to = str2.length;
    while (fr !== str2.length && str1.indexOf(str2[fr]) === -1) {
      ++fr;
    }
    if (fr < str2.length - 1) {
      while (to !== 0 && str1.indexOf(str2[to - 1]) === -1) {
        --to;
      }
    }
    return str2.substring(fr, to);
  }

  static findOverlap1(a: string, b: string): [number, number] {
    if (b.length === 0) {
      return null;
    }
    const index = a.indexOf(b);
    if (index >= 0) {
      return [index, index + b.length];
    }
    return this.findOverlap1(a, b.substring(0, b.length - 1));
  }

  static findOverlap2(a: string, b: string): [number, number] {
    if (b.length === 0) {
      return null;
    }
    const index = a.indexOf(b);
    if (index >= 0) {
      return [index, index + b.length];
    }
    return this.findOverlap2(a, b.substring(1));
  }

  static findOverlap3(a: string, b: string): [number, number] {
    if (b.length === 0) {
      return null;
    }
    const index = a.lastIndexOf(b);
    if (index >= 0) {
      return [index, index + b.length];
    }
    return this.findOverlap3(a, b.substring(0, b.length - 1));
  }

  static findOverlap4(a: string, b: string): [number, number] {
    if (b.length === 0) {
      return null;
    }
    const index = a.lastIndexOf(b);
    if (index >= 0) {
      return [index, index + b.length];
    }
    return this.findOverlap4(a, b.substring(1));
  }

  static findLongerOverlap(a: string, b: string): [number, number] {
    const pb = this.pruneSecondStr(a, b);
    const sub1 = this.findOverlap1(a, pb);
    const sub2 = this.findOverlap2(a, pb);
    return (sub1[1] - sub1[0] >= sub2[1] - sub2[0]) ? sub1 : sub2;
  }

  static reverseFindLongerOverlap(a: string, b: string): [number, number] {
    const pb = this.pruneSecondStr(a, b);
    const sub1 = this.findOverlap3(a, pb);
    const sub2 = this.findOverlap4(a, pb);
    return (sub1[1] - sub1[0] >= sub2[1] - sub2[0]) ? sub1 : sub2;
  }

  // stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  static sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }

}
