import {SentenceModel, SliceNode} from '../../services/model/sentence.model';
const SKIP_ELEMENTS = (<any>window).require('./assets/skip_elements');
const SKIP_CONTENT_REGEX = (<any>window).require('./assets/skip_contents');

export class ParserUtils {

  static needTranslate(slices: Array<SliceNode>) {
    let res = false;
    for (const slice of slices) {
      if (!slice.plcHldr) {
        res = true;
        break;
      }
    }
    return res;
  }

  static getHtmlNodeTexts(node: Node, slices: Array<SliceNode>, wholeText: string): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.nodeValue.trim();  // NO-BREAK SPACE (0x00a0) will be trimmed
      if (trimmed) {
        let nodeText = node.nodeValue;
        if (SKIP_ELEMENTS.indexOf(node.nodeName.toLowerCase()) !== -1 || trimmed.match(SKIP_CONTENT_REGEX)) {
          let placeholder = `X${slices.length}`;
          while (wholeText.indexOf(placeholder) !== -1) {
            placeholder += `.${slices.length}`;
          }
          slices.push(new SliceNode({
            orgText: nodeText,
            tagName: node.parentNode.nodeName.toLowerCase(),
            plcHldr: placeholder
          }));
        } else {
          nodeText = nodeText.replace(/\r\n|\n/g, ' ');
          nodeText = nodeText.replace(/\s{2,}/g, ' ').trim();
          slices.push(new SliceNode({
            orgText: nodeText,
            tagName: node.parentNode.nodeName.toLowerCase()
          }));
        }
      }
      return;
    }

    for (let i = 0; i < node.childNodes.length; ++i) {
      ParserUtils.getHtmlNodeTexts(node.childNodes[i], slices, wholeText);
    }
  }

  // stackoverflow.com/questions/32850812/node-xmldom-how-do-i-change-the-value-of-a-single-xml-field-in-javascript
  static setHtmlNodeTexts(node: Node, sentence: SentenceModel, xmldom = false): void {

  }

  static testMiniTranslateUnit(node: Node): number {
    if (node.nodeType !== Node.DOCUMENT_NODE && !(node.textContent && node.textContent.trim())) {
      return 0;  // non translate-unit, no text node, no translate need
    }
    let hasTextChildNode = false;
    for (let i = 0; i < node.childNodes.length; ++i) {
      if (node.childNodes[i].nodeType === Node.TEXT_NODE && node.childNodes[i].nodeValue.trim()) {
        hasTextChildNode = true;
        break;
      }
    }
    return hasTextChildNode ? 1 : 2;  // 1-mini translate-unit 2-non-mini translate-unit
  }
}
