export class FunctionUtils {

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

  static findOverlap1(a: string, b: string): string {
    if (b.length === 0) {
      return '';
    }
    if (a.endsWith(b)) {
      return b;
    }
    if (a.indexOf(b) >= 0) {
      return b;
    }
    return this.findOverlap1(a, b.substring(0, b.length - 1));
  }

  static findOverlap2(a: string, b: string): string {
    if (b.length === 0) {
      return '';
    }
    if (a.startsWith(b)) {
      return b;
    }
    if (a.indexOf(b) >= 0) {
      return b;
    }
    return this.findOverlap2(a, b.substring(1));
  }

  static findLongerOverlap(a: string, b: string): string {
    const pb = this.pruneSecondStr(a, b);
    const sub1 = this.findOverlap1(a, pb);
    const sub2 = this.findOverlap2(a, pb);
    return (sub1.length >= sub2.length) ? sub1 : sub2;
  }

  // stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  static sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }

}
