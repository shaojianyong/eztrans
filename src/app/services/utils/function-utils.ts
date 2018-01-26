export class FunctionUtils {

  static htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#27;')
      .replace(/\//g, '&#2f;');
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
}
