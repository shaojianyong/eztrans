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

  // stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  static sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }

}
